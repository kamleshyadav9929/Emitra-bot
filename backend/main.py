import asyncio
import re
import threading
from functools import wraps
from datetime import datetime, timedelta, timezone
from collections import defaultdict
import time as _time

from flask import Flask, request, jsonify
from flask_cors import CORS
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

# ── Persistent broadcast job tracker (database-backed) ───────────────────
# status code logic moved to database.py

app = Flask(__name__)
# Explicit CORS handling for development and production Vercel origins
CORS(app, resources={r"/api/*": {"origins": [
    "https://emitra-bot.vercel.app",
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:3000",
    "http://localhost:5000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:5174",
    "http://127.0.0.1:5175",
    "http://127.0.0.1:3000"
]}})

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

_persistent_bot = Bot(token=config.TELEGRAM_BOT_TOKEN) if config.TELEGRAM_BOT_TOKEN else None
if not _persistent_bot:
    print("WARNING: TELEGRAM_BOT_TOKEN not set. Bot will not function.")


def run_async(coro):
    """
    Runs an async coroutine. Using asyncio.run() ensures that each request
    gets its own thread-safe event loop, avoiding event loop conflicts and crashes
    in multi-threaded WSGI environments like PythonAnywhere.
    """
    return asyncio.run(coro)


# ── Authentication ─────────────────────────────────────────────────────────────

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == "OPTIONS":
            return f(*args, **kwargs)
            
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token is missing. Please log in again."}), 401
            
        # Priority 1: High-Performance Offline Verification (No network calls)
        if config.CLERK_JWT_PUBLIC_KEY:
            try:
                # Ensure the key has proper headers if it's just the raw base64/string
                key = config.CLERK_JWT_PUBLIC_KEY
                if "-----BEGIN PUBLIC KEY-----" not in key:
                    key = f"-----BEGIN PUBLIC KEY-----\n{key}\n-----END PUBLIC KEY-----"
                
                jwt.decode(
                    token,
                    key,
                    algorithms=["RS256"],
                    options={"verify_aud": False} # Clerk tokens usually don't need AUD check here
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

        async def process():
            # Reuse the persistent bot — no per-request instantiation
            update = Update.de_json(update_data, _persistent_bot)

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

        run_async(process())
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
# ── Public API (Unprotected / Rate-Limited) ───────────────────────────────────

@app.route("/api/public/services", methods=["GET"])
def get_public_services():
    return jsonify({"services": database.get_public_services_as_dict()})


@app.route("/api/public/exams", methods=["GET"])
def get_public_exams():
    return jsonify({"exams": database.get_all_exams()})


@app.route("/api/public/announcements", methods=["GET"])
def get_public_announcements():
    return jsonify({"announcements": database.get_announcements()})


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
    if exam == "ALL":
        students = database.get_all_students()
    else:
        students = database.get_students_by_exam(exam)
    return jsonify({"students": students, "total": len(students)})


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


def _run_broadcast_in_background(job_id, exam, message, students, token):
    """Runs in a daemon thread — broadcasts to all students without blocking the HTTP response."""
    database.update_broadcast_status(job_id, "running")
    try:
        success_count = notifier.broadcast(
            token, 
            students, 
            message,
            on_progress=lambda count: database.update_broadcast_status(job_id, "running", sent_count=count)
        )
        database.log_message(exam, message, success_count)
        database.update_broadcast_status(job_id, "done", sent_count=success_count)
    except Exception as e:
        print(f"CRITICAL: Broadcast Background Error: {e}")
        database.update_broadcast_status(job_id, "error", error_msg=str(e))


@app.route("/api/send-notification", methods=["POST"])
@token_required
def send_notification():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400

    exam    = data.get("exam")
    message = data.get("message")

    if not exam or not message:
        return jsonify({"success": False, "error": "Missing exam or message"}), 400

    students = database.get_students_by_exam(exam)
    if not students:
        return jsonify({"success": True, "sent_to": 0, "exam": exam, "queued": False,
                        "message": "No eligible students found"})

    total = len(students)

    # FIX: Run in background thread so the HTTP request returns immediately.
    # Without this, 4000 students × 50ms = 200s → guaranteed timeout on PythonAnywhere.
    import uuid
    job_id = str(uuid.uuid4())[:8]
    database.create_broadcast_job(job_id, exam, total)

    t = threading.Thread(
        target=_run_broadcast_in_background,
        args=(job_id, exam, message, students, config.TELEGRAM_BOT_TOKEN),
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
    # get_service_requests now returns rows already joined with student info
    enriched = database.get_service_requests(status=status)

    return jsonify({
        "requests": enriched,
        "total": len(enriched),
        "pending": sum(1 for r in enriched if r["status"] == "pending"),
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


# FIX #2: Document URL endpoint — uses persistent bot (no per-request instantiation)
@app.route("/api/document-url/<file_id>", methods=["GET"])
@token_required
def get_document_url(file_id):
    try:
        async def _get_file_path():
            telegram_file = await _persistent_bot.get_file(file_id)
            return telegram_file.file_path

        file_path = run_async(_get_file_path())
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
        for doc_key in ["photo", "signature", "marksheet", "id_proof"]:
            if doc_key in request.files:
                file = request.files[doc_key]
                if file and file.filename != "":
                    orig_filename = secure_filename(file.filename)
                    # Generate unique name: appid_uuid_origfilename
                    unique_name = f"{app_id}_{uuid.uuid4().hex[:8]}_{orig_filename}"
                    file_path = os.path.join(UPLOAD_FOLDER, unique_name)
                    file.save(file_path)
                    
                    # Log file in database
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

    success, result = database.add_exam_details(
        name, desc, cat, start, end, exam_d, fees_gen, fees_sc, elig, url, enabled
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

    success = database.update_exam_details(
        exam_id, name, desc, cat, start, end, exam_d, fees_gen, fees_sc, elig, url, enabled
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
        
    database.update_application_status(app_id, status, remarks)
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


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=True)
