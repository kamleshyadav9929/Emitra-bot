-- SQL Script to enable Row Level Security (RLS) on all database tables in Supabase.
-- Since the frontend accesses the database solely through the Python backend (which uses
-- the 'service_role' key, bypassing RLS), enabling RLS prevents unauthorized direct
-- public access (via anon keys/REST API) to the data.

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_exam_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE broadcast_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bot_settings ENABLE ROW LEVEL SECURITY;

-- If you have these extra metadata tables in your schema, enable RLS on them too:
ALTER TABLE exam_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE exam_cycles ENABLE ROW LEVEL SECURITY;
