import os
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

# Initialize database
database.init_db()

@app.route("/webhook", methods=["POST"])
def webhook():
    if request.method == "POST":
        try:
            async def process():
                # Direct Bot instance creates a fresh session, no WSGI thread issues!
                bot = Bot(token=config.TELEGRAM_BOT_TOKEN)
                
                # Parse the incoming update from Telegram
                update = Update.de_json(request.get_json(force=True), bot)
                
                # Manual Handler Routing (100% stable for Flask)
                if update.message and update.message.text:
                    if update.message.text.startswith('/start'):
                        await bot_handlers.start_handler(update, None)
                    else:
                        await bot_handlers.message_handler(update, None)
                elif update.callback_query:
                    await bot_handlers.button_callback_handler(update, None)
            
            # Execute within this request's context
            asyncio.run(process())
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
