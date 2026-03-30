import urllib.parse
from telegram import (
    Update,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    KeyboardButton,
    ReplyKeyboardMarkup,
    ReplyKeyboardRemove,
)
from telegram.ext import ContextTypes

import database
import config

# ── E-Mitra Services Catalog ─────────────────────────────────────────────────

SERVICES = {
    "documents": {
        "label": "📄 Documents & Certificates",
        "services": [
            "Aadhar Card Update",
            "PAN Card",
            "Birth Certificate",
            "Death Certificate",
            "Caste Certificate",
            "Income Certificate",
            "Domicile Certificate",
            "Marriage Certificate",
        ],
    },
    "utility": {
        "label": "💡 Utility Bills",
        "services": [
            "Bijli Bill (Electricity)",
            "Pani Bill (Water)",
            "Gas Connection",
        ],
    },
    "schemes": {
        "label": "🏛️ Government Schemes",
        "services": [
            "Ration Card",
            "Jan Aadhaar / Bhamashah",
            "Scholarship Form",
            "PM Awas Yojana",
        ],
    },
    "license": {
        "label": "🚗 License & Passport",
        "services": [
            "Driving License",
            "Passport Apply",
            "Vehicle RC",
        ],
    },
    "land": {
        "label": "🌾 Land Records",
        "services": [
            "Khasra / Jamabandi",
            "Patta / Nakal",
            "Mutation (Namantrann)",
        ],
    },
}

# ── WhatsApp Link Generator ───────────────────────────────────────────────────

def generate_whatsapp_link(name, phone, service_name):
    message = (
        f"Namaste E-Mitra! 🙏\n\n"
        f"📋 Seva: {service_name}\n"
        f"👤 Naam: {name}\n"
        f"📞 Phone: {phone}\n\n"
        f"Kripya meri seva process karein."
    )
    encoded = urllib.parse.quote(message)
    return f"https://wa.me/{config.WHATSAPP_NUMBER}?text={encoded}"


# ── Service Menu Keyboards ────────────────────────────────────────────────────

def build_categories_keyboard():
    """Returns inline keyboard with all service categories."""
    buttons = []
    for key, data in SERVICES.items():
        buttons.append([InlineKeyboardButton(data["label"], callback_data=f"cat_{key}")])
    return InlineKeyboardMarkup(buttons)


def build_services_keyboard(category_key):
    """Returns inline keyboard with services for the selected category."""
    category = SERVICES.get(category_key)
    if not category:
        return None
    buttons = []
    for i in range(0, len(category["services"]), 2):
        row = []
        for service in category["services"][i : i + 2]:
            row.append(InlineKeyboardButton(service, callback_data=f"svc_{service}"))
        buttons.append(row)
    buttons.append([InlineKeyboardButton("⬅️ Wapas Jayein", callback_data="cat_back")])
    return InlineKeyboardMarkup(buttons)


# ── Existing Registration Handlers ────────────────────────────────────────────

async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user = update.effective_user
    chat_id = update.effective_chat.id

    if user and database.is_new_user(chat_id):
        username = f"@{user.username}" if user.username else ""
        name = user.first_name + (f" {user.last_name}" if user.last_name else "")
        database.register_user(chat_id, name, username)

    contact_button = KeyboardButton("Apna Number Share Karein", request_contact=True)
    reply_markup = ReplyKeyboardMarkup(
        [[contact_button]], resize_keyboard=True, one_time_keyboard=True
    )

    await update.message.reply_text(
        "🙏 Namaste! E-Mitra Seva mein aapka swagat hai.\n\n"
        "Pehle apna mobile number share karein taaki hum aapko updates bhi bhej sakein:\n"
        "(Neeche button dabayein)",
        reply_markup=reply_markup,
    )


async def prompt_exam_selection(update: Update):
    keyboard = [
        [
            InlineKeyboardButton("JEE", callback_data="exam_JEE"),
            InlineKeyboardButton("NEET", callback_data="exam_NEET"),
        ],
        [
            InlineKeyboardButton("SSC", callback_data="exam_SSC"),
            InlineKeyboardButton("UPSC", callback_data="exam_UPSC"),
        ],
        [
            InlineKeyboardButton("CUET", callback_data="exam_CUET"),
            InlineKeyboardButton("Sabhi Exams", callback_data="exam_ALL"),
        ],
    ]
    reply_markup = InlineKeyboardMarkup(keyboard)

    welcome_text = (
        "✅ Number save ho gaya!\n\n"
        "Ab bataiye — aap kis exam ki taiyari kar rahe hain?\n"
        "Neeche se select karein:"
    )

    if update.callback_query:
        await update.callback_query.message.reply_text(welcome_text, reply_markup=reply_markup)
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
    """Handles /services command — shows E-Mitra service categories."""
    chat_id = update.effective_chat.id
    student = database.get_student(chat_id)

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
        "🏛️ *E-Mitra Seva — Koi seva chunein:*\n\n"
        "Neeche category select karein. Aapka naam aur number automatically WhatsApp message mein aa jayega.",
        parse_mode="Markdown",
        reply_markup=build_categories_keyboard(),
    )


# ── Callback Button Handler ───────────────────────────────────────────────────

async def button_callback_handler(update: Update, context):
    query = update.callback_query
    await query.answer()
    data = query.data

    # ── Exam selection ──────────────────────────────────────────
    if data.startswith("exam_"):
        exam_choice = data.split("_")[1]
        chat_id = update.effective_chat.id
        database.update_exam_preference(chat_id, exam_choice)

        if exam_choice == "ALL":
            msg = (
                "🎉 Badhai ho! Aap sabhi exams ke updates ke liye enrolled ho gaye hain!\n\n"
                "📌 E-Mitra ki kisi seva ke liye type karein: /services"
            )
        else:
            msg = (
                f"🎉 Badhai ho! Aap *{exam_choice}* exam ke updates ke liye enrolled ho gaye hain!\n\n"
                f"📌 E-Mitra ki kisi seva ke liye type karein: /services"
            )
        await query.edit_message_text(text=msg, parse_mode="Markdown")

    # ── Service category back button ────────────────────────────
    elif data == "cat_back":
        await query.edit_message_text(
            text="🏛️ *E-Mitra Seva — Koi category chunein:*",
            parse_mode="Markdown",
            reply_markup=build_categories_keyboard(),
        )

    # ── Service category selected ───────────────────────────────
    elif data.startswith("cat_"):
        category_key = data[4:]
        category = SERVICES.get(category_key)
        if not category:
            return
        keyboard = build_services_keyboard(category_key)
        await query.edit_message_text(
            text=f"{category['label']}\n\nKoi seva chunein:",
            reply_markup=keyboard,
        )

    # ── Specific service selected ───────────────────────────────
    elif data.startswith("svc_"):
        service_name = data[4:]
        chat_id = update.effective_chat.id
        student = database.get_student(chat_id)

        if not student or not student.get("phone_number"):
            await query.edit_message_text(
                "⚠️ Phone number nahi mila. Pehle /start command karein aur number share karein."
            )
            return

        name = student.get("name", "Student")
        phone = student.get("phone_number", "")

        # Find which category this service belongs to
        category_label = "Other"
        for key, cat in SERVICES.items():
            if service_name in cat["services"]:
                category_label = key
                break

        # Save to DB
        database.add_service_request(chat_id, service_name, category_label)

        # Generate WhatsApp link
        wa_link = generate_whatsapp_link(name, phone, service_name)

        await query.edit_message_text(
            text=(
                f"✅ *{service_name}* seva ke liye request bhejein!\n\n"
                f"Neeche link dabayein — WhatsApp khulega aur message already filled hoga. "
                f"Bas *Send* dabayein. 👇\n\n"
                f"[📲 WhatsApp pe Bhejein]({wa_link})\n\n"
                f"_Hum aapka form jald process karenge aur receipt bhej denge!_"
            ),
            parse_mode="Markdown",
            disable_web_page_preview=True,
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
            "📌 E-Mitra ki kisi seva ke liye type karein: /services\n"
            "📢 Jab updates aayenge, hum aapko notify karenge."
        )
