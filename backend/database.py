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
    - exam = "ALL"  → everyone who has selected ANY exam (excludes NONE)
    - exam = "JEE"  → JEE students + students who opted into ALL
    """
    conn = get_connection()
    cursor = conn.cursor()
    if exam == "ALL":
        cursor.execute("SELECT * FROM students WHERE exam_preference != 'NONE'")
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
    cursor.execute("SELECT * FROM students")
    return [dict(row) for row in cursor.fetchall()]


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
    """Fetch all service requests, optionally filtered by status."""
    conn = get_connection()
    cursor = conn.cursor()
    if status:
        cursor.execute(
            "SELECT * FROM service_requests WHERE status = ? ORDER BY requested_at DESC",
            (status,)
        )
    else:
        cursor.execute("SELECT * FROM service_requests ORDER BY requested_at DESC")
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
