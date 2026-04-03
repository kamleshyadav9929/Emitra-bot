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

# ── In-memory broadcast job tracker ──────────────────────────────────────────
# Stores status of background broadcast jobs so the frontend can poll.
_broadcast_jobs = {}  # job_id -> {"status": "running"|"done", "sent": N, "total": N, "exam": ...}

app = Flask(__name__)
CORS(app)

# ── Rate Limiter Setup ────────────────────────────────────────────────────────
limiter = Limiter(
    get_remote_address,
    app=app,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="memory://",
)

# Initialize database on startup
database.init_db()



# ── Authentication ─────────────────────────────────────────────────────────────

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"]
            if auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({"error": "Token is missing. Please log in again."}), 401

        try:
            jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
        except Exception:
            return jsonify({"error": "Token is invalid or expired."}), 401

        return f(*args, **kwargs)
    return decorated


# ── FIX #7: Login rate limiting ───────────────────────────────────────────────

_login_attempts = defaultdict(list)
LOGIN_MAX_ATTEMPTS = 10       # max attempts
LOGIN_WINDOW_SECONDS = 300    # per 5 minutes

def _check_login_rate_limit(ip):
    now = _time.time()
    window_start = now - LOGIN_WINDOW_SECONDS
    _login_attempts[ip] = [t for t in _login_attempts[ip] if t > window_start]
    if len(_login_attempts[ip]) >= LOGIN_MAX_ATTEMPTS:
        return False
    _login_attempts[ip].append(now)
    return True


@app.route("/api/login", methods=["POST"])
def login():
    ip = request.remote_addr or "unknown"
    if not _check_login_rate_limit(ip):
        return jsonify({"error": "Too many login attempts. Try again in 5 minutes."}), 429

    data = request.json
    if not data or not data.get("password"):
        return jsonify({"error": "Missing password"}), 400

    password = data.get("password")

    if password == config.ADMIN_SECRET_KEY:
        token = jwt.encode({
            "admin": True,
            "exp": datetime.now(timezone.utc) + timedelta(days=7)
        }, config.JWT_SECRET_KEY, algorithm="HS256")
        return jsonify({"token": token, "success": True})

    return jsonify({"error": "Invalid administrative password"}), 401


def run_async(coro):
    """
    Safely runs an async coroutine from a synchronous Flask route.
    Creates a new event loop per call to avoid conflicts with Flask's WSGI context.
    """
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(coro)
    finally:
        loop.close()
        asyncio.set_event_loop(None)


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
            bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
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

        run_async(process())
        return jsonify({"ok": True})

    except Exception as e:
        print("Webhook processing error:", str(e))
        return jsonify({"ok": False, "error": str(e)}), 500
# ── Public API (Unprotected / Rate-Limited) ───────────────────────────────────

@app.route("/api/public/services", methods=["GET"])
def get_public_services():
    return jsonify({"services": database.get_services_as_dict()})


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


def _run_broadcast_in_background(job_id, exam, message, students, token):
    """Runs in a daemon thread — broadcasts to all students without blocking the HTTP response."""
    _broadcast_jobs[job_id]["status"] = "running"
    try:
        success_count = notifier.broadcast(token, students, message)
        database.log_message(exam, message, success_count)
        _broadcast_jobs[job_id].update({"status": "done", "sent": success_count})
    except Exception as e:
        _broadcast_jobs[job_id].update({"status": "error", "error": str(e)})


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
    _broadcast_jobs[job_id] = {"status": "queued", "sent": 0, "total": total, "exam": exam}

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
    """Frontend polls this to show real-time broadcast progress."""
    job = _broadcast_jobs.get(job_id)
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


# FIX #2: Document URL endpoint — loop was referenced before assignment
@app.route("/api/document-url/<file_id>", methods=["GET"])
@token_required
def get_document_url(file_id):
    try:
        async def _get_file_path():
            bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
            telegram_file = await bot.get_file(file_id)
            return telegram_file.file_path

        # run_async creates and manages its own event loop — no NameError
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
    "cert":       "📄 Pramaan Patra (Certificates)",
    "id":         "🪪 Pehchan (IDs & Updates)",
    "bills":      "💡 Bills, Recharge & Taxes",
    "forms":      "🎓 Siksha & Exams (Forms)",
    "schemes":    "🏛️ Yojana & Pension",
    "land_auto":  "🌾 Krishi, Khata & Vahan",
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


# ── Exams API ─────────────────────────────────────────────────────────────────

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


# ── Health Check ──────────────────────────────────────────────────────────────

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({
        "status": "awake",
        "message": "E-Mitra bot is running!",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=True)
