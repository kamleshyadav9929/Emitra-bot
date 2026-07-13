# python-telegram-bot 21.x — natively supports latest httpx, no version pinning needed.

import asyncio
import re
import threading
import os
from functools import wraps
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import time as _time

from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from telegram import Update, Bot
from werkzeug.utils import secure_filename

import uuid
import config
import database
import notifier
import bot as bot_handlers
import jwt
try:
    from jwt import PyJWKClient
    HAS_CRYPTO = True
except ImportError:
    PyJWKClient = None
    HAS_CRYPTO = False
    print("WARNING: pyjwt[crypto] (cryptography) is not installed. Clerk RS256 token verification will be disabled.")

jwks_client = None
if HAS_CRYPTO and config.CLERK_JWKS_URL and not config.CLERK_JWT_PUBLIC_KEY:
    try:
        jwks_client = PyJWKClient(config.CLERK_JWKS_URL, timeout=5)
    except Exception as e:
        print(f"JWKS Client initialization failed: {e}")

app = Flask(__name__)
IS_PRODUCTION = os.environ.get("FLASK_ENV", "").lower() == "production"
MAX_UPLOAD_BYTES = 8 * 1024 * 1024
ALLOWED_DOCUMENT_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
ALLOWED_DOCUMENT_TYPES = {"application/pdf", "image/jpeg", "image/png"}
ALLOWED_BROADCAST_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
ALLOWED_BROADCAST_TYPES = {"image/jpeg", "image/png", "image/webp"}
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_BYTES

# ── Manual CORS – bulletproof for PythonAnywhere ─────────────────────────────
# Using @after_request ensures every response (200, 401, 500, OPTIONS …)
# always carries the correct CORS headers.
ALLOWED_ORIGINS = [
    "https://emitra-bot.vercel.app",
    "https://krishnaemitra.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000",
]

def _is_origin_allowed(origin):
    """Allow exact matches OR any *.vercel.app preview URL."""
    if origin in ALLOWED_ORIGINS:
        return True
    # Allow all Vercel preview deployments (emitra-bot-*.vercel.app etc.)
    if origin.startswith("https://") and origin.endswith(".vercel.app"):
        return True
    return False

@app.after_request
def add_cors_headers(response):
    origin = request.headers.get("Origin", "")
    if _is_origin_allowed(origin):
        response.headers["Access-Control-Allow-Origin"]  = origin
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With, Accept"
        response.headers["Access-Control-Max-Age"]       = "86400"
    return response

# Catch-all OPTIONS handler – returns 200 immediately so preflights never
# reach the real route (and never hit token_required).
@app.route("/api/<path:path>", methods=["OPTIONS"])
def handle_preflight(path):
    return jsonify({"ok": True}), 200

@app.errorhandler(Exception)
def handle_exception(e):
    import traceback
    trace = traceback.format_exc()
    print("Unhandled Exception:", trace)
    if IS_PRODUCTION:
        response = jsonify({"error": "Internal server error"})
    else:
        response = jsonify({"error": str(e), "trace": trace})
    response.status_code = 500
    return response


@app.errorhandler(ValueError)
def handle_bad_request(e):
    return jsonify({"success": False, "error": str(e)}), 400

# ── Rate Limiter Setup ────────────────────────────────────────────────────────
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["5000 per day", "1000 per hour"],
    storage_uri="memory://",
)

# Initialize database on startup
database.init_db()



# ── Persistent Bot & Event Loop ──────────────────────────────────────────────
# Creating a Bot() per webhook request was the #1 bottleneck.
# A persistent bot reuses the same HTTP connection pool across requests.
# A persistent event loop avoids per-request loop creation/teardown.
# NO background threads — PythonAnywhere WSGI kills daemon threads.

if not config.TELEGRAM_BOT_TOKEN:
    print("WARNING: TELEGRAM_BOT_TOKEN not set. Bot will not function.")

# Lazy initialization variables
_global_loop = None
_global_bot = None

def _run_event_loop_in_background(loop):
    import asyncio
    asyncio.set_event_loop(loop)
    try:
        loop.run_forever()
    except Exception as e:
        print(f"Background loop crashed: {e}")

def get_bot_and_loop():
    """Lazily initializes the event loop and bot after the WSGI worker has forked."""
    global _global_loop, _global_bot
    if _global_loop is None:
        import asyncio
        import threading
        _global_loop = asyncio.new_event_loop()
        
        # Start the loop in a background thread so it doesn't block WSGI worker
        t = threading.Thread(target=_run_event_loop_in_background, args=(_global_loop,), daemon=True)
        t.start()
        
        if config.TELEGRAM_BOT_TOKEN:
            import os
            from telegram.request import HTTPXRequest
            proxy = os.environ.get("HTTP_PROXY") or os.environ.get("http_proxy")
            if proxy:
                # pyrefly: ignore [unexpected-keyword]
                req = HTTPXRequest(proxy_url=proxy)
                _global_bot = Bot(token=config.TELEGRAM_BOT_TOKEN, request=req)
            else:
                _global_bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
            try:
                future = asyncio.run_coroutine_threadsafe(_global_bot.initialize(), _global_loop)
                future.result(timeout=5.0)
            except Exception as e:
                print(f"Warning: Failed to initialize bot: {e}")
    return _global_bot, _global_loop


# ── Authentication ─────────────────────────────────────────────────────────────

def _extract_bearer_token():
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.split(" ", 1)[1].strip()
    return None


def _decode_local_student_token(token):
    try:
        payload = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
        if payload.get("role") == "student":
            return payload
    except Exception:
        return None
    return None


def _normalize_phone(phone):
    phone = (phone or "").strip().replace(" ", "").replace("-", "")
    if phone.startswith("+"):
        phone = phone[1:]
    return phone[-10:] if len(phone) >= 10 else phone


def _phones_match(a, b):
    return _normalize_phone(a) == _normalize_phone(b)


def _claim_first(payload, *keys):
    for key in keys:
        value = payload.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return ""


def _validate_upload(file, allowed_exts, allowed_content_types, label):
    if not file or not file.filename:
        return None, None, None

    safe_name = secure_filename(file.filename)
    ext = os.path.splitext(safe_name)[1].lower()
    content_type = (file.content_type or "").split(";", 1)[0].lower()

    if ext not in allowed_exts or content_type not in allowed_content_types:
        raise ValueError(f"Invalid {label} file type.")

    file_bytes = file.read(MAX_UPLOAD_BYTES + 1)
    if len(file_bytes) > MAX_UPLOAD_BYTES:
        raise ValueError(f"{label.capitalize()} file is too large.")

    return safe_name, file_bytes, content_type


def _authorized_for_phone(phone):
    token = _extract_bearer_token()
    if not token:
        return False, jsonify({"success": False, "error": "Authentication required."}), 401

    local_payload = _decode_local_student_token(token)
    if local_payload:
        if _phones_match(local_payload.get("phone_number"), phone):
            return True, local_payload, 200
        return False, jsonify({"success": False, "error": "Forbidden."}), 403

    clerk_payload = verify_clerk_token(token)
    if not clerk_payload:
        return False, jsonify({"success": False, "error": "Invalid or expired token."}), 401

    user = database.get_user_by_clerk_id(clerk_payload.get("sub"))
    if user and user.get("role") == "admin":
        return True, user, 200
    if user and _phones_match(user.get("phone"), phone):
        return True, user, 200
    return False, jsonify({"success": False, "error": "Forbidden."}), 403


def verify_clerk_token(token):
    if not HAS_CRYPTO:
        return None
    decode_kwargs = {}
    if config.CLERK_ISSUER:
        decode_kwargs["issuer"] = config.CLERK_ISSUER
    if config.CLERK_AUDIENCE:
        decode_kwargs["audience"] = config.CLERK_AUDIENCE
        decode_options = {"verify_aud": True}
    else:
        decode_options = {"verify_aud": False}

    # Priority 1: High-Performance Offline Verification (No network calls)
    if config.CLERK_JWT_PUBLIC_KEY:
        try:
            payload = jwt.decode(
                token,
                config.CLERK_JWT_PUBLIC_KEY,
                algorithms=["RS256"],
                options=decode_options,
                **decode_kwargs
            )
            return payload
        except Exception as e:
            print(f"Clerk offline token verification failed: {e}")

    # Priority 2: Online Verification (Only if offline key is missing)
    if jwks_client:
        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"],
                options=decode_options,
                **decode_kwargs
            )
            return payload
        except Exception as e:
            print(f"Clerk online token verification failed: {e}")

    return None


def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({"ok": True}), 200
            
        token = _extract_bearer_token()

        if not token:
            return jsonify({"error": "Token is missing. Please log in again."}), 401
            
        payload = verify_clerk_token(token)
        if not payload:
            return jsonify({"error": "Invalid or expired Clerk token."}), 401

        # Security check: verify admin role in DB using Clerk sub (user id)
        clerk_user_id = payload.get("sub")
        user = database.get_user_by_clerk_id(clerk_user_id)
        if not user or user.get("role") != "admin":
            return jsonify({"error": "Forbidden: Admin privileges required."}), 403

        return f(*args, **kwargs)
    return decorated


def student_token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({"ok": True}), 200
            
        token = _extract_bearer_token()

        if not token:
            return jsonify({"error": "Token is missing. Please log in."}), 401

        # 1. Try local student token (HS256)
        payload = _decode_local_student_token(token)
        if payload:
            request.student_payload = payload
            return f(*args, **kwargs)

        # 2. Try Clerk token (RS256)
        clerk_payload = verify_clerk_token(token)
        if clerk_payload:
            clerk_user_id = clerk_payload.get("sub")
            user = database.get_user_by_clerk_id(clerk_user_id)
            if user:
                # Map to match standard student token payload
                request.student_payload = {
                    "sub": user.get("telegram_id") or f"clerk_{clerk_user_id}",
                    "name": user["name"],
                    "phone_number": user["phone"],
                    "role": "student",
                    "clerk_user_id": clerk_user_id,
                    "user_id": user["id"]
                }
                return f(*args, **kwargs)
            else:
                if request.path == "/api/student/onboard":
                    request.student_payload = {
                        "sub": f"clerk_{clerk_user_id}",
                        "clerk_user_id": clerk_user_id,
                        "role": "student"
                    }
                    return f(*args, **kwargs)
                return jsonify({"error": "Clerk user profile not synced. Please sync first."}), 403

        return jsonify({"error": "Invalid or expired token. Please log in."}), 401
    return decorated


# ── FIX #5: Telegram Webhook with secret token verification ───────────────────

@app.route("/webhook", methods=["POST"])
def webhook():
    # Verify Telegram secret token header if WEBHOOK_SECRET is configured
    if config.WEBHOOK_SECRET:
        incoming_token = request.headers.get("X-Telegram-Bot-Api-Secret-Token", "")
        if incoming_token != config.WEBHOOK_SECRET:
            return jsonify({"ok": False, "error": "Unauthorized"}), 403

    try:
        update_data = request.get_json(force=True)
        if not update_data:
            return jsonify({"ok": False, "error": "Empty payload"}), 400

        bot, loop = get_bot_and_loop()

        async def process():
            update = Update.de_json(update_data, bot)

            if update.message and update.message.contact:
                await bot_handlers.contact_handler(update, None)

            elif update.message and (update.message.photo or update.message.document):
                await bot_handlers.document_handler(update, None)

            elif update.message and update.message.text:
                text = update.message.text
                if text.startswith("/start"):
                    await bot_handlers.start_handler(update, None)
                elif text.startswith("/services"):
                    await bot_handlers.services_handler(update, None)
                elif text.startswith("/status"):
                    await bot_handlers.status_handler(update, None)
                elif text.startswith("/change"):
                    await bot_handlers.change_handler(update, None)
                else:
                    await bot_handlers.message_handler(update, None)

            elif update.callback_query:
                await bot_handlers.button_callback_handler(update, None)

        asyncio.run_coroutine_threadsafe(process(), loop)
        return jsonify({"ok": True})

    except Exception as e:
        import traceback
        print("Webhook processing error:")
        traceback.print_exc()
        # Return 200 OK to Telegram so it doesn't retry failed updates indefinitely.
        return jsonify({"ok": False, "error": str(e)}), 200


@app.route("/ping", methods=["GET", "HEAD"])
def ping():
    return jsonify({"ok": True})


# ── Auto-Deploy Webhook ────────────────────────────────────────────────────────
# GitHub calls this URL on every push → pulls latest code → reloads the app.
# Set DEPLOY_SECRET in PythonAnywhere env vars to secure this endpoint.
@app.route("/deploy", methods=["POST"])
def deploy():
    import hmac, hashlib, subprocess, os

    secret = os.environ.get("DEPLOY_SECRET", "")
    if not secret:
        return jsonify({"error": "Deploy webhook is not configured."}), 503

    sig = request.headers.get("X-Hub-Signature-256", "")
    body = request.get_data()
    expected = "sha256=" + hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()
    if not hmac.compare_digest(sig, expected):
        return jsonify({"error": "Unauthorized"}), 403

    try:
        result = subprocess.check_output(
            ["git", "-C", os.path.dirname(os.path.abspath(__file__)), "pull"],
            stderr=subprocess.STDOUT,
        ).decode()
        # Touch the WSGI file to trigger PythonAnywhere auto-reload
        wsgi_path = "/var/www/kamlesh6377_pythonanywhere_com_wsgi.py"
        if os.path.exists(wsgi_path):
            os.utime(wsgi_path, None)
        return jsonify({"ok": True, "output": result})
    except subprocess.CalledProcessError as e:
        return jsonify({"ok": False, "error": e.output.decode()}), 500


@app.route("/debug-env", methods=["GET"])
def debug_env():
    if IS_PRODUCTION:
        return jsonify({"error": "Not found"}), 404
    import os
    import sys
    
    def mask(s):
        if not s:
            return "empty/falsy"
        s = str(s)
        if len(s) <= 10:
            return "short:" + s
        return f"{s[:6]}...{s[-4:]} (len={len(s)})"
        
    info = {
        "cwd": os.getcwd(),
        "sys_path": sys.path,
        "database_file": getattr(database, "__file__", "unknown"),
        "config_file": getattr(config, "__file__", "unknown"),
        "config_url": mask(config.SUPABASE_URL),
        "config_key": mask(config.SUPABASE_KEY),
        "config_token": mask(config.TELEGRAM_BOT_TOKEN),
        "config_webhook_secret": mask(config.WEBHOOK_SECRET),
        "database_supabase": str(database.supabase),
        "database_supabase_type": str(type(database.supabase)),
        "env_keys": list(os.environ.keys()),
    }
    
    # Check parent directory
    parent_dir = os.path.dirname(os.getcwd())
    if os.path.exists(parent_dir):
        info["parent_dir"] = parent_dir
        try:
            info["files_in_parent"] = os.listdir(parent_dir)
        except Exception as e:
            info["files_in_parent_error"] = str(e)
            
    # Try reading .env in cwd
    if os.path.exists(".env"):
        try:
            with open(".env", "r") as f:
                lines = f.readlines()
            info["env_cwd_keys"] = [line.split("=")[0].strip() for line in lines if "=" in line]
        except Exception as e:
            info["env_cwd_read_error"] = str(e)
            
    return jsonify(info)


@app.route("/debug-key", methods=["GET"])
def debug_key():
    """Temporary endpoint to diagnose PEM key parsing on PythonAnywhere."""
    if IS_PRODUCTION:
        return jsonify({"error": "Not found"}), 404
    import os
    raw = os.getenv("CLERK_JWT_PUBLIC_KEY", "")
    normalized = config.CLERK_JWT_PUBLIC_KEY

    # Try to actually parse the normalized key
    parse_result = "NOT_TESTED"
    try:
        jwt.decode("dummy", normalized, algorithms=["RS256"], options={"verify_aud": False})
    except jwt.exceptions.DecodeError as e:
        if "Not enough segments" in str(e):
            parse_result = "KEY_LOADS_OK (token was dummy so decode failed, but key parsed fine)"
        else:
            parse_result = f"KEY_PARSE_FAIL: {e}"
    except jwt.exceptions.InvalidKeyError as e:
        parse_result = f"INVALID_KEY: {e}"
    except Exception as e:
        parse_result = f"OTHER: {type(e).__name__}: {e}"

    return jsonify({
        "raw_env_length": len(raw),
        "raw_env_first_40": repr(raw[:40]),
        "raw_env_has_begin": "-----BEGIN" in raw,
        "raw_env_has_backslash_n": "\\n" in raw,
        "normalized_length": len(normalized),
        "normalized_has_begin": "-----BEGIN" in normalized,
        "normalized_has_real_newlines": "\n" in normalized,
        "normalized_first_60": repr(normalized[:60]),
        "parse_result": parse_result,
        "env_file_loaded_from": config.env_path_root if os.path.exists(config.env_path_root) else (config.env_path_backend if os.path.exists(config.env_path_backend) else "none_found"),
    })

# ── Public API (Unprotected / Rate-Limited) ───────────────────────────────────

@app.route("/api/public/services", methods=["GET"])
def get_public_services():
    return jsonify({"services": database.get_public_services_as_dict()})


@app.route("/api/public/exams", methods=["GET"])
def get_public_exams():
    try:
        exams = database.get_all_exams()
        return jsonify({"exams": exams})
    except Exception as e:
        print(f"Error fetching exams: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/public/announcements", methods=["GET"])
def get_public_announcements():
    try:
        logs = database.get_logs()
    except Exception as e:
        print(f"Error fetching message logs for public announcements: {e}")
        logs = []
    
    announcements = []
    for log in logs:
        exam = log.get("target_exam", "ALL")
        if exam == "ALL":
            title = "General Alert to All Students"
        else:
            title = f"Official Update for {exam} Exam"
            
        announcements.append({
            "id": log.get("id"),
            "title": title,
            "content": log.get("message_text", ""),
            "created_at": log.get("sent_at"),
            "links": None,
            "exam_target": exam
        })
        
    return jsonify({"announcements": announcements})


@app.route("/api/public/config", methods=["GET"])
def get_public_config():
    """Serves front-facing configuration (WA Number, TG Link) to avoid hardcoding on Client."""
    return jsonify({
        "success": True,
        "whatsapp_number": "916377964293",
        "telegram_bot_url": "https://t.me/Kamlesh6377_bot"
    })


@app.route("/api/public/stats", methods=["GET"])
def get_public_stats():
    """Public stats for the landing page (e.g., student counts)."""
    return jsonify({"success": True, "stats": database.get_public_stats()})


@app.route("/api/public/news", methods=["GET"])
def get_public_news():
    """Returns the latest admin broadcasts as public news items for the portal sidebar."""
    logs = database.get_public_news(limit=6)
    return jsonify({"success": True, "news": logs})


@app.route("/api/public/register", methods=["POST"])
@limiter.limit("5 per minute")
def public_register():
    data = request.json or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    exam = data.get("exam", "NONE")

    if not name or not phone:
        return jsonify({"success": False, "error": "Name and Phone are required"}), 400

    # Indian Phone Validation: 10 digits, starts with 6-9
    if not re.match(r"^[6-9]\d{9}$", phone):
        return jsonify({"success": False, "error": "Invalid Indian phone number"}), 400

    success, result = database.register_student_web(name, phone, exam)
    if success:
        return jsonify({"success": True, "message": "Registered successfully!", "id": result})
    else:
        return jsonify({"success": False, "error": result}), 409


_bot_username = None

def get_bot_username():
    global _bot_username
    if _bot_username is None:
        import os
        import asyncio
        bot, loop = get_bot_and_loop()
        if bot:
            try:
                me = loop.run_until_complete(asyncio.wait_for(bot.get_me(), timeout=5.0))
                _bot_username = me.username
            except Exception as e:
                print(f"Error fetching bot info: {e}")
        if _bot_username is None:
            _bot_username = os.environ.get("TELEGRAM_BOT_USERNAME", "Kamlesh6377_bot")
    return _bot_username


@app.route("/api/public/login/token", methods=["POST"])
@limiter.limit("5 per minute")
def public_login_token():
    token = "tg_auth_" + uuid.uuid4().hex
    expires_at = datetime.utcnow() + timedelta(minutes=5)
    
    # Check if request is authenticated (e.g., logged-in Clerk user linking Telegram)
    auth_user_id = None
    if "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            auth_token = auth_header.split(" ")[1]
            payload = verify_clerk_token(auth_token)
            if payload:
                clerk_id = payload.get("sub")
                user = database.get_user_by_clerk_id(clerk_id)
                if user:
                    auth_user_id = user["id"]

    success = database.create_login_token(token, expires_at, auth_user_id)
    if not success:
        return jsonify({"success": False, "error": "Failed to create login session"}), 500
        
    bot_user = get_bot_username()
    bot_url = f"https://t.me/{bot_user}?start=login_{token}"
    return jsonify({
        "success": True,
        "token": token,
        "bot_url": bot_url
    })


@app.route("/api/public/login/status/<token>", methods=["GET"])
def public_login_status(token):
    status_info = database.get_login_token_status(token)
    status = status_info["status"]
    
    if status == "success":
        student = status_info["student"]
        payload = {
            "sub": student["telegram_id"],
            "name": student["name"],
            "phone_number": student["phone_number"],
            "role": "student",
            "exp": datetime.utcnow() + timedelta(days=30)
        }
        jwt_token = jwt.encode(payload, config.JWT_SECRET_KEY, algorithm="HS256")
        user = database.get_user_by_telegram_id(student["telegram_id"])
        subs = database.get_user_exam_subscriptions(user["id"]) if user else []
        return jsonify({
            "success": True,
            "status": "success",
            "token": jwt_token,
            "user": {
                "name": student["name"],
                "phone_number": student["phone_number"],
                "telegram_id": student["telegram_id"],
                "exam_preferences": subs,
                "exam_preference": student["exam_preference"]
            }
        })
        
    return jsonify({
        "success": True,
        "status": status,
        "message": status_info.get("message", "")
    })


@app.route("/api/public/sync-clerk-student", methods=["POST"])
@limiter.limit("20 per minute")
def public_sync_clerk_student():
    token = None
    if "Authorization" in request.headers:
        auth_header = request.headers["Authorization"]
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        return jsonify({"success": False, "error": "Token is missing."}), 401

    payload = verify_clerk_token(token)
    if not payload:
        return jsonify({"success": False, "error": "Invalid Clerk token."}), 401

    clerk_id = payload.get("sub")
    data = request.json or {}
    email = _claim_first(payload, "email", "primary_email_address", "email_address")
    phone = _claim_first(payload, "phone_number", "primary_phone_number")
    name = _claim_first(payload, "name", "full_name", "first_name") or data.get("name", "").strip()

    user = database.sync_clerk_user(clerk_id, email, phone, name, verified_phone=bool(phone))
    if not user:
        return jsonify({"success": False, "error": "Failed to sync user profile."}), 500

    # Backwards compatibility check
    user["phone_number"] = user["phone"]
    subs = database.get_user_exam_subscriptions(user["id"])
    user["exam_preference"] = subs[0] if subs else "NONE"

    return jsonify({
        "success": True,
        "user": {
            "name": user["name"],
            "phone_number": user["phone"],
            "telegram_id": user.get("telegram_id"),
            "exam_preferences": subs,
            "exam_preference": user["exam_preference"]
        }
    })


@app.route("/api/student/profile", methods=["GET"])
@student_token_required
def student_profile():
    telegram_id = request.student_payload.get("sub")
    user = database.get_user_by_telegram_id(telegram_id)
    if not user:
        return jsonify({"success": False, "error": "Student not found"}), 404
        
    subs = database.get_user_exam_subscriptions(user["id"])
    return jsonify({
        "success": True,
        "student": {
            "name": user["name"],
            "phone_number": user["phone"],
            "telegram_id": user["telegram_id"],
            "exam_preferences": subs,
            "exam_preference": subs[0] if subs else "NONE"
        }
    })


@app.route("/api/student/onboard", methods=["POST"])
@student_token_required
def student_onboard():
    data = request.json or {}
    name = data.get("name")
    phone = data.get("phone")
    gender = data.get("gender")
    categories = data.get("exam_preferences", [])
    
    if not name:
        return jsonify({"success": False, "error": "Name is required"}), 400
        
    user_id = request.student_payload.get("user_id")
    clerk_user_id = request.student_payload.get("clerk_user_id")
    
    if user_id:
        user = database.get_user_by_id(user_id)
    elif clerk_user_id:
        user = database.get_user_by_clerk_id(clerk_user_id)
        if not user:
            # Sync / Create the user since they don't exist yet!
            user = database.sync_clerk_user(clerk_user_id, "", "", name)
    else:
        telegram_id = request.student_payload.get("sub")
        user = database.get_user_by_telegram_id(telegram_id)
        
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
        
    # Update profile
    success, msg = database.update_student_profile(user["id"], name, phone, gender)
    if not success:
        return jsonify({"success": False, "error": msg}), 500
        
    # Update exams
    if isinstance(categories, list) and categories:
        database.update_user_exam_subscriptions(user["id"], categories)
    elif categories and not isinstance(categories, list):
        database.update_user_exam_subscriptions(user["id"], [categories])
        
    # Fetch latest user data to return
    updated_user = database.get_user_by_id(user["id"])
    synced = database.get_user_exam_subscriptions(user["id"])
    
    return jsonify({
        "success": True, 
        "student": {
            "name": updated_user["name"],
            "phone_number": updated_user["phone"],
            "telegram_id": updated_user["telegram_id"],
            "exam_preferences": synced,
            "exam_preference": synced[0] if synced else "NONE"
        }
    })


@app.route("/api/student/update-preference", methods=["POST"])
@student_token_required
def student_update_preference():
    data = request.json or {}
    categories = data.get("categories") or data.get("category")
    if not categories:
        return jsonify({"success": False, "error": "Exam selection is required"}), 400
        
    telegram_id = request.student_payload.get("sub")
    user = database.get_user_by_telegram_id(telegram_id)
    if not user:
        return jsonify({"success": False, "error": "User not found"}), 404
        
    if isinstance(categories, list):
        database.update_user_exam_subscriptions(user["id"], categories)
    else:
        database.update_user_exam_subscriptions(user["id"], [categories])
        
    synced = database.get_user_exam_subscriptions(user["id"])
    return jsonify({"success": True, "categories": synced})


@app.route("/api/student/history", methods=["GET"])
@student_token_required
def student_history():
    phone = request.student_payload.get("phone_number")
    history = database.get_student_history(phone)
    return jsonify({"success": True, "history": history})



@app.route("/api/public/check-status", methods=["POST"])
@limiter.limit("10 per minute")
def public_check_status():
    data = request.json or {}
    phone = data.get("phone", "").strip()
    if not phone:
        return jsonify({"success": False, "error": "Phone number required"}), 400

    allowed, payload_or_response, status_code = _authorized_for_phone(phone)
    if not allowed:
        return payload_or_response, status_code

    history = database.get_student_history(phone)
    return jsonify({"success": True, "history": history})


@app.route("/api/public/log-intent", methods=["POST"])
@limiter.limit("10 per minute")
def public_log_intent():
    """Logs a user's intent to apply for a service via WhatsApp from the web portal."""
    data = request.json or {}
    phone    = data.get("phone", "WEB_ANONYMOUS")
    service  = data.get("service_name")
    category = data.get("category")

    if not service or not category:
        return jsonify({"success": False, "error": "Missing service info"}), 400

    database.log_service_intent(phone, service, category)
    return jsonify({"success": True})


# ── Students API ──────────────────────────────────────────────────────────────

@app.route("/api/students", methods=["GET"])
@token_required
def get_students():
    exam = request.args.get("exam", "ALL")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))
    search = request.args.get("search", "").strip()

    data, total_count = database.get_students_paginated(
        exam=exam,
        page=page,
        limit=limit,
        search=search
    )
    return jsonify({
        "students": data,
        "total": total_count,
        "page": page,
        "limit": limit
    })


@app.route("/api/students", methods=["POST"])
@token_required
def add_student():
    data = request.json or {}
    name = data.get("name", "").strip()
    phone = data.get("phone", "").strip()
    exam = data.get("exam_preference", "NONE")

    if not name or not phone:
        return jsonify({"success": False, "error": "Name and Phone are required"}), 400

    if not re.match(r"^[6-9]\d{9}$", phone):
        return jsonify({"success": False, "error": "Invalid Indian phone number"}), 400

    success, result = database.add_student_admin(name, phone, exam)
    if success:
        return jsonify({"success": True, "message": "Student added successfully", "id": result})
    else:
        return jsonify({"success": False, "error": result}), 409


@app.route("/api/stats", methods=["GET"])
@token_required
def get_stats():
    stats = database.get_stats()
    stats["pending_requests"] = database.get_pending_count()
    return jsonify(stats)


# ── FIX #9: Student block + delete endpoints ──────────────────────────────────

@app.route("/api/students/<telegram_id>/block", methods=["POST"])
@token_required
def block_student(telegram_id):
    """Block a student — they stay in DB but won't receive broadcasts."""
    database.block_student(telegram_id)
    return jsonify({"success": True, "action": "blocked", "telegram_id": telegram_id})


@app.route("/api/students/<int:student_id>", methods=["DELETE"])
@token_required
def delete_student(student_id):
    """Permanently delete a student and all their data."""
    database.delete_student(student_id)
    return jsonify({"success": True, "action": "deleted", "student_id": student_id})


@app.route("/api/students/<int:student_id>/category", methods=["POST"])
@token_required
def update_student_category(student_id):
    """Update exam category for a student by ID."""
    data = request.json or {}
    category = data.get("category")
    if not category:
        return jsonify({"success": False, "error": "Category is required"}), 400
        
    database.update_student_category(student_id, category)
    return jsonify({"success": True, "id": student_id, "category": category})


def _run_broadcast_in_background(job_id, exam, message, students, token, image_url=None):
    """Runs in a daemon thread — broadcasts to all students without blocking the HTTP response."""
    database.update_broadcast_status(job_id, "running")
    success_count = 0
    total = len(students)
    
    try:
        for i, student in enumerate(students):
            tg_id = student.get("telegram_id")
            if not tg_id or tg_id.startswith("BOT_TEMP_"):
                database.add_notification_history(student["id"], job_id, "failed", "No Telegram linked")
                continue
                
            ok = notifier.send_message_to_user(token, tg_id, message, image_url=image_url)
            status = "sent" if ok else "failed"
            error = None if ok else "Telegram send failure"
            
            if ok:
                success_count += 1
                
            database.add_notification_history(student["id"], job_id, status, error)
            
            if (i + 1) % 10 == 0:
                database.update_broadcast_status(job_id, "running", sent_count=success_count)
                
            if i < total - 1:
                import time
                time.sleep(notifier.BROADCAST_DELAY_SECONDS)
                
        log_text = message or ""
        if image_url:
            log_text = f"[Image]({image_url})\n\n" + log_text
            
        database.log_message(exam, log_text, success_count)
        database.update_broadcast_status(job_id, "done", sent_count=success_count)
        
    except Exception as e:
        print(f"CRITICAL: Broadcast Background Error: {e}")
        database.update_broadcast_status(job_id, "error", error_msg=str(e))


@app.route("/api/send-notification", methods=["POST"])
@token_required
def send_notification():
    exam = None
    message = None
    image_url = None

    if request.content_type and "multipart/form-data" in request.content_type:
        exam = request.form.get("exam")
        message = request.form.get("message")
        
        # Check for uploaded image file
        if "image" in request.files:
            file = request.files["image"]
            if file and file.filename != "":
                orig_filename, file_bytes, content_type = _validate_upload(
                    file,
                    ALLOWED_BROADCAST_EXTENSIONS,
                    ALLOWED_BROADCAST_TYPES,
                    "broadcast image"
                )
                unique_name = f"broadcast_{uuid.uuid4().hex[:8]}_{orig_filename}"
                
                # Upload to Supabase public bucket
                from database import supabase
                supabase.storage.from_("broadcast_images").upload(
                    file=file_bytes,
                    path=unique_name,
                    file_options={"content-type": content_type}
                )
                
                # Get public URL directly from Supabase
                image_url = supabase.storage.from_("broadcast_images").get_public_url(unique_name)
    else:
        # Fallback to JSON
        data = request.json or {}
        exam = data.get("exam")
        message = data.get("message")
        image_url = data.get("image_url")

    # Check if a broadcast is already running to prevent concurrent conflicts
    from database import supabase
    try:
        running_jobs = supabase.table("broadcast_jobs").select("id").eq("status", "running").execute()
        if running_jobs.data:
            return jsonify({
                "success": False,
                "error": "A broadcast job is already running. Please wait until it completes."
            }), 409
    except Exception as e:
        print(f"Error checking running broadcast jobs: {e}")

    if not exam:
        return jsonify({"success": False, "error": "Missing exam"}), 400

    if not message and not image_url:
        return jsonify({"success": False, "error": "Must provide either message text or an image"}), 400

    students = database.get_students_by_exam(exam)
    if not students:
        return jsonify({"success": True, "sent_to": 0, "exam": exam, "queued": False,
                        "message": "No eligible students found"})

    total = len(students)

    # FIX: Run in background thread so the HTTP request returns immediately.
    # Without this, 4000 students × 50ms = 200s → guaranteed timeout on PythonAnywhere.
    job_id = str(uuid.uuid4())[:8]
    database.create_broadcast_job(job_id, exam, total)

    t = threading.Thread(
        target=_run_broadcast_in_background,
        args=(job_id, exam, message, students, config.TELEGRAM_BOT_TOKEN),
        kwargs={"image_url": image_url},
        daemon=True,
    )
    t.start()

    return jsonify({
        "success":        True,
        "queued":         True,
        "job_id":         job_id,
        "total_eligible": total,
        "exam":           exam,
        "message":        f"Broadcast started for {total} students.",
    })


@app.route("/api/broadcast-status/<job_id>", methods=["GET"])
@token_required
def broadcast_status(job_id):
    """Frontend polls this to show real-time broadcast progress from DB."""
    job = database.get_broadcast_status(job_id)
    if not job:
        return jsonify({"error": "Job not found"}), 404
    return jsonify(job)



# ── Service Requests API ──────────────────────────────────────────────────────
# FIX #10: N+1 query eliminated — JOIN is now done in database.get_service_requests()

@app.route("/api/service-requests", methods=["GET"])
@token_required
def get_service_requests():
    status = request.args.get("status")
    page = int(request.args.get("page", 1))
    limit = int(request.args.get("limit", 20))

    enriched, total_count = database.get_service_requests_paginated(
        status=status,
        page=page,
        limit=limit
    )
    pending_count = database.get_pending_count()

    return jsonify({
        "requests": enriched,
        "total": total_count,
        "pending": pending_count,
        "page": page,
        "limit": limit
    })


@app.route("/api/send-receipt", methods=["POST"])
@token_required
def send_receipt():
    """Allows admin to send a formatted receipt/message to a specific student."""
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400

    telegram_id = data.get("telegram_id")
    message = data.get("message")
    request_id = data.get("request_id")

    if not telegram_id or not message:
        return jsonify({"success": False, "error": "Missing telegram_id or message"}), 400

    # FIX #6: pass parse_mode=Markdown so admin receipts can include bold/links
    success = notifier.send_message_to_user(
        config.TELEGRAM_BOT_TOKEN, telegram_id, message, parse_mode="Markdown"
    )

    if success and request_id:
        database.complete_service_request(request_id)

    return jsonify({"success": success})


@app.route("/api/service-requests/<int:request_id>/complete", methods=["POST"])
@token_required
def complete_service_request_endpoint(request_id):
    """Allows admin to mark a request as completed directly without sending a receipt."""
    try:
        # Load request details to find telegram_id / phone
        req_res = database.supabase.table("service_requests").select("*").eq("id", request_id).execute()
        req_data = req_res.data[0] if req_res.data else None
        
        database.complete_service_request(request_id)
        
        if req_data:
            telegram_id = req_data.get("telegram_id")
            phone = req_data.get("phone_number")
            service_name = req_data.get("service_name")
            
            # If telegram_id is not set but phone is, try looking up telegram_id
            if not telegram_id and phone:
                clean_phone = phone.strip().replace(" ", "").replace("-", "")
                if clean_phone.startswith("+"):
                    clean_phone = clean_phone[1:]
                clean_phone = clean_phone[-10:]
                
                student_res = database.supabase.table("users").select("telegram_id").ilike("phone", f"%{clean_phone}").execute()
                if student_res.data and student_res.data[0].get("telegram_id"):
                    telegram_id = student_res.data[0]["telegram_id"]
                    # Backport telegram_id to this request
                    database.supabase.table("service_requests").update({"telegram_id": telegram_id}).eq("id", request_id).execute()
                    
            if telegram_id:
                msg = (
                    f"✅ *Seva Completed!*\n\n"
                    f"Aapki *{service_name}* seva ki request successfully process ho gayi hai. 🙏\n\n"
                    f"Krishna Emitra par bharosa karne ke liye dhanyawad!"
                )
                notifier.send_message_to_user(config.TELEGRAM_BOT_TOKEN, telegram_id, msg, parse_mode="Markdown")
                
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Logs API ──────────────────────────────────────────────────────────────────

@app.route("/api/logs", methods=["GET"])
@token_required
def get_logs_api():
    logs = database.get_logs()
    return jsonify({"logs": logs})


# ── User Documents API ────────────────────────────────────────────────────────

@app.route("/api/documents/<telegram_id>", methods=["GET"])
@token_required
def get_student_documents(telegram_id):
    docs = database.get_user_documents(telegram_id)
    return jsonify({"documents": docs})


# FIX #2: Document URL endpoint — uses global loop and bot
@app.route("/api/document-url/<file_id>", methods=["GET"])
@token_required
def get_document_url(file_id):
    try:
        bot, loop = get_bot_and_loop()
        async def _get_file_path():
            telegram_file = await bot.get_file(file_id)
            return telegram_file.file_path

        file_path = loop.run_until_complete(_get_file_path())
        return jsonify({"url": file_path})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Bot Settings API (for Bot Manager UI) ─────────────────────────────────────

ALLOWED_SETTING_KEYS = {
    "welcome_message", "exam_confirm_message", "unsubscribe_message",
    "bot_name", "language", "max_msg_per_day",
}

@app.route("/api/bot-settings", methods=["GET"])
@token_required
def get_bot_settings():
    settings = database.get_all_bot_settings()
    return jsonify({"settings": settings})


@app.route("/api/bot-settings", methods=["POST"])
@token_required
def save_bot_settings():
    data = request.json
    if not data or not isinstance(data, dict):
        return jsonify({"success": False, "error": "Expected JSON object"}), 400

    # Only allow known keys to prevent arbitrary data injection
    filtered = {k: str(v) for k, v in data.items() if k in ALLOWED_SETTING_KEYS}
    if not filtered:
        return jsonify({"success": False, "error": "No valid keys provided"}), 400

    database.set_bot_settings_bulk(filtered)
    return jsonify({"success": True, "saved": list(filtered.keys())})


@app.route("/api/bot-settings/<key>", methods=["GET"])
@token_required
def get_single_bot_setting(key):
    if key not in ALLOWED_SETTING_KEYS:
        return jsonify({"error": "Unknown setting key"}), 404
    value = database.get_bot_setting(key)
    return jsonify({"key": key, "value": value})



# ── Services API (Bot Manager ↔ actual bot) ────────────────────────────────────

# Category metadata used for validation
CATEGORY_MAP = {
    "cert":       "Pramaan Patra (Certificates)",
    "id":         "Pehchan (IDs & Updates)",
    "bills":      "Bills, Recharge & Taxes",
    "forms":      "Siksha & Exams (Forms)",
    "schemes":    "Yojana & Pension",
    "land_auto":  "Krishi, Khata & Vahan",
}

@app.route("/api/services", methods=["GET"])
@token_required
def get_services():
    return jsonify({"services": database.get_all_services()})


@app.route("/api/services", methods=["POST"])
@token_required
def create_service():
    data = request.json or {}
    name         = data.get("name", "").strip()
    category_key = data.get("category_key", "").strip()
    if not name or not category_key:
        return jsonify({"success": False, "error": "name and category_key are required"}), 400
    if category_key not in CATEGORY_MAP:
        return jsonify({"success": False, "error": f"Invalid category_key. Use: {list(CATEGORY_MAP)}"}), 400

    category_label = data.get("category_label") or CATEGORY_MAP[category_key]
    desc  = data.get("description", "")
    price = data.get("price", "")
    database.add_service(category_key, category_label, name, desc, price)
    return jsonify({"success": True})


@app.route("/api/services/<int:service_id>", methods=["PUT"])
@token_required
def update_service(service_id):
    data = request.json or {}
    allowed = {"name", "description", "price", "category_key", "category_label", "enabled"}
    fields = {k: v for k, v in data.items() if k in allowed}
    if "category_key" in fields and fields["category_key"] not in CATEGORY_MAP:
        return jsonify({"success": False, "error": "Invalid category_key"}), 400
    # Auto-set label if category_key changed
    if "category_key" in fields and "category_label" not in fields:
        fields["category_label"] = CATEGORY_MAP[fields["category_key"]]
    database.update_service(service_id, **fields)
    return jsonify({"success": True})


@app.route("/api/services/<int:service_id>/toggle", methods=["POST"])
@token_required
def toggle_service(service_id):
    database.toggle_service(service_id)
    return jsonify({"success": True})


@app.route("/api/services/<int:service_id>", methods=["DELETE"])
@token_required
def delete_service(service_id):
    database.delete_service(service_id)
    return jsonify({"success": True})


# ── Exams API (Compatibility & Simple Admin) ──────────────────────────────────

@app.route("/api/exams", methods=["GET"])
@token_required
def get_exams():
    return jsonify({"exams": database.get_all_exams()})

@app.route("/api/exams", methods=["POST"])
@token_required
def create_exam():
    data = request.json or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"success": False, "error": "Exam name is required"}), 400
    success, result = database.add_exam(name)
    if success:
        return jsonify({"success": True, "id": result})
    else:
        return jsonify({"success": False, "error": result}), 400

@app.route("/api/exams/<int:exam_id>", methods=["DELETE"])
@token_required
def delete_exam(exam_id):
    database.delete_exam(exam_id)
    return jsonify({"success": True})


# ── Exam Form Applications & Detailed Exams API ─────────────────────────────
import os
import uuid


# ── Public APIs ─────────────────────────────────────────────────────────────

@app.route("/api/public/submit-application", methods=["POST"])
@limiter.limit("5 per minute")
def public_submit_application():
    try:
        # 1. Read normal form parameters
        student_name = request.form.get("name", "").strip()
        phone_number = request.form.get("phone", "").strip()
        email = request.form.get("email", "").strip()
        dob = request.form.get("dob", "").strip()
        gender = request.form.get("gender", "").strip()
        category = request.form.get("category", "").strip()
        exam_cycle_id = request.form.get("exam_cycle_id", "").strip()
        qualification = request.form.get("qualification", "").strip()
        doc_submission_method = request.form.get("docSubmissionMethod", "upload").strip()

        if not student_name or not phone_number or not exam_cycle_id:
            return jsonify({"success": False, "error": "Name, Phone and Exam Cycle are required"}), 400

        # Validate phone
        if not re.match(r"^[6-9]\d{9}$", phone_number):
            return jsonify({"success": False, "error": "Invalid Indian phone number"}), 400

        try:
            exam_cycle_id_int = int(exam_cycle_id)
        except ValueError:
            return jsonify({"success": False, "error": "Invalid Exam Cycle ID format"}), 400

        # 2. Insert form application to get ID
        app_id = database.submit_form_application(
            student_name, phone_number, email, dob, gender, category, exam_cycle_id_int, qualification, doc_submission_method
        )

        # 3. Process files
        for doc_key in request.files:
            file = request.files[doc_key]
            if file and file.filename != "":
                orig_filename, file_bytes, content_type = _validate_upload(
                    file,
                    ALLOWED_DOCUMENT_EXTENSIONS,
                    ALLOWED_DOCUMENT_TYPES,
                    "document"
                )
                # Generate unique name: appid_uuid_origfilename
                unique_name = f"{app_id}_{uuid.uuid4().hex[:8]}_{orig_filename}"
                
                # Upload to Supabase private bucket
                from database import supabase
                supabase.storage.from_("student_documents").upload(
                    file=file_bytes,
                    path=unique_name,
                    file_options={"content-type": content_type}
                )
                
                # Log file in database using doc_key (which is the document label like '10th Marksheet') as file_type
                database.add_application_document(app_id, doc_key, unique_name, file.filename)

        return jsonify({"success": True, "message": "Application submitted successfully", "application_id": app_id})
    except Exception as e:
        print(f"Error submitting form application: {e}")
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/public/applications/<phone>", methods=["GET"])
@limiter.limit("20 per minute")
def public_get_applications_status(phone):
    """Students call this to see status of all their form filings by phone number."""
    allowed, payload_or_response, status_code = _authorized_for_phone(phone)
    if not allowed:
        return payload_or_response, status_code

    apps = database.get_student_applications_by_phone(phone)
    return jsonify({"success": True, "applications": apps})


# ── Admin APIs (Auth Required) ──────────────────────────────────────────────

@app.route("/api/admin/exams", methods=["GET"])
@token_required
def admin_get_all_exams():
    """Admin endpoint to see all exams (both enabled & disabled) for configuration."""
    return jsonify({"success": True, "exams": database.get_all_exams_admin()})


@app.route("/api/admin/exams", methods=["POST"])
@token_required
def admin_create_exam():
    data = request.json or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"success": False, "error": "Exam name is required"}), 400
        
    desc = data.get("description", "")
    category_id = data.get("category_id")
    cycle_year = data.get("cycle_year")
    start = data.get("start_date", "")
    end = data.get("end_date", "")
    exam_d = data.get("exam_date", "")
    fees_gen = data.get("fees_gen_obc", "")
    fees_sc = data.get("fees_sc_st", "")
    elig = data.get("eligibility", "")
    url = data.get("official_url", "")
    enabled = data.get("enabled", True)

    success, result = database.add_exam_details(
        name, desc, category_id, url, enabled, cycle_year, start, end, exam_d, fees_gen, fees_sc, elig
    )
    if success:
        return jsonify({"success": True, "id": result})
    else:
        return jsonify({"success": False, "error": result}), 400


@app.route("/api/admin/exams/<int:exam_id>", methods=["PUT"])
@token_required
def admin_update_exam(exam_id):
    data = request.json or {}
    name = data.get("name", "").strip()
    if not name:
        return jsonify({"success": False, "error": "Exam name is required"}), 400
        
    desc = data.get("description", "")
    category_id = data.get("category_id")
    cycle_id = data.get("cycle_id")
    cycle_year = data.get("cycle_year")
    start = data.get("start_date", "")
    end = data.get("end_date", "")
    exam_d = data.get("exam_date", "")
    fees_gen = data.get("fees_gen_obc", "")
    fees_sc = data.get("fees_sc_st", "")
    elig = data.get("eligibility", "")
    url = data.get("official_url", "")
    enabled = data.get("enabled", True)

    success, result = database.update_exam_details(
        exam_id, name, desc, category_id, url, enabled, cycle_id, cycle_year, start, end, exam_d, fees_gen, fees_sc, elig
    )
    if success:
        return jsonify({"success": True})
    else:
        return jsonify({"success": False, "error": "Failed to update exam"}), 400


@app.route("/api/admin/applications", methods=["GET"])
@token_required
def admin_get_all_applications():
    """Fetch all form filing applications."""
    status = request.args.get("status")
    apps = database.get_all_applications(status)
    return jsonify({"success": True, "applications": apps})


@app.route("/api/admin/applications/<int:app_id>", methods=["GET"])
@token_required
def admin_get_application_details(app_id):
    """Fetch detailed metadata of a single application with attachments."""
    details = database.get_application_details(app_id)
    if not details:
        return jsonify({"success": False, "error": "Application not found"}), 404
    return jsonify({"success": True, "application": details})


@app.route("/api/admin/applications/<int:app_id>", methods=["PUT"])
@token_required
def admin_update_application(app_id):
    """Admin updates status and remarks of an application."""
    data = request.json or {}
    status = data.get("status")
    remarks = data.get("remarks", "")
    
    if not status:
        return jsonify({"success": False, "error": "Status is required"}), 400
        
    # Get application details before update to get student phone and exam name
    app_details = database.get_application_details(app_id)
    
    database.update_application_status(app_id, status, remarks)
    
    # Notify student via Telegram if they are registered in the Bot
    if app_details:
        phone = app_details.get("phone_number")
        exam_name = app_details.get("exam_name", "Exam")
        if phone:
            # Look up student's telegram_id using the phone number
            clean_phone = phone.strip().replace(" ", "").replace("-", "")
            if clean_phone.startswith("+"):
                clean_phone = clean_phone[1:]
            clean_phone = clean_phone[-10:] # last 10 digits
            
            try:
                student_res = database.supabase.table("users").select("telegram_id").ilike("phone", f"%{clean_phone}").execute()
                if student_res.data and student_res.data[0].get("telegram_id"):
                    telegram_id = student_res.data[0]["telegram_id"]
                    status_text = status.upper()
                    
                    if status == "completed":
                        msg = (
                            f"✅ *Application Processed!*\n\n"
                            f"Aapka *{exam_name}* form filing application successfully process ho gaya hai. 🙏\n"
                        )
                    elif status == "rejected":
                        msg = (
                            f"❌ *Application Rejected!*\n\n"
                            f"Aapka *{exam_name}* form filing application reject ho gaya hai.\n\n"
                        )
                    else:
                        msg = (
                            f"ℹ️ *Application Status Update!*\n\n"
                            f"Aapka *{exam_name}* form filing application status: *{status_text}*.\n\n"
                        )
                    
                    if remarks:
                        msg += f"*Admin Remarks:* {remarks}\n\n"
                    
                    msg += "Aap website portal ya bot par status check kar sakte hain."
                    
                    # Send telegram message
                    notifier.send_message_to_user(config.TELEGRAM_BOT_TOKEN, telegram_id, msg, parse_mode="Markdown")
            except Exception as e:
                print(f"Error sending application status notification: {e}")
                
    return jsonify({"success": True})


@app.route("/api/admin/documents/download/<path:filename>", methods=["GET"])
@token_required
def admin_download_document(filename):
    """Securely serve uploaded student application documents only to authenticated admins."""
    clean_filename = secure_filename(filename)
    from database import supabase
    from flask import redirect
    try:
        # Create a signed URL that expires in 60 seconds
        res = supabase.storage.from_("student_documents").create_signed_url(clean_filename, 60)
        signed_url = res.get("signedURL") or res.get("signedUrl") if isinstance(res, dict) else getattr(res, "signedURL", getattr(res, "signedUrl", None))
        
        # Sometimes supabase-py returns the string directly in newer versions
        if isinstance(res, str):
            signed_url = res
            
        if not signed_url:
            return jsonify({"error": "File not found"}), 404
        return redirect(signed_url)
    except Exception as e:
        print(f"Error retrieving document: {e}")
        return jsonify({"error": "Failed to retrieve document"}), 500


@app.route("/api/public/documents/download/<path:filename>", methods=["GET"])
def public_download_document(filename):
    """Serve broadcast images publicly, but deny access to student documents."""
    clean_filename = secure_filename(filename)
    from flask import redirect
    
    if clean_filename.startswith("broadcast_"):
        from database import supabase
        public_url = supabase.storage.from_("broadcast_images").get_public_url(clean_filename)
        return redirect(public_url)
        
    return jsonify({"error": "Forbidden: Student documents can only be accessed by authenticated administrators."}), 403




# ── Static File Handling (Fix Manifest/Asset errors) ──────────────────────────
from flask import send_from_directory
import os

@app.route("/manifest.json")
@app.route("/manifest.webmanifest")
def serve_manifest():
    return send_from_directory(os.path.join(app.root_path, "../frontend/dist"), "manifest.webmanifest")

@app.route("/favicon.svg")
@app.route("/icons.svg")
def serve_public_assets():
    filename = request.path.split("/")[-1]
    return send_from_directory(os.path.join(app.root_path, "../frontend/dist"), filename)

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(os.path.join(app.root_path, "../frontend/dist", path)):
        return send_from_directory(os.path.join(app.root_path, "../frontend/dist"), path)
    else:
        # For SPA routing, return index.html for all non-found paths
        return send_from_directory(os.path.join(app.root_path, "../frontend/dist"), "index.html")


# ── Scheduled Announcements APIs ──────────────────────────────────────────────

@app.route("/api/admin/announcements", methods=["GET"])
@token_required
def admin_get_announcements():
    try:
        rows = database.get_all_announcements_raw()
        announcements = []
        for row in rows:
            announcements.append({
                "id": row["id"],
                "exam": row["title"],          # map title to exam
                "message": row["content"],     # map content to message
                "runAt": row["links"],         # map links to runAt
                "sent": row["is_active"] == 0  # if is_active is 0, it means sent
            })
        return jsonify({"success": True, "announcements": announcements})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/admin/announcements", methods=["POST"])
@token_required
def admin_create_announcement():
    try:
        data = request.json or {}
        exam = data.get("exam", "ALL").strip()
        message = data.get("message", "").strip()
        run_at = data.get("runAt", "").strip()

        if not message or not run_at:
            return jsonify({"success": False, "error": "Message and runAt are required"}), 400

        ann_id = database.add_scheduled_announcement(exam, message, run_at)
        return jsonify({"success": True, "id": ann_id})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/admin/announcements/<int:ann_id>", methods=["PUT"])
@token_required
def admin_update_announcement(ann_id):
    try:
        data = request.json or {}
        exam = data.get("exam", "ALL").strip()
        message = data.get("message", "").strip()
        run_at = data.get("runAt", "").strip()
        sent = data.get("sent", False)

        if not message or not run_at:
            return jsonify({"success": False, "error": "Message and runAt are required"}), 400

        database.update_scheduled_announcement(ann_id, exam, message, run_at, 0 if sent else 1)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/admin/announcements/<int:ann_id>", methods=["DELETE"])
@token_required
def admin_delete_announcement(ann_id):
    try:
        database.delete_scheduled_announcement(ann_id)
        return jsonify({"success": True})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


# ── Background Scheduler for Announcements ────────────────────────────────────

def check_and_send_scheduled_announcements():
    """Periodically checks and sends scheduled announcements."""
    import datetime
    import time as _time_lib
    
    print("Scheduled announcements background runner started.")
    while True:
        try:
            # Fetch all active scheduled announcements
            active_anns = database.get_all_active_announcements()
            
            for ann in active_anns:
                run_at_str = ann.get("links")
                if not run_at_str:
                    continue
                try:
                    # run_at_str is in format: "YYYY-MM-DDTHH:MM" (naive local time)
                    run_dt = datetime.datetime.fromisoformat(run_at_str)
                    
                    # Compare naive local time normalized to Indian Standard Time (IST, UTC+5:30)
                    ist_tz = datetime.timezone(datetime.timedelta(hours=5, minutes=30))
                    now_ist = datetime.datetime.now(datetime.timezone.utc).astimezone(ist_tz).replace(tzinfo=None)
                    if now_ist >= run_dt:
                        exam = ann.get("title", "ALL")
                        message = ann.get("content", "")
                        ann_id = ann.get("id")
                        
                        print(f"[Scheduler] Time reached for scheduled announcement ID={ann_id} (exam={exam})")
                        
                        # 1. Mark as sent immediately to avoid double-processing
                        database.mark_announcement_sent(ann_id)
                        
                        # 2. Get eligible students
                        students = database.get_students_by_exam(exam)
                        if students:
                            total = len(students)
                            try:
                                # Send sequential broadcast
                                success_count = notifier.broadcast(
                                    config.TELEGRAM_BOT_TOKEN,
                                    students,
                                    message
                                )
                                # Log broadcast history
                                database.log_message(exam, message, success_count)
                                print(f"[Scheduler] Announcement ID={ann_id} sent to {success_count}/{total} students.")
                            except Exception as e:
                                print(f"[Scheduler] Error broadcasting ID={ann_id}: {e}")
                        else:
                            # No students found
                            database.log_message(exam, message, 0)
                            print(f"[Scheduler] Announcement ID={ann_id} logged with 0 recipients (no students).")
                except Exception as e:
                    print(f"[Scheduler] Error processing scheduled announcement ID={ann.get('id')}: {e}")
        except Exception as e:
            print(f"[Scheduler] Critical error in runner loop: {e}")
            
        _time_lib.sleep(30)


# Start background thread for scheduled announcements, avoiding duplication in Flask debug mode
if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not app.debug:
    t_scheduler = threading.Thread(target=check_and_send_scheduled_announcements, daemon=True)
    t_scheduler.start()


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=not IS_PRODUCTION)
