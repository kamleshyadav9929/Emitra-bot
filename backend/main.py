# python-telegram-bot 21.x — natively supports latest httpx, no version pinning needed.

import asyncio
import re
import threading
from functools import wraps
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import time as _time

from flask import Flask, request, jsonify
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from telegram import Update, Bot

import config
import database
import notifier
import bot as bot_handlers
import jwt
from jwt import PyJWKClient

jwks_client = None
if config.CLERK_JWKS_URL and not config.CLERK_JWT_PUBLIC_KEY:
    try:
        jwks_client = PyJWKClient(config.CLERK_JWKS_URL)
    except Exception as e:
        print(f"JWKS Client initialization failed: {e}")

app = Flask(__name__)

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
    response = jsonify({"error": str(e), "trace": trace})
    response.status_code = 500
    return response

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

def get_bot_and_loop():
    """Lazily initializes the event loop and bot after the WSGI worker has forked."""
    global _global_loop, _global_bot
    if _global_loop is None:
        _global_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_global_loop)
        if config.TELEGRAM_BOT_TOKEN:
            _global_bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
            _global_loop.run_until_complete(_global_bot.initialize())
    return _global_bot, _global_loop


# ── Authentication ─────────────────────────────────────────────────────────────

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return jsonify({"ok": True}), 200
            
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token is missing. Please log in again."}), 401
            
        # Priority 1: High-Performance Offline Verification (No network calls)
        # The key is pre-normalized by config._normalize_pem_key() at startup.
        if config.CLERK_JWT_PUBLIC_KEY:
            try:
                jwt.decode(
                    token,
                    config.CLERK_JWT_PUBLIC_KEY,
                    algorithms=["RS256"],
                    options={"verify_aud": False}
                )
                return f(*args, **kwargs)
            except Exception as e:
                return jsonify({"error": f"Offline token verification failed: {e}"}), 401

        # Priority 2: Online Verification (Only if offline key is missing)
        if not jwks_client:
            return jsonify({"error": "Auth is not configured securely. Provide CLERK_JWT_PUBLIC_KEY for PythonAnywhere."}), 500

        try:
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            jwt.decode(
                token,
                signing_key.key,
                algorithms=["RS256"]
            )
        except Exception as e:
            return jsonify({"error": f"Token verification failed: {e}"}), 401

        return f(*args, **kwargs)
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

        loop.run_until_complete(process())
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
    if secret:
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
    return jsonify({"exams": database.get_all_exams()})


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


@app.route("/api/public/check-status", methods=["POST"])
@limiter.limit("10 per minute")
def public_check_status():
    data = request.json or {}
    phone = data.get("phone", "").strip()
    if not phone:
        return jsonify({"success": False, "error": "Phone number required"}), 400

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


@app.route("/api/students/<telegram_id>", methods=["DELETE"])
@token_required
def delete_student(telegram_id):
    """Permanently delete a student and all their data."""
    database.delete_student(telegram_id)
    return jsonify({"success": True, "action": "deleted", "telegram_id": telegram_id})


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
    try:
        success_count = notifier.broadcast(
            token, 
            students, 
            message,
            image_url=image_url,
            on_progress=lambda count: database.update_broadcast_status(job_id, "running", sent_count=count)
        )
        log_text = message or ""
        if image_url:
            log_text = f"[Image] " + log_text
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
                orig_filename = secure_filename(file.filename)
                unique_name = f"broadcast_{uuid.uuid4().hex[:8]}_{orig_filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_name)
                file.save(file_path)
                
                # Construct public URL
                base_url = request.host_url.rstrip('/')
                image_url = f"{base_url}/api/public/documents/download/{unique_name}"
    else:
        # Fallback to JSON
        data = request.json or {}
        exam = data.get("exam")
        message = data.get("message")
        image_url = data.get("image_url")

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
    job = database.get_broadcast_job(job_id)
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
                
                student_res = database.supabase.table("students").select("telegram_id").ilike("phone_number", f"%{clean_phone}").execute()
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
from werkzeug.utils import secure_filename

UPLOAD_FOLDER = os.path.join(app.root_path, "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

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
        exam_name = request.form.get("exam", "").strip()
        qualification = request.form.get("qualification", "").strip()
        doc_submission_method = request.form.get("docSubmissionMethod", "upload").strip()

        if not student_name or not phone_number or not exam_name:
            return jsonify({"success": False, "error": "Name, Phone and Exam are required"}), 400

        # Validate phone
        if not re.match(r"^[6-9]\d{9}$", phone_number):
            return jsonify({"success": False, "error": "Invalid Indian phone number"}), 400

        # 2. Insert form application to get ID
        app_id = database.submit_form_application(
            student_name, phone_number, email, dob, gender, category, exam_name, qualification, doc_submission_method
        )

        # 3. Process files
        for doc_key in request.files:
            file = request.files[doc_key]
            if file and file.filename != "":
                orig_filename = secure_filename(file.filename)
                # Generate unique name: appid_uuid_origfilename
                unique_name = f"{app_id}_{uuid.uuid4().hex[:8]}_{orig_filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_name)
                file.save(file_path)
                
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
    cat = data.get("category", "UG")
    start = data.get("start_date", "")
    end = data.get("end_date", "")
    exam_d = data.get("exam_date", "")
    fees_gen = data.get("fees_gen_obc", "")
    fees_sc = data.get("fees_sc_st", "")
    elig = data.get("eligibility", "")
    url = data.get("official_url", "")
    enabled = data.get("enabled", True)
    req_docs = data.get("required_documents", "")

    success, result = database.add_exam_details(
        name, desc, cat, start, end, exam_d, fees_gen, fees_sc, elig, url, enabled, req_docs
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
    cat = data.get("category", "UG")
    start = data.get("start_date", "")
    end = data.get("end_date", "")
    exam_d = data.get("exam_date", "")
    fees_gen = data.get("fees_gen_obc", "")
    fees_sc = data.get("fees_sc_st", "")
    elig = data.get("eligibility", "")
    url = data.get("official_url", "")
    enabled = data.get("enabled", True)
    req_docs = data.get("required_documents", "")

    success = database.update_exam_details(
        exam_id, name, desc, cat, start, end, exam_d, fees_gen, fees_sc, elig, url, enabled, req_docs
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
                # Query student record
                student_res = database.supabase.table("students").select("telegram_id").ilike("phone_number", f"%{clean_phone}").execute()
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
    if not os.path.exists(os.path.join(UPLOAD_FOLDER, clean_filename)):
        return jsonify({"error": "File not found"}), 404
        
    return send_from_directory(UPLOAD_FOLDER, clean_filename, as_attachment=True)


@app.route("/api/public/documents/download/<path:filename>", methods=["GET"])
def public_download_document(filename):
    """Serve uploaded student documents (filenames are cryptographically secure with UUIDs)."""
    clean_filename = secure_filename(filename)
    if not os.path.exists(os.path.join(UPLOAD_FOLDER, clean_filename)):
        return jsonify({"error": "File not found"}), 404
        
    return send_from_directory(UPLOAD_FOLDER, clean_filename, as_attachment=True)




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
                    
                    # Compare naive local time of server
                    now_naive = datetime.datetime.now()
                    if now_naive >= run_dt:
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
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=True)
