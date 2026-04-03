import sqlite3
import os

DB_PATH = "emitra.db"

def migrate():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}")
        return

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    print("Starting migration...")

    # 1. Create new students table with integer ID as Primary Key
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS students_new (
            id              INTEGER PRIMARY KEY AUTOINCREMENT,
            telegram_id     TEXT UNIQUE,
            name            TEXT NOT NULL,
            username        TEXT,
            phone_number    TEXT UNIQUE NOT NULL,
            exam_preference TEXT DEFAULT 'NONE',
            is_registered   INTEGER DEFAULT 0,
            joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active     DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 2. Copy data from old table to new table
    # We need to handle cases where phone_number might be null or duplicate in the old table
    # For migration, we'll use telegram_id as a fallback for phone_number if it's missing, 
    # but the new schema requires a unique phone_number.
    cursor.execute("SELECT * FROM students")
    old_students = cursor.fetchall()
    
    for row in old_students:
        # If phone_number is missing, we use a placeholder or skip?
        # Better to use "TEMP_" + telegram_id if phone is missing to maintain uniqueness during migration
        phone = row['phone_number'] if row['phone_number'] else f"TEMP_{row['telegram_id']}"
        
        try:
            cursor.execute('''
                INSERT INTO students_new (telegram_id, name, username, phone_number, exam_preference, is_registered, joined_at, last_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ''', (
                row['telegram_id'], 
                row['name'], 
                row['username'], 
                phone, 
                row['exam_preference'], 
                row['is_registered'], 
                row['joined_at'], 
                row['last_active']
            ))
        except sqlite3.IntegrityError as e:
            print(f"Skipping duplicate/error row for {row['telegram_id']}: {e}")

    # 3. Handle service_requests and user_documents (they reference telegram_id, which is still UNIQUE)
    # So we don't strictly need to change their foreign keys yet, but it's good practice.
    # We'll keep them referencing telegram_id for now to avoid breaking the bot logic too much.

    # 4. Create announcements table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS announcements (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            title        TEXT NOT NULL,
            content      TEXT NOT NULL,
            links        TEXT,
            is_active    INTEGER DEFAULT 1,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # 5. Swap tables
    cursor.execute("DROP TABLE students")
    cursor.execute("ALTER TABLE students_new RENAME TO students")

    conn.commit()
    conn.close()
    print("Migration completed successfully!")

if __name__ == "__main__":
    migrate()
