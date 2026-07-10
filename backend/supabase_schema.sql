-- Krishna Emitra Database Schema for Supabase (PostgreSQL)

-- 1. Students table
CREATE TABLE IF NOT EXISTS students (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    name TEXT NOT NULL,
    username TEXT,
    phone_number TEXT UNIQUE NOT NULL,
    exam_preference TEXT DEFAULT 'NONE',
    is_registered INTEGER DEFAULT 0,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_active TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Message logs table
CREATE TABLE IF NOT EXISTS message_logs (
    id SERIAL PRIMARY KEY,
    target_exam TEXT NOT NULL,
    message_text TEXT NOT NULL,
    total_recipients INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. Service requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT,
    phone_number TEXT,
    service_name TEXT NOT NULL,
    category TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 4. User documents table
CREATE TABLE IF NOT EXISTS user_documents (
    id SERIAL PRIMARY KEY,
    telegram_id TEXT NOT NULL,
    file_id TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_name TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bot settings table
CREATE TABLE IF NOT EXISTS bot_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- 6. Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category_key TEXT NOT NULL,
    category_label TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price TEXT DEFAULT '',
    enabled INTEGER DEFAULT 1,
    show_in_web INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
);

-- 7. Announcements table
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    links TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. Broadcast jobs table
CREATE TABLE IF NOT EXISTS broadcast_jobs (
    id TEXT PRIMARY KEY,
    target_exam TEXT NOT NULL,
    status TEXT DEFAULT 'queued',
    sent_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    error_msg TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    enabled INTEGER DEFAULT 1,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'UG',
    start_date TEXT,
    end_date TEXT,
    exam_date TEXT,
    fees_gen_obc TEXT,
    fees_sc_st TEXT,
    eligibility TEXT,
    official_url TEXT
);

-- 10. Form applications table
CREATE TABLE IF NOT EXISTS form_applications (
    id SERIAL PRIMARY KEY,
    student_name TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    email TEXT,
    dob TEXT,
    gender TEXT,
    category TEXT,
    exam_name TEXT NOT NULL,
    academic_qualification TEXT,
    status TEXT DEFAULT 'pending',
    remarks TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    doc_submission_method TEXT DEFAULT 'upload'
);

-- 11. Application documents table
CREATE TABLE IF NOT EXISTS application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES form_applications(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 12. Login tokens table for Telegram deep-link login
CREATE TABLE IF NOT EXISTS login_tokens (
    token TEXT PRIMARY KEY,
    telegram_id TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

