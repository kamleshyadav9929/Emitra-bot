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
    "cert": {
        "label": "📄 Pramaan Patra (Certificates)",
        "services": [
            "Mool Niwas (Domicile)",
            "Jati Pramaan (Caste SC/ST/OBC)",
            "Aay Pramaan (Income)",
            "Janma/Mrityu (Birth/Death)",
            "Vivah Panjiyan (Marriage)",
            "Charitra Pramaan (Character)",
            "Minority Certificate",
            "EWS Certificate"
        ],
    },
    "id": {
        "label": "🪪 Pehchan (IDs & Updates)",
        "services": [
            "Aadhar Card (New/Update)",
            "Jan Aadhar (New/Update)",
            "PAN Card (New/Correction)",
            "Voter ID (New/Correction)",
            "PVC Aadhar Card Print",
            "SSO ID Creation",
            "Ration Card Correction",
            "Passport Apply"
        ],
    },
    "bills": {
        "label": "💡 Bills, Recharge & Taxes",
        "services": [
            "Bijli Bill (Electricity)",
            "Pani Bill (Water)",
            "Mobile/DTH Recharge",
            "Gas Cylinder Booking",
            "FASTag Recharge",
            "ITR (Income Tax Return)",
            "CM Helpline Sikayat",
            "Traffic Challan Pay"
        ],
    },
    "forms": {
        "label": "🎓 Siksha & Exams (Forms)",
        "services": [
            "Govt. Job Form (RPSC/RSMSSB)",
            "College Admission Form",
            "Scholarship (Chatravriti)",
            "RTE Form (Free Education)",
            "Gargi Puraskar Form",
            "REET/CET/Police Form",
            "Rojgar Panjiyan",
            "Berojgari Bhatta"
        ],
    },
    "schemes": {
        "label": "🏛️ Yojana & Pension",
        "services": [
            "Vridhavastha Pension",
            "Vidhwa Pension",
            "Viklang Pension",
            "Palanhar Yojana",
            "Shramik/Labour Card",
            "PM Awas Yojana",
            "PM Kisaan Samman Nidhi",
            "Ayushman/Chiranjeevi Card"
        ],
    },
    "land_auto": {
        "label": "🌾 Krishi, Khata & Vahan",
        "services": [
            "Khasra/Jamabandi Nakal",
            "Tarbandi Subsidy",
            "Fasal Bima (Crop Insurance)",
            "Krishi Yantra Subsidy",
            "Driving License (DL)",
            "Vahan RC Print/Transfer",
            "Police Verification",
            "Hasiyat Pramaan (Solvency)"
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
    student = database.get_student(chat_id)

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
            "📌 E-Mitra ki kisi seva ke liye type karein: /services\n"
            "📢 Jab updates aayenge, hum aapko notify karenge."
        )


# ── Document Handler ──────────────────────────────────────────────────────────

async def document_handler(update: Update, context):
    """Handles incoming photos and documents."""
    chat_id = update.effective_chat.id
    student = database.get_student(chat_id)
    
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
