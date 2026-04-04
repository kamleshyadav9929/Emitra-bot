import sqlite3
import os
import sys

# Ensure backend directory is in path
sys.path.append(os.path.dirname(__file__))

import database

def force_rebuild():
    print("🚀 Starting Force Database Rebuild...")
    
    db_path = database.DB_PATH
    print(f"📁 Database Path: {db_path}")

    # 1. Delete the existing database if it exists (to clear corruption/malformed errors)
    if os.path.exists(db_path):
        print("🗑️  Removing existing database file...")
        try:
            os.remove(db_path)
            # Also remove WAL/SHM files
            for ext in ["-shm", "-wal"]:
                if os.path.exists(db_path + ext):
                    os.remove(db_path + ext)
            print("✅ Database cleared.")
        except Exception as e:
            print(f"❌ Error removing database: {e}")
            return

    # 2. Run Initialization (Creates tables and seeds default data)
    print("🛠️  Initializing fresh database and seeding tables...")
    try:
        database.init_db()
        print("✅ Tables created and default data seeded.")
    except Exception as e:
        print(f"❌ Error during initialization: {e}")
        return

    # 3. Verification
    print("🔍 Verifying service count...")
    try:
        conn = database.get_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT COUNT(*) as cnt FROM services")
        s_count = cursor.fetchone()["cnt"]
        
        cursor.execute("SELECT COUNT(*) as cnt FROM exams")
        e_count = cursor.fetchone()["cnt"]
        
        print(f"📊 Services found: {s_count}")
        print(f"📊 Exams found: {e_count}")
        
        if s_count > 0:
            print("\n✨ SUCCESS! Your database is fully populated.")
            print("📣 Don't forget to RELOAD your Web App in the PythonAnywhere dashboard!")
        else:
            print("\n❌ Seed failed: Service count is 0. Please check database.py seeding logic.")
            
    except Exception as e:
        print(f"❌ Verification error: {e}")

if __name__ == "__main__":
    force_rebuild()
