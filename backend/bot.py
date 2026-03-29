from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup
from telegram.ext import ContextTypes
import database

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    chat_id = update.effective_chat.id

    if user:
        if database.is_new_user(chat_id):
            username = f"@{user.username}" if user.username else ""
            name = user.first_name + (f" {user.last_name}" if user.last_name else "")
            database.register_user(chat_id, name, username)

    await prompt_exam_selection(update)

async def prompt_exam_selection(update: Update):
    keyboard = [
        [
            InlineKeyboardButton("JEE", callback_data="exam_JEE"),
            InlineKeyboardButton("NEET", callback_data="exam_NEET")
        ],
        [
            InlineKeyboardButton("SSC", callback_data="exam_SSC"),
            InlineKeyboardButton("UPSC", callback_data="exam_UPSC")
        ],
        [
            InlineKeyboardButton("CUET", callback_data="exam_CUET"),
            InlineKeyboardButton("Sabhi Exams", callback_data="exam_ALL")
        ]
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)
    
    welcome_text = (
        "🙏 Namaste! E-Mitra Seva mein aapka swagat hai.\n\n"
        "Main aapko exam notifications bhejta rahunga.\n\n"
        "📚 Aap kis exam ki taiyari kar rahe hain?\n"
        "Neeche se select karein:"
    )

    if update.callback_query:
        await update.callback_query.message.reply_text(welcome_text, reply_markup=reply_markup)
    elif update.message:
        await update.message.reply_text(welcome_text, reply_markup=reply_markup)


async def button_callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()
    
    data = query.data
    if data.startswith("exam_"):
        exam_choice = data.split("_")[1]
        chat_id = update.effective_chat.id
        
        database.update_exam_preference(chat_id, exam_choice)
        
        if exam_choice == "ALL":
            msg = "✅ Aap sabhi exams ke updates ke liye registered hain!"
        else:
            msg = f"✅ Perfect! Aap {exam_choice} ke liye registered hain.\nAb aapko {exam_choice} se related sabhi updates milenge. 🎯"
            
        await query.edit_message_text(text=msg)

async def message_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    # If a user types randomly, check their status
    chat_id = update.effective_chat.id
    cursor = database.get_connection().cursor()
    cursor.execute("SELECT exam_preference FROM students WHERE telegram_id = ?", (str(chat_id),))
    row = cursor.fetchone()
    
    if not row or row["exam_preference"] == "NONE":
        await prompt_exam_selection(update)
    else:
        await update.message.reply_text("Aap already registered hain ✅\nJab updates aayenge, hum aapko message bhej denge.")
