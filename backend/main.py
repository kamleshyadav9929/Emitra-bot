import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from telegram import Update, Bot

import config
import database
import notifier
import bot as bot_handlers

app = Flask(__name__)
CORS(app)

# Initialize database on startup
database.init_db()


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

            elif update.message and update.message.text:
                text = update.message.text
                if text.startswith("/start"):
                    await bot_handlers.start_handler(update, None)
                elif text.startswith("/services"):
                    await bot_handlers.services_handler(update, None)
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
def get_students():
    exam = request.args.get("exam", "ALL")
    if exam == "ALL":
        students = database.get_all_students()
    else:
        students = database.get_students_by_exam(exam)
    return jsonify({"students": students, "total": len(students)})


@app.route("/api/stats", methods=["GET"])
def get_stats():
    stats = database.get_stats()
    stats["pending_requests"] = database.get_pending_count()
    return jsonify(stats)


# ── Broadcast API ─────────────────────────────────────────────────────────────

@app.route("/api/send-notification", methods=["POST"])
def send_notification():
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400

    secret = data.get("secret_key")
    if secret != config.ADMIN_SECRET_KEY:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

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


# ── Service Requests API ──────────────────────────────────────────────────────

@app.route("/api/service-requests", methods=["GET"])
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
def send_receipt():
    """Allows admin to send a receipt/message to a specific student via Telegram."""
    data = request.json
    if not data:
        return jsonify({"success": False, "error": "Invalid JSON"}), 400

    secret = data.get("secret_key")
    if secret != config.ADMIN_SECRET_KEY:
        return jsonify({"success": False, "error": "Unauthorized"}), 401

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
def get_logs_api():
    logs = database.get_logs()
    return jsonify({"logs": logs})


# ── Health Check ──────────────────────────────────────────────────────────────

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({
        "status": "awake",
        "message": "E-Mitra bot is running!",
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=True)
