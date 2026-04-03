import sqlite3
import os
import threading

DB_PATH = os.path.join(os.path.dirname(__file__), "emitra.db")

# Thread-local storage for connections (safe for multi-threaded Flask)
_local = threading.local()


def get_connection():
    """Return a thread-local SQLite connection (avoids repeated open/close overhead)."""
    if not hasattr(_local, "conn") or _local.conn is None:
        _local.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        _local.conn.row_factory = sqlite3.Row
        _local.conn.execute("PRAGMA journal_mode=WAL")
    return _local.conn


def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            telegram_id     TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            username        TEXT,
            phone_number    TEXT,
            exam_preference TEXT DEFAULT 'NONE',
            is_registered   INTEGER DEFAULT 0,
            joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active     DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Migration: add phone_number column if it doesn't exist
    try:
        cursor.execute("ALTER TABLE students ADD COLUMN phone_number TEXT")
    except Exception:
        pass

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS message_logs (
            id               INTEGER PRIMARY KEY AUTOINCREMENT,
            target_exam      TEXT NOT NULL,
            message_text     TEXT NOT NULL,
            total_recipients INTEGER DEFAULT 0,
            sent_at          DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ── NEW: Service Requests table ──────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS service_requests (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id  TEXT NOT NULL,
            service_name TEXT NOT NULL,
            category     TEXT NOT NULL,
            status       TEXT DEFAULT 'pending',
            requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            completed_at DATETIME
        )
    ''')

    # ── NEW: User Documents table ──────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_documents (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id  TEXT NOT NULL,
            file_id      TEXT NOT NULL,
            file_type    TEXT NOT NULL,
            file_name    TEXT,
            uploaded_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ── NEW: Scheduled Broadcasts table ──────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            target_exam  TEXT NOT NULL,
            message_text TEXT NOT NULL,
            run_at       DATETIME NOT NULL,
            status       TEXT DEFAULT 'pending',
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # ── Bot Settings table ────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bot_settings (
            key   TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
    ''')

    # ── Services table (Bot Manager ↔ actual bot) ─────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS services (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            category_key   TEXT NOT NULL,
            category_label TEXT NOT NULL,
            name           TEXT NOT NULL,
            description    TEXT DEFAULT '',
            price          TEXT DEFAULT '',
            enabled        INTEGER DEFAULT 1,
            sort_order     INTEGER DEFAULT 0
        )
    ''')

    # ── Exams table ──────────────────────────────────────────────────────────
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS exams (
            id      INTEGER PRIMARY KEY AUTOINCREMENT,
            name    TEXT UNIQUE NOT NULL,
            enabled INTEGER DEFAULT 1
        )
    ''')

    conn.commit()

    # Seed default services only if table is empty
    cursor.execute("SELECT COUNT(*) as cnt FROM services")
    if cursor.fetchone()["cnt"] == 0:
        _seed_default_services(conn)

    # Seed default exams only if table is empty
    cursor.execute("SELECT COUNT(*) as cnt FROM exams")
    if cursor.fetchone()["cnt"] == 0:
        _seed_default_exams(conn)


def _seed_default_services(conn):
    """Populate services table with the original hardcoded catalog."""
    defaults = [
        # (category_key, category_label, name, description, price)
        ("cert", "📄 Pramaan Patra (Certificates)", "Mool Niwas (Domicile)",          "Niwas praman patra",          "₹30"),
        ("cert", "📄 Pramaan Patra (Certificates)", "Jati Pramaan (Caste SC/ST/OBC)", "Jati praman patra",           "₹30"),
        ("cert", "📄 Pramaan Patra (Certificates)", "Aay Pramaan (Income)",            "Aay praman patra",            "₹30"),
        ("cert", "📄 Pramaan Patra (Certificates)", "Janma/Mrityu (Birth/Death)",      "Janm/mrityu praman",          "₹20"),
        ("cert", "📄 Pramaan Patra (Certificates)", "Vivah Panjiyan (Marriage)",        "Vivah panjiyan",              "₹50"),
        ("cert", "📄 Pramaan Patra (Certificates)", "Charitra Pramaan (Character)",    "Charitra praman patra",       "₹30"),
        ("cert", "📄 Pramaan Patra (Certificates)", "Minority Certificate",             "Alpasankhyak praman patra",   "₹30"),
        ("cert", "📄 Pramaan Patra (Certificates)", "EWS Certificate",                 "EWS praman patra",            "₹30"),

        ("id",   "🪪 Pehchan (IDs & Updates)",      "Aadhar Card (New/Update)",        "Aadhar naam/address update",  "₹50"),
        ("id",   "🪪 Pehchan (IDs & Updates)",      "Jan Aadhar (New/Update)",         "Jan Aadhar card",             "₹0"),
        ("id",   "🪪 Pehchan (IDs & Updates)",      "PAN Card (New/Correction)",       "Naye PAN ke liye apply",      "₹110"),
        ("id",   "🪪 Pehchan (IDs & Updates)",      "Voter ID (New/Correction)",       "Voter ID banwao ya sudhar",   "₹0"),
        ("id",   "🪪 Pehchan (IDs & Updates)",      "PVC Aadhar Card Print",           "PVC Aadhar card print",       "₹50"),
        ("id",   "🪪 Pehchan (IDs & Updates)",      "SSO ID Creation",                 "Rajasthan SSO ID banao",      "₹0"),
        ("id",   "🪪 Pehchan (IDs & Updates)",      "Ration Card Correction",          "Ration card mein sudhar",     "₹0"),
        ("id",   "🪪 Pehchan (IDs & Updates)",      "Passport Apply",                  "Passport ke liye apply",      "₹1500"),

        ("bills","💡 Bills, Recharge & Taxes",       "Bijli Bill (Electricity)",        "Bijli bill payment",          "Free"),
        ("bills","💡 Bills, Recharge & Taxes",       "Pani Bill (Water)",               "Pani bill payment",           "Free"),
        ("bills","💡 Bills, Recharge & Taxes",       "Mobile/DTH Recharge",             "Mobile ya DTH recharge",      "Free"),
        ("bills","💡 Bills, Recharge & Taxes",       "Gas Cylinder Booking",            "LPG cylinder booking",        "Free"),
        ("bills","💡 Bills, Recharge & Taxes",       "FASTag Recharge",                 "FASTag recharge",             "Free"),
        ("bills","💡 Bills, Recharge & Taxes",       "ITR (Income Tax Return)",         "Income tax return file karo", "₹200"),
        ("bills","💡 Bills, Recharge & Taxes",       "CM Helpline Sikayat",             "CM helpline complaint",       "Free"),
        ("bills","💡 Bills, Recharge & Taxes",       "Traffic Challan Pay",             "Traffic challan payment",     "Free"),

        ("forms","🎓 Siksha & Exams (Forms)",        "Govt. Job Form (RPSC/RSMSSB)",   "Sarkari naukri form",         "₹100"),
        ("forms","🎓 Siksha & Exams (Forms)",        "College Admission Form",          "College admission form",      "₹50"),
        ("forms","🎓 Siksha & Exams (Forms)",        "Scholarship (Chatravriti)",       "Chatravriti ke liye apply",   "Free"),
        ("forms","🎓 Siksha & Exams (Forms)",        "RTE Form (Free Education)",       "RTE ke liye form",            "Free"),
        ("forms","🎓 Siksha & Exams (Forms)",        "Gargi Puraskar Form",             "Gargi puraskar form",         "Free"),
        ("forms","🎓 Siksha & Exams (Forms)",        "REET/CET/Police Form",            "REET, CET, Police form",      "₹100"),
        ("forms","🎓 Siksha & Exams (Forms)",        "Rojgar Panjiyan",                 "Rachayment panjiyan",         "Free"),
        ("forms","🎓 Siksha & Exams (Forms)",        "Berojgari Bhatta",                "Berojgari bhatta ke liye",    "Free"),

        ("schemes","🏛️ Yojana & Pension",            "Vridhavastha Pension",            "Budhape ki pension",          "Free"),
        ("schemes","🏛️ Yojana & Pension",            "Vidhwa Pension",                  "Vidhwa pension",              "Free"),
        ("schemes","🏛️ Yojana & Pension",            "Viklang Pension",                 "Viklang pension",             "Free"),
        ("schemes","🏛️ Yojana & Pension",            "Palanhar Yojana",                 "Palanhar yojana form",        "Free"),
        ("schemes","🏛️ Yojana & Pension",            "Shramik/Labour Card",             "Shramik card banao",          "Free"),
        ("schemes","🏛️ Yojana & Pension",            "PM Awas Yojana",                  "PM Awas yojana",              "Free"),
        ("schemes","🏛️ Yojana & Pension",            "PM Kisaan Samman Nidhi",          "PM Kisaan samman nidhi",      "Free"),
        ("schemes","🏛️ Yojana & Pension",            "Ayushman/Chiranjeevi Card",       "Ayushman card banao",         "Free"),

        ("land_auto","🌾 Krishi, Khata & Vahan",    "Khasra/Jamabandi Nakal",          "Khasra/jamabandi nakal",      "₹20"),
        ("land_auto","🌾 Krishi, Khata & Vahan",    "Tarbandi Subsidy",                "Tarbandi subsidy",            "Free"),
        ("land_auto","🌾 Krishi, Khata & Vahan",    "Fasal Bima (Crop Insurance)",     "Fasal bima",                  "Free"),
        ("land_auto","🌾 Krishi, Khata & Vahan",    "Krishi Yantra Subsidy",           "Krishi yantra subsidy",       "Free"),
        ("land_auto","🌾 Krishi, Khata & Vahan",    "Driving License (DL)",            "DL banao ya renew karo",      "₹200"),
        ("land_auto","🌾 Krishi, Khata & Vahan",    "Vahan RC Print/Transfer",         "RC print ya transfer",        "₹100"),
        ("land_auto","🌾 Krishi, Khata & Vahan",    "Police Verification",             "Police verification",         "₹50"),
        ("land_auto","🌾 Krishi, Khata & Vahan",    "Hasiyat Pramaan (Solvency)",      "Hasiyat praman patra",        "₹30"),
    ]
    for i, row in enumerate(defaults):
        conn.execute(
            "INSERT INTO services (category_key, category_label, name, description, price, enabled, sort_order) VALUES (?,?,?,?,?,1,?)",
            (row[0], row[1], row[2], row[3], row[4], i)
        )
    conn.commit()


def _seed_default_exams(conn):
    defaults = ["JEE", "NEET", "SSC", "UPSC", "CUET"]
    for exam in defaults:
        conn.execute("INSERT OR IGNORE INTO exams (name) VALUES (?)", (exam,))
    conn.commit()



# ── Student helpers ──────────────────────────────────────────────────────────

def is_new_user(telegram_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM students WHERE telegram_id = ?", (str(telegram_id),))
    return cursor.fetchone() is None


def register_user(telegram_id, name, username):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR IGNORE INTO students (telegram_id, name, username, is_registered)
        VALUES (?, ?, ?, 1)
    ''', (str(telegram_id), name, username))
    conn.commit()


def update_phone_number(telegram_id, phone_number):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE students
        SET phone_number = ?, last_active = CURRENT_TIMESTAMP
        WHERE telegram_id = ?
    ''', (phone_number, str(telegram_id)))
    conn.commit()


def update_exam_preference(telegram_id, exam):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE students
        SET exam_preference = ?, is_registered = 1, last_active = CURRENT_TIMESTAMP
        WHERE telegram_id = ?
    ''', (exam, str(telegram_id)))
    conn.commit()


def get_student(telegram_id):
    """Fetch a single student by telegram_id."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students WHERE telegram_id = ?", (str(telegram_id),))
    row = cursor.fetchone()
    return dict(row) if row else None


def get_students_by_exam(exam):
    """
    Returns students to notify for a given exam target.
    - exam = "ALL"  → everyone who has selected ANY exam (excludes NONE and BLOCKED)
    - exam = "JEE"  → JEE students + students who opted into ALL
    """
    conn = get_connection()
    cursor = conn.cursor()
    if exam == "ALL":
        cursor.execute("SELECT * FROM students WHERE exam_preference != 'NONE' AND exam_preference != 'BLOCKED'")
    else:
        cursor.execute(
            "SELECT * FROM students WHERE exam_preference = ? OR exam_preference = 'ALL'",
            (exam,),
        )
    return [dict(row) for row in cursor.fetchall()]


def get_all_students():
    """Returns every student (for admin listing, includes NONE)."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM students ORDER BY joined_at DESC")
    return [dict(row) for row in cursor.fetchall()]


def block_student(telegram_id):
    """Marks a student as blocked — they stay in DB but won't receive broadcasts."""
    conn = get_connection()
    conn.execute(
        "UPDATE students SET exam_preference = 'BLOCKED', is_registered = 0 WHERE telegram_id = ?",
        (str(telegram_id),)
    )
    conn.commit()


def delete_student(telegram_id):
    """Permanently removes a student and all their associated data."""
    conn = get_connection()
    tid = str(telegram_id)
    conn.execute("DELETE FROM service_requests WHERE telegram_id = ?", (tid,))
    conn.execute("DELETE FROM user_documents WHERE telegram_id = ?", (tid,))
    conn.execute("DELETE FROM students WHERE telegram_id = ?", (tid,))
    conn.commit()


def get_stats():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT COUNT(*) as total FROM students")
    total_row = cursor.fetchone()
    total = total_row["total"] if total_row else 0

    cursor.execute(
        "SELECT exam_preference, COUNT(*) as count FROM students GROUP BY exam_preference"
    )
    rows = cursor.fetchall()

    by_exam = {"JEE": 0, "NEET": 0, "SSC": 0, "UPSC": 0, "CUET": 0, "ALL": 0, "NONE": 0}
    for row in rows:
        pref = row["exam_preference"]
        if pref in by_exam:
            by_exam[pref] = row["count"]

    return {"total_students": total, "by_exam": by_exam}


# ── Message log helpers ──────────────────────────────────────────────────────

def log_message(target_exam, message_text, count):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO message_logs (target_exam, message_text, total_recipients)
        VALUES (?, ?, ?)
    ''', (target_exam, message_text, count))
    conn.commit()


def get_logs():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM message_logs ORDER BY sent_at DESC")
    return [dict(row) for row in cursor.fetchall()]


# ── Service Request helpers ──────────────────────────────────────────────────

def add_service_request(telegram_id, service_name, category):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO service_requests (telegram_id, service_name, category)
        VALUES (?, ?, ?)
    ''', (str(telegram_id), service_name, category))
    conn.commit()
    return cursor.lastrowid


def get_service_requests(status=None):
    """
    Fetch service requests with student info via a single JOIN query.
    FIX: Replaced N+1 loop (one DB call per request) with one JOIN query.
    """
    conn = get_connection()
    cursor = conn.cursor()
    query = '''
        SELECT
            sr.id, sr.telegram_id, sr.service_name, sr.category,
            sr.status, sr.requested_at, sr.completed_at,
            COALESCE(s.name, 'Unknown')      AS student_name,
            COALESCE(s.phone_number, '')     AS student_phone,
            COALESCE(s.username, '')         AS student_username
        FROM service_requests sr
        LEFT JOIN students s ON s.telegram_id = sr.telegram_id
        {where}
        ORDER BY sr.requested_at DESC
    '''
    if status:
        cursor.execute(query.format(where="WHERE sr.status = ?"), (status,))
    else:
        cursor.execute(query.format(where=""))
    return [dict(row) for row in cursor.fetchall()]


def get_pending_count():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as cnt FROM service_requests WHERE status = 'pending'")
    row = cursor.fetchone()
    return row["cnt"] if row else 0


def complete_service_request(request_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE service_requests
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
    ''', (request_id,))
    conn.commit()


# ── Document Handling ────────────────────────────────────────────────────────

def save_document(telegram_id, file_id, file_type, file_name=""):
    conn = get_connection()
    conn.execute(
        "INSERT INTO user_documents (telegram_id, file_id, file_type, file_name) VALUES (?, ?, ?, ?)",
        (str(telegram_id), str(file_id), str(file_type), str(file_name))
    )
    conn.commit()

def get_user_documents(telegram_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM user_documents WHERE telegram_id = ? ORDER BY uploaded_at DESC",
        (str(telegram_id),)
    )
    return [dict(row) for row in cursor.fetchall()]


# ── Scheduled Broadcasts Handling ────────────────────────────────────────────

def add_scheduled_broadcast(target_exam, message_text, run_at):
    conn = get_connection()
    conn.execute(
        "INSERT INTO scheduled_broadcasts (target_exam, message_text, run_at) VALUES (?, ?, ?)",
        (target_exam, message_text, run_at)
    )
    conn.commit()

def get_pending_broadcasts():
    conn = get_connection()
    cursor = conn.cursor()
    # FIX: Use datetime('now') — PythonAnywhere runs UTC, 'localtime' was IST on dev only.
    # Store run_at as UTC strings; frontend converts local→UTC before storing.
    cursor.execute(
        "SELECT * FROM scheduled_broadcasts WHERE status = 'pending' AND run_at <= datetime('now') ORDER BY run_at ASC"
    )
    return [dict(row) for row in cursor.fetchall()]

def get_all_schedules():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM scheduled_broadcasts ORDER BY run_at DESC")
    return [dict(row) for row in cursor.fetchall()]

def mark_broadcast_complete(schedule_id):
    conn = get_connection()
    conn.execute(
        "UPDATE scheduled_broadcasts SET status = 'completed' WHERE id = ?",
        (schedule_id,)
    )
    conn.commit()

def delete_schedule(schedule_id):
    conn = get_connection()
    conn.execute("DELETE FROM scheduled_broadcasts WHERE id = ?", (schedule_id,))
    conn.commit()


# ── Bot Settings CRUD ────────────────────────────────────────────────────────

def get_bot_setting(key, default=None):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM bot_settings WHERE key = ?", (key,))
    row = cursor.fetchone()
    return row["value"] if row else default


def get_all_bot_settings():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT key, value FROM bot_settings")
    return {row["key"]: row["value"] for row in cursor.fetchall()}


def set_bot_setting(key, value):
    conn = get_connection()
    conn.execute(
        "INSERT OR REPLACE INTO bot_settings (key, value) VALUES (?, ?)",
        (str(key), str(value))
    )
    conn.commit()


def set_bot_settings_bulk(settings_dict):
    """Upsert multiple settings at once."""
    conn = get_connection()
    for k, v in settings_dict.items():
        conn.execute(
            "INSERT OR REPLACE INTO bot_settings (key, value) VALUES (?, ?)",
            (str(k), str(v))
        )
    conn.commit()


# ── Services CRUD ─────────────────────────────────────────────────────────────

def get_all_services():
    """Returns all services ordered by category and sort_order."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM services ORDER BY sort_order ASC, id ASC")
    return [dict(row) for row in cursor.fetchall()]


def get_services_as_dict():
    """
    Returns services grouped by category — same structure as the old hardcoded
    SERVICES dict in bot.py, but driven by the database.
    Only returns enabled services.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT * FROM services WHERE enabled = 1 ORDER BY sort_order ASC, id ASC"
    )
    rows = cursor.fetchall()

    # Build ordered dict preserving category order
    result = {}
    for row in rows:
        key = row["category_key"]
        if key not in result:
            result[key] = {
                "label": row["category_label"],
                "services": [],
            }
        result[key]["services"].append(row["name"])
    return result


def add_service(category_key, category_label, name, description="", price="", enabled=True):
    conn = get_connection()
    cursor = conn.cursor()
    # Place at end of its category
    cursor.execute("SELECT MAX(sort_order) as m FROM services WHERE category_key = ?", (category_key,))
    row = cursor.fetchone()
    next_order = (row["m"] or 0) + 1
    conn.execute(
        "INSERT INTO services (category_key, category_label, name, description, price, enabled, sort_order) VALUES (?,?,?,?,?,?,?)",
        (category_key, category_label, name, description, price, 1 if enabled else 0, next_order)
    )
    conn.commit()
    return cursor.lastrowid


def update_service(service_id, **fields):
    """Update any combination of: name, description, price, category_key, category_label, enabled."""
    allowed = {"name", "description", "price", "category_key", "category_label", "enabled"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if not updates:
        return
    conn = get_connection()
    clauses = ", ".join(f"{k} = ?" for k in updates)
    values = list(updates.values()) + [service_id]
    conn.execute(f"UPDATE services SET {clauses} WHERE id = ?", values)
    conn.commit()


def toggle_service(service_id):
    """Flip enabled ↔ disabled."""
    conn = get_connection()
    conn.execute(
        "UPDATE services SET enabled = CASE WHEN enabled = 1 THEN 0 ELSE 1 END WHERE id = ?",
        (service_id,)
    )
    conn.commit()


def delete_service(service_id):
    conn = get_connection()
    conn.execute("DELETE FROM services WHERE id = ?", (service_id,))
    conn.commit()


# ── Exams Management ─────────────────────────────────────────────────────────

def get_all_exams():
    """Returns list of enabled exams."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM exams WHERE enabled = 1 ORDER BY id ASC")
    return [dict(row) for row in cursor.fetchall()]

def add_exam(name):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO exams (name) VALUES (?)", (name.strip(),))
        conn.commit()
        return True, cursor.lastrowid
    except sqlite3.IntegrityError:
        return False, "Exam already exists"

def delete_exam(exam_id):
    conn = get_connection()
    conn.execute("DELETE FROM exams WHERE id = ?", (exam_id,))
    conn.commit()

