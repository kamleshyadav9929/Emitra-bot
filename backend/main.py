import os
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from telegram import Update
from telegram.ext import Application, CommandHandler, MessageHandler, CallbackQueryHandler, filters

import config
import database
import notifier
import bot as bot_handlers

app = Flask(__name__)
CORS(app)

# Initialize database
database.init_db()

# Global Telegram Application instance
tg_app = None

import threading

# Create a global loop for thread-safe execution
global_loop = asyncio.new_event_loop()

def start_background_loop(loop):
    asyncio.set_event_loop(loop)
    loop.run_forever()

thread = threading.Thread(target=start_background_loop, args=(global_loop,), daemon=True)
thread.start()

def init_telegram():
    if not config.TELEGRAM_BOT_TOKEN or config.TELEGRAM_BOT_TOKEN == "your_bot_token_here":
        print("WARNING: TELEGRAM_BOT_TOKEN is not set properly. Telegram webhook will default to NO-OP.")
        return None

    application = Application.builder().token(config.TELEGRAM_BOT_TOKEN).build()
    
    # Handlers
    application.add_handler(CommandHandler("start", bot_handlers.start_handler))
    application.add_handler(CallbackQueryHandler(bot_handlers.button_callback_handler))
    application.add_handler(MessageHandler(filters.TEXT & (~filters.COMMAND), bot_handlers.message_handler))
    
    return application

tg_app = init_telegram()

@app.route("/webhook", methods=["POST"])
def webhook():
    if not tg_app:
        return jsonify({"ok": False, "error": "Bot Not Configured"}), 500

    if request.method == "POST":
        try:
            update = Update.de_json(request.get_json(force=True), tg_app.bot)
            
            async def process():
                if not tg_app._initialized:
                    await tg_app.initialize()
                    await tg_app.start()
                await tg_app.process_update(update)

            # Threadsafe execution
            future = asyncio.run_coroutine_threadsafe(process(), global_loop)
            future.result(timeout=10) # Safely wait for it to process
            return jsonify({"ok": True})
        except Exception as e:
            print("Webhook processing error:", str(e))
            return jsonify({"ok": False, "error": str(e)}), 500
            
    return jsonify({"ok": False})

@app.route("/api/students", methods=["GET"])
def get_students():
    exam = request.args.get("exam", "ALL")
    students = database.get_students_by_exam(exam)
    return jsonify({
        "students": students,
        "total": len(students)
    })

@app.route("/api/stats", methods=["GET"])
def get_stats():
    stats = database.get_stats()
    return jsonify(stats)

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
        return jsonify({"success": True, "sent_to": 0, "exam": exam, "message": "No students found"})

    success_count = notifier.broadcast(config.TELEGRAM_BOT_TOKEN, students, message)
    
    database.log_message(exam, message, success_count)
    
    return jsonify({
        "success": True,
        "sent_to": success_count,
        "exam": exam
    })

@app.route("/api/logs", methods=["GET"])
def get_logs_api():
    logs = database.get_logs()
    return jsonify({"logs": logs})

@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({
        "status": "awake",
        "message": "E-Mitra bot is running!"
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=config.FLASK_PORT, debug=True)
