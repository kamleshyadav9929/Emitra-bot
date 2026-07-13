import sys

def migrate():
    print("❌ DEPRECATED: Local SQLite database files are no longer used by this application.")
    print("📢 Database tables and schemas are hosted and managed directly on Supabase (PostgreSQL).")
    print("📝 To apply schema migrations, please run standard SQL migrations in your Supabase SQL Editor.")
    sys.exit(1)

if __name__ == "__main__":
    migrate()
