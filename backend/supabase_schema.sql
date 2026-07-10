-- Krishna Emitra Optimized & Normalized Database Schema for Supabase (PostgreSQL)

-- To reset the database, run:
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS notification_history CASCADE;
-- DROP TABLE IF EXISTS broadcast_jobs CASCADE;
-- DROP TABLE IF EXISTS message_logs CASCADE;
-- DROP TABLE IF EXISTS login_tokens CASCADE;
-- DROP TABLE IF EXISTS user_documents CASCADE;
-- DROP TABLE IF EXISTS application_documents CASCADE;
-- DROP TABLE IF EXISTS form_applications CASCADE;
-- DROP TABLE IF EXISTS service_requests CASCADE;
-- DROP TABLE IF EXISTS user_exam_subscriptions CASCADE;
-- DROP TABLE IF EXISTS exams CASCADE;
-- DROP TABLE IF EXISTS services CASCADE;
-- DROP TABLE IF EXISTS announcements CASCADE;
-- DROP TABLE IF EXISTS bot_settings CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;

-- 1. Users table (Central identity table, renamed from students)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    clerk_user_id TEXT UNIQUE,
    telegram_id TEXT UNIQUE,
    phone TEXT UNIQUE,
    name TEXT NOT NULL,
    username TEXT,
    role TEXT DEFAULT 'student',
    is_telegram_linked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. Services table
CREATE TABLE IF NOT EXISTS services (
    id SERIAL PRIMARY KEY,
    category_key TEXT NOT NULL,
    category_label TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT DEFAULT '',
    price NUMERIC(10,2) DEFAULT 0.00,
    enabled INTEGER DEFAULT 1,
    show_in_web INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0
);

-- 3. Exams table
CREATE TABLE IF NOT EXISTS exams (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    enabled INTEGER DEFAULT 1,
    description TEXT DEFAULT '',
    category TEXT DEFAULT 'UG',
    start_date DATE,
    end_date DATE,
    exam_date DATE,
    fees_gen_obc TEXT,
    fees_sc_st TEXT,
    eligibility TEXT,
    official_url TEXT
);

-- 4. User Exam Subscriptions table (Many-to-Many junction table)
CREATE TABLE IF NOT EXISTS user_exam_subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, exam_id)
);

-- 5. Service Requests table
CREATE TABLE IF NOT EXISTS service_requests (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    service_id INTEGER REFERENCES services(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);

-- 6. User Documents table
CREATE TABLE IF NOT EXISTS user_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    file_id TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_name TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. Form Applications table
CREATE TABLE IF NOT EXISTS form_applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    exam_id INTEGER REFERENCES exams(id) ON DELETE CASCADE,
    email TEXT,
    dob DATE,
    gender TEXT,
    category TEXT,
    academic_qualification TEXT,
    status TEXT DEFAULT 'pending',
    remarks TEXT,
    submitted_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    doc_submission_method TEXT DEFAULT 'upload'
);

-- 8. Application Documents table
CREATE TABLE IF NOT EXISTS application_documents (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES form_applications(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. Login Tokens table (For Telegram deep-link authentication)
CREATE TABLE IF NOT EXISTS login_tokens (
    token TEXT PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 10. Broadcast Jobs table
CREATE TABLE IF NOT EXISTS broadcast_jobs (
    id TEXT PRIMARY KEY,
    target_exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL, -- NULL indicates target "ALL"
    status TEXT DEFAULT 'queued',
    sent_count INTEGER DEFAULT 0,
    total_count INTEGER DEFAULT 0,
    error_msg TEXT,
    created_by TEXT, -- Email or admin identifier
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 11. Notification History table
CREATE TABLE IF NOT EXISTS notification_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    broadcast_id TEXT REFERENCES broadcast_jobs(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'sent', -- sent, failed
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    error TEXT
);

-- 12. Message Logs table (Auditing broadcast message templates)
CREATE TABLE IF NOT EXISTS message_logs (
    id SERIAL PRIMARY KEY,
    exam_id INTEGER REFERENCES exams(id) ON DELETE SET NULL, -- NULL indicates target "ALL"
    message_text TEXT NOT NULL,
    total_recipients INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 13. Audit Logs table (Track administrative modifications)
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    admin_name TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. Announcements table (Ticker details)
CREATE TABLE IF NOT EXISTS announcements (
    id SERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    links TEXT,
    is_active INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 15. Bot Settings table
CREATE TABLE IF NOT EXISTS bot_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
