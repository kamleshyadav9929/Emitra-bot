import urllib.parse
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
    Bot,
)
from telegram.ext import ContextTypes

import database
import config

# Monkey patch Bot class to personalize every message
def escape_markdown(text: str) -> str:
    for char in ["*", "_", "[", "]", "`"]:
        text = text.replace(char, f"\\{char}")
    return text

def personalize_by_chat_id(chat_id, text: str) -> str:
    if not text:
        return text
    text = str(text)
    
    name = None
    try:
        user = database.get_student_basic(chat_id)
        if user:
            name = user.get("name")
    except Exception as e:
        print(f"Error fetching user name for personalization in bot: {e}")
        
    if not name:
        name = "Student"
        
    name_str = escape_markdown(name.strip())
    prefix = f"Dear {name_str},\n\n"
    
    if text.startswith("Dear ") or f"Dear {name_str}" in text:
        return text
    return f"{prefix}{text}"

_orig_send_message = Bot.send_message
_orig_edit_message_text = Bot.edit_message_text

async def new_send_message(self, *args, **kwargs):
    chat_id = kwargs.get("chat_id")
    text = kwargs.get("text")
    
    args_list = list(args)
    if chat_id is None and len(args_list) > 0:
        chat_id = args_list[0]
    if text is None and len(args_list) > 1:
        text = args_list[1]
        
    if chat_id and text:
        text = personalize_by_chat_id(chat_id, text)
        if "text" in kwargs:
            kwargs["text"] = text
        elif len(args_list) > 1:
            args_list[1] = text
            
    return await _orig_send_message(self, *args_list, **kwargs)

async def new_edit_message_text(self, *args, **kwargs):
    text = kwargs.get("text")
    chat_id = kwargs.get("chat_id")
    
    args_list = list(args)
    if text is None and len(args_list) > 0:
        text = args_list[0]
    if chat_id is None and len(args_list) > 1:
        chat_id = args_list[1]
        
    if chat_id and text:
        text = personalize_by_chat_id(chat_id, text)
        if "text" in kwargs:
            kwargs["text"] = text
        elif len(args_list) > 0:
            args_list[0] = text
            
    return await _orig_edit_message_text(self, *args_list, **kwargs)

Bot.send_message = new_send_message
Bot.edit_message_text = new_edit_message_text


# ── Services Catalog (loaded from DB, not hardcoded) ─────────────────────────

def load_services():
    """
    Load enabled services from the database, grouped by category.
    Returns the same dict shape as the old hardcoded SERVICES constant
    so all downstream keyboard builders work without changes.
    """
    return database.get_services_as_dict()

# ── WhatsApp Link Generator ───────────────────────────────────────────────────

def generate_whatsapp_link(name, phone, service_name):
    message = (
        f"Namaste Krishna Emitra! 🙏\n\n"
        f"📋 Seva: {service_name}\n"
        f"👤 Naam: {name}\n"
        f"📞 Phone: {phone}\n\n"
        f"Kripya meri seva process karein."
    )
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/{config.WHATSAPP_NUMBER}?text={encoded}"


# ── Service Menu Keyboards ────────────────────────────────────────────────────

def build_categories_keyboard():
    """Returns inline keyboard with all service categories (live from DB)."""
    services = load_services()
    buttons = []
    for key, data in services.items():
        buttons.append([InlineKeyboardButton(data["label"], callback_data=f"cat_{key}")])
    return InlineKeyboardMarkup(buttons)


def build_services_keyboard(category_key, services=None):
    """Returns inline keyboard with services for the selected category.
    Accepts an optional pre-loaded services dict to avoid redundant DB calls."""
    if services is None:
        services = load_services()
    category = services.get(category_key)
    if not category:
        return None
    buttons = []
    for i in range(0, len(category["services"]), 2):
        row = []
        for service in category["services"][i : i + 2]:
            row.append(InlineKeyboardButton(service["name"], callback_data=f"svc_{service['id']}"))
        buttons.append(row)
    buttons.append([InlineKeyboardButton("⬅️ Wapas Jayein", callback_data="cat_back")])
    return InlineKeyboardMarkup(buttons)


# ── Message helpers (read from DB, fall back to default) ─────────────────────

def get_msg(key, default):
    """Read a message from bot_settings DB, return default if not set."""
    val = database.get_bot_setting(key)
    return val if val and val.strip() else default

# ── Existing Registration Handlers ────────────────────────────────────────────

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    chat_id = update.effective_chat.id
    message_text = update.message.text if update.message else ""

    login_token = None
    parts = message_text.split()
    if len(parts) > 1 and parts[1].startswith("login_"):
        login_token = parts[1][6:]  # strip "login_"

    if user:
        # Single call: register_user handles the is_new check internally via upsert-like logic
        username = f"@{user.username}" if user.username else ""
        name = user.first_name + (f" {user.last_name}" if user.last_name else "")
        database.register_user(chat_id, name, username)

    if login_token:
        success = database.link_login_token(login_token, chat_id)
        if success:
            await update.message.reply_text(
                "🎉 *Web Login Approved!*\n\n"
                "Aapka account website par successfully link ho gaya hai. Aap browser par wapas ja sakte hain.",
                parse_mode="Markdown"
            )
        else:
            await update.message.reply_text(
                "❌ *Login Link Failed!*\n\n"
                "Yeh login link invalid ho chuka hai ya expire ho gaya hai. Kripya website par naya link generate karein.",
                parse_mode="Markdown"
            )

    student = database.get_student_basic(chat_id)
    has_phone = student and student.get("phone_number") and not student.get("phone_number").startswith("BOT_TEMP_")

    if not has_phone:
        welcome_msg = get_msg(
            "welcome_message",
            "🙏 Namaste! Krishna Emitra Seva mein aapka swagat hai.\n\n"
            "Pehle apna mobile number share karein taaki hum aapko updates bhi bhej sakein:\n"
            "(Neeche button dabayein)"
        )
        contact_button = KeyboardButton("Apna Number Share Karein", request_contact=True)
        reply_markup = ReplyKeyboardMarkup(
            [[contact_button]], resize_keyboard=True, one_time_keyboard=True
        )
        await update.message.reply_text(welcome_msg, reply_markup=reply_markup)
    elif not login_token:
        await update.message.reply_text(
            "✅ Aap already registered hain.\n\n"
            "📌 Krishna Emitra ki kisi seva ke liye type karein: /services\n"
            "📢 Jab updates aayenge, hum aapko notify karenge."
        )


async def prompt_exam_selection(update: Update, current_subs=None):
    chat_id = update.effective_chat.id
    if current_subs is None:
        user = database.get_user_by_telegram_id(chat_id)
        if not user:
            return
        current_subs = database.get_user_exam_subscriptions(user["id"])
        
    # We could also cache exams in prompt_exam_selection, but it is already fast enough if we don't query subs.
    exams = database.get_all_exams()
    
    keyboard = []
    current_row = []
    
    for exam in exams:
        name = exam["name"]
        is_subbed = name in current_subs
        label = f"✅ {name}" if is_subbed else f"☐ {name}"
        current_row.append(InlineKeyboardButton(label, callback_data=f"toggleexam_{name}"))
        if len(current_row) == 2:
            keyboard.append(current_row)
            current_row = []
            
    if current_row:
        keyboard.append(current_row)
        
    is_all = "ALL" in current_subs
    all_label = "✅ Sabhi Exams" if is_all else "☐ Sabhi Exams"
    keyboard.append([InlineKeyboardButton(all_label, callback_data="toggleexam_ALL")])
    keyboard.append([InlineKeyboardButton("🏁 Save Subscriptions", callback_data="exams_SAVE")])
    
    reply_markup = InlineKeyboardMarkup(keyboard)

    welcome_text = get_msg(
        "exam_select_message",
        "✅ Preferred exams select karein (Aap ek se zyada select kar sakte hain):\n\n"
        "Tapping an exam will toggle it. Click Save when finished."
    )

    if update.callback_query:
        try:
            await update.callback_query.edit_message_text(welcome_text, reply_markup=reply_markup)
        except Exception:
            try:
                await update.callback_query.edit_message_reply_markup(reply_markup=reply_markup)
            except Exception:
                pass
    elif update.message:
        await update.message.reply_text(welcome_text, reply_markup=reply_markup)


async def contact_handler(update: Update, context):
    if update.message and update.message.contact:
        chat_id = update.effective_chat.id
        phone = update.message.contact.phone_number
        database.update_phone_number(chat_id, phone)

        await update.message.reply_text(
            "📱 Number save ho gaya!",
            reply_markup=ReplyKeyboardRemove(),
        )
        await prompt_exam_selection(update)


# ── Services Command Handler ──────────────────────────────────────────────────

async def services_handler(update: Update, context):
    """Handles /services command — shows Krishna Emitra service categories."""
    chat_id = update.effective_chat.id
    student = database.get_student_basic(chat_id)

    # Check if user has shared their phone
    if not student or not student.get("phone_number"):
        contact_button = KeyboardButton("Apna Number Share Karein", request_contact=True)
        reply_markup = ReplyKeyboardMarkup(
            [[contact_button]], resize_keyboard=True, one_time_keyboard=True
        )
        await update.message.reply_text(
            "⚠️ WhatsApp link ke liye pehle apna phone number share karna zaroori hai.\n\n"
            "(Neeche button dabayein)",
            reply_markup=reply_markup,
        )
        return

    await update.message.reply_text(
        "🏛️ *Krishna Emitra Seva — Koi seva chunein:*\n\n"
        "Neeche category select karein. Aapka naam aur number automatically WhatsApp message mein aa jayega.",
        parse_mode="Markdown",
        reply_markup=build_categories_keyboard(),
    )


# ── Callback Button Handler ───────────────────────────────────────────────────

async def button_callback_handler(update: Update, context):
    query = update.callback_query
    await query.answer()
    data = query.data

    # ── Exam selection toggle ───────────────────────────────────
    if data.startswith("toggleexam_"):
        exam_choice = data.split("_")[1]
        chat_id = update.effective_chat.id
        user = database.get_user_by_telegram_id(chat_id)
        if user:
            current_subs = database.get_user_exam_subscriptions(user["id"])
            if exam_choice == "ALL":
                if "ALL" in current_subs:
                    new_subs = []
                else:
                    new_subs = ["ALL"]
            else:
                new_subs = [s for s in current_subs if s != "ALL"]
                if exam_choice in new_subs:
                    new_subs.remove(exam_choice)
                else:
                    new_subs.append(exam_choice)
            database.update_user_exam_subscriptions(user["id"], new_subs)
            await prompt_exam_selection(update, current_subs=new_subs)

    elif data == "exams_SAVE":
        chat_id = update.effective_chat.id
        user = database.get_user_by_telegram_id(chat_id)
        current_subs = database.get_user_exam_subscriptions(user["id"]) if user else []
        subs_str = ", ".join(current_subs) if current_subs else "None"
        msg = (
            f"🎉 *Subscriptions Saved!*\n\n"
            f"Aap *{subs_str}* exams ke updates ke liye successfully enrolled ho gaye hain!\n\n"
            f"📌 Krishna Emitra ki kisi seva ke liye type/click karein: /services"
        )
        await query.edit_message_text(text=msg, parse_mode="Markdown")

    # ── Service category back button ────────────────────────────
    elif data == "cat_back":
        await query.edit_message_text(
            text="🏛️ *Krishna Emitra Seva — Koi category chunein:*",
            parse_mode="Markdown",
            reply_markup=build_categories_keyboard(),
        )

    # ── Service category selected ───────────────────────────────
    elif data.startswith("cat_"):
        category_key = data[4:]
        services = load_services()
        category = services.get(category_key)
        if not category:
            return
        keyboard = build_services_keyboard(category_key, services=services)
        await query.edit_message_text(
            text=f"{category['label']}\n\nKoi seva chunein:",
            reply_markup=keyboard,
        )

    # ── Specific service selected ───────────────────────────────
    elif data.startswith("svc_"):
        service_id = data[4:]
        chat_id = update.effective_chat.id
        student = database.get_student_basic(chat_id)

        if not student or not student.get("phone_number"):
            await query.edit_message_text(
                "⚠️ Phone number nahi mila. Pehle /start command karein aur number share karein."
            )
            return

        name = student.get("name", "Student")
        phone = student.get("phone_number", "")
        user_id = student.get("id")

        # Find which category this service belongs to
        service_name = "Service"
        category_label = "other"
        services = load_services()
        for key, cat in services.items():
            for s in cat["services"]:
                if str(s["id"]) == service_id:
                    service_name = s["name"]
                    category_label = key
                    break

        # Save to DB directly
        database.add_service_request_direct(user_id, service_id, category_label)

        # Generate WhatsApp link
        wa_link = generate_whatsapp_link(name, phone, service_name)

        await query.edit_message_text(
            text=(
                f"✅ *{service_name}* seva ki request successfully submit ho gayi hai! 🏛️\n\n"
                f"Aapki request humare Admin Panel par receive ho chuki hai. Hum jald hi isko process karenge aur receipt isi chat mein bhej denge!\n\n"
                f"📞 *(Optional)* Agar aap direct updates ke liye WhatsApp par message bhejna chahte hain, toh neeche button dabaayein:\n\n"
                f"[📲 WhatsApp pe Bhejein]({wa_link})\n\n"
                f"_Hum form process karke details aapko yahan bhej denge._"
            ),
            parse_mode="Markdown",
            disable_web_page_preview=True,
        )


# ── Additional Command Handlers ───────────────────────────────────────────────

async def status_handler(update: Update, context):
    """Handles /status command — shows user registration details."""
    chat_id = update.effective_chat.id
    student = database.get_student(chat_id)

    if not student:
        await update.message.reply_text(
            "❌ Aap register nahi hain. Start karne ke liye /start type karein."
        )
        return

    msg = (
        f"👤 *Aapki Details:*\n\n"
        f"Name: {student.get('name', 'N/A')}\n"
        f"Phone: {student.get('phone_number', 'Not provided')}\n"
        f"Exam Preference: {student.get('exam_preference', 'NONE')}\n\n"
        f"Agar aapna exam preference badalna chahte hain toh /change type karein."
    )
    await update.message.reply_text(msg, parse_mode="Markdown")


async def change_handler(update: Update, context):
    """
    Handles /change command — re-prompts exam selection.
    FIX #11: Previously called prompt_exam_selection directly which
    showed the contact button again even for registered users.
    Now checks if phone is already on file and skips that step.
    """
    chat_id = update.effective_chat.id
    student = database.get_student_basic(chat_id)

    if student and student.get("phone_number"):
        # Already registered — just show exam selector
        await prompt_exam_selection(update)
    else:
        # First time or missing phone — ask for contact first
        contact_button = KeyboardButton("Apna Number Share Karein", request_contact=True)
        reply_markup = ReplyKeyboardMarkup(
            [[contact_button]], resize_keyboard=True, one_time_keyboard=True
        )
        await update.message.reply_text(
            "📱 Pehle apna number share karein taaki hum aapko update bhej sakein:",
            reply_markup=reply_markup,
        )


# ── Default Message Handler ───────────────────────────────────────────────────

async def message_handler(update: Update, context):
    chat_id = update.effective_chat.id
    student = database.get_student(chat_id)

    if not student or student.get("exam_preference") == "NONE":
        await prompt_exam_selection(update)
    else:
        await update.message.reply_text(
            "✅ Aap already registered hain.\n\n"
            "📌 Krishna Emitra ki kisi seva ke liye type karein: /services\n"
            "📢 Jab updates aayenge, hum aapko notify karenge."
        )


# ── Document Handler ──────────────────────────────────────────────────────────

async def document_handler(update: Update, context):
    """Handles incoming photos and documents."""
    chat_id = update.effective_chat.id
    student = database.get_student_basic(chat_id)
    
    if not student:
        await update.message.reply_text(
            "❌ Aap register nahi hain. Start karne ke liye /start type karein."
        )
        return

    file_id = None
    file_type = "document"
    file_name = "Upload"

    if update.message.document:
        file_id = update.message.document.file_id
        file_name = update.message.document.file_name or "document"
        file_type = "document"
    elif update.message.photo:
        file_id = update.message.photo[-1].file_id # get highest resolution
        file_name = f"photo_{file_id[-6:]}.jpg"
        file_type = "photo"

    if file_id:
        database.save_document(chat_id, file_id, file_type, file_name)
        await update.message.reply_text(
            f"✅ Aapka document (*{file_name}*) successfully receive ho gaya hai. Hum jaldi hi isko check karenge!",
            parse_mode="Markdown"
        )
