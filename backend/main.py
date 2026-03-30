import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from telegram import Update, Bot
try:
    from apscheduler.schedulers.background import BackgroundScheduler
    APSCHEDULER_AVAILABLE = True
except ImportError:
    APSCHEDULER_AVAILABLE = False
    print("WARNING: apscheduler not installed. Scheduled broadcasts will not run automatically.")

import config
import database
import notifier
import bot as bot_handlers

import jwt
from functools import wraps
from datetime import datetime, timedelta, timezone

app = Flask(__name__)
CORS(app)

# Initialize database on startup
database.init_db()


# ── Background Scheduler ──────────────────────────────────────────────────────

def check_scheduled_broadcasts():
    """Runs periodically to check and send due broadcasts."""
    pending = database.get_pending_broadcasts()
    for p in pending:
        exam = p["target_exam"]
        message = p["message_text"]
        
        if exam == "ALL":
            students = database.get_all_students()
        else:
            students = database.get_students_by_exam(exam)
            
        success_count = notifier.broadcast(config.TELEGRAM_BOT_TOKEN, students, message)
        database.log_message(exam, message, success_count)
        database.mark_broadcast_complete(p["id"])

if APSCHEDULER_AVAILABLE:
    scheduler = BackgroundScheduler()
    # Run the job every 60 seconds
    scheduler.add_job(func=check_scheduled_broadcasts, trigger="interval", seconds=60)
    scheduler.start()
else:
    print("Scheduler not started. Run: pip install apscheduler")


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
            data = jwt.decode(token, config.JWT_SECRET_KEY, algorithms=["HS256"])
        except Exception as e:
            return jsonify({"error": "Token is invalid or expired."}), 401
            
        return f(*args, **kwargs)
    # Important: Flask decorators need to retain the correct endpoint name
    # @wraps handles this, but since we are modifying multiple routes, wraps solves the AssertionError.
    return decorated

@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    if not data or not data.get("password"):
        return jsonify({"error": "Missing password"}), 400
        
    password = data.get("password")
    
    # We use ADMIN_SECRET_KEY as the master admin password
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


# ── Telegram Webhook ──────────────────────────────────────────────────────────

@app.route("/webhook", methods=["POST"])
def webhook():
    if request.method != "POST":
        return jsonify({"ok": False}), 405

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


# ── Broadcast API ─────────────────────────────────────────────────────────────

@app.route("/api/send-notification", methods=["POST"])
@token_required
def send_notification():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400

    exam = data.get("exam")
    message = data.get("message")

    if not exam or not message:
        return jsonify({"success": False, "error": "Missing exam or message"}), 400

    students = database.get_students_by_exam(exam)
    if not students:
        return jsonify({
            "success": True, "sent_to": 0, "exam": exam,
            "message": "No eligible students found",
        })

    success_count = notifier.broadcast(config.TELEGRAM_BOT_TOKEN, students, message)
    database.log_message(exam, message, success_count)

    return jsonify({
        "success": True,
        "sent_to": success_count,
        "total_eligible": len(students),
        "exam": exam,
    })


@app.route("/api/schedule", methods=["POST"])
@token_required
def schedule_broadcast():
    data = request.json
    if not data or not data.get("exam") or not data.get("message") or not data.get("run_at"):
        return jsonify({"success": False, "error": "Missing required fields"}), 400
        
    database.add_scheduled_broadcast(data["exam"], data["message"], data["run_at"])
    return jsonify({"success": True})


@app.route("/api/schedules", methods=["GET"])
@token_required
def get_schedules():
    return jsonify({"schedules": database.get_all_schedules()})


@app.route("/api/schedules/<int:schedule_id>", methods=["DELETE"])
@token_required
def delete_schedule(schedule_id):
    database.delete_schedule(schedule_id)
    return jsonify({"success": True})


# ── Service Requests API ──────────────────────────────────────────────────────

@app.route("/api/service-requests", methods=["GET"])
@token_required
def get_service_requests():
    status = request.args.get("status")  # optional: pending / completed
    requests_list = database.get_service_requests(status=status)

    # Join student info for each request
    enriched = []
    for req in requests_list:
        student = database.get_student(req["telegram_id"]) or {}
        enriched.append({
            **req,
            "student_name": student.get("name", "Unknown"),
            "student_phone": student.get("phone_number", ""),
            "student_username": student.get("username", ""),
        })

    return jsonify({
        "requests": enriched,
        "total": len(enriched),
        "pending": sum(1 for r in enriched if r["status"] == "pending"),
    })


@app.route("/api/send-receipt", methods=["POST"])
@token_required
def send_receipt():
    """Allows admin to send a receipt/message to a specific student via Telegram."""
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400

    telegram_id = data.get("telegram_id")
    message = data.get("message")
    request_id = data.get("request_id")

    if not telegram_id or not message:
        return jsonify({"success": False, "error": "Missing telegram_id or message"}), 400

    success = notifier.send_message_to_user(
        config.TELEGRAM_BOT_TOKEN, telegram_id, message
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

@app.route("/api/document-url/<file_id>", methods=["GET"])
@token_required
def get_document_url(file_id):
    try:
        def fetch_url():
            bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
            telegram_file = loop.run_until_complete(bot.get_file(file_id))
            return telegram_file.file_path

        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        url = fetch_url()
        loop.close()

        return jsonify({"url": url})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ── Health Check ──────────────────────────────────────────────────────────────

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({
        "status": "awake",
        "message": "E-Mitra bot is running!",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=True)
