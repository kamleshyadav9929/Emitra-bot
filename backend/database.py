import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "emitra.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students (
            telegram_id     TEXT PRIMARY KEY,
            name            TEXT NOT NULL,
            username        TEXT,
            exam_preference TEXT DEFAULT 'NONE',
            is_registered   INTEGER DEFAULT 0,
            joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active     DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS message_logs (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            target_exam     TEXT NOT NULL,
            message_text    TEXT NOT NULL,
            total_recipients INTEGER DEFAULT 0,
            sent_at         DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def is_new_user(telegram_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT 1 FROM students WHERE telegram_id = ?", (str(telegram_id),))
    result = cursor.fetchone()
    conn.close()
    return result is None

def register_user(telegram_id, name, username):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR IGNORE INTO students (telegram_id, name, username, is_registered)
        VALUES (?, ?, ?, 1)
    ''', (str(telegram_id), name, username))
    conn.commit()
    conn.close()

def update_exam_preference(telegram_id, exam):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE students
        SET exam_preference = ?, is_registered = 1, last_active = CURRENT_TIMESTAMP
        WHERE telegram_id = ?
    ''', (exam, str(telegram_id)))
    conn.commit()
    conn.close()

def get_students_by_exam(exam):
    conn = get_connection()
    cursor = conn.cursor()
    if exam == "ALL":
        cursor.execute("SELECT * FROM students")
    else:
        cursor.execute("SELECT * FROM students WHERE exam_preference = ?", (exam,))
    students = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return students

def get_all_students():
    return get_students_by_exam("ALL")

def get_stats():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as total FROM students")
    total_row = cursor.fetchone()
    total = total_row['total'] if total_row else 0
    
    cursor.execute("SELECT exam_preference, COUNT(*) as count FROM students GROUP BY exam_preference")
    rows = cursor.fetchall()
    
    by_exam = {
        "JEE": 0, "NEET": 0, "SSC": 0, "UPSC": 0, "CUET": 0, "ALL": 0, "NONE": 0
    }
    for row in rows:
        by_exam[row['exam_preference']] = row['count']
    
    # "ALL" button in Telegram allows receiving updates for all exams, they also count as students.
    # Total overall includes everyone.
    by_exam["ALL"] = by_exam.get("ALL", 0) 
    
    stats = {
        "total_students": total,
        "by_exam": by_exam
    }
    conn.close()
    return stats

def log_message(target_exam, message_text, count):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO message_logs (target_exam, message_text, total_recipients)
        VALUES (?, ?, ?)
    ''', (target_exam, message_text, count))
    conn.commit()
    conn.close()

def get_logs():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM message_logs ORDER BY sent_at DESC")
    logs = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return logs
