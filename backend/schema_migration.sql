-- ============================================================
-- SCHEMA MIGRATION SCRIPT
-- ============================================================
-- NOTE: Please run this script in your Supabase SQL Editor.
-- This will DROP your existing exams and applications tables 
-- and replace them with the new normalized schema.

-- 1. DROP EXISTING DEPENDENT TABLES
DROP TABLE IF EXISTS public.application_documents CASCADE;
DROP TABLE IF EXISTS public.form_applications CASCADE;
DROP TABLE IF EXISTS public.user_exam_subscriptions CASCADE;
DROP TABLE IF EXISTS public.message_logs CASCADE;
DROP TABLE IF EXISTS public.broadcast_jobs CASCADE;
DROP TABLE IF EXISTS public.notification_history CASCADE;
DROP TABLE IF EXISTS public.exams CASCADE;
DROP TABLE IF EXISTS public.exam_cycles CASCADE;
DROP TABLE IF EXISTS public.exam_categories CASCADE;

-- ============================================================
-- EXAM CATEGORIES (lookup table)
-- ============================================================
CREATE TABLE public.exam_categories (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  key text NOT NULL UNIQUE,     
  label text NOT NULL           
);

-- Populate default categories
INSERT INTO public.exam_categories (key, label) VALUES
  ('engineering', 'Engineering'),
  ('medical', 'Medical'),
  ('central_govt', 'Central Government'),
  ('rajasthan_govt', 'Rajasthan Government'),
  ('banking', 'Banking & Finance'),
  ('defense', 'Defense'),
  ('teaching', 'Teaching & Education'),
  ('other', 'Other');

-- ============================================================
-- EXAMS (identity table)
-- ============================================================
CREATE TABLE public.exams (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name text NOT NULL UNIQUE,
  category_id integer REFERENCES public.exam_categories(id) ON DELETE SET NULL,
  description text DEFAULT '',
  official_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exams_category ON public.exams(category_id);

-- ============================================================
-- EXAM CYCLES (year-wise form dates, fees, eligibility)
-- ============================================================
CREATE TABLE public.exam_cycles (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exam_id integer NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  cycle_year integer NOT NULL,
  start_date date,
  end_date date,
  exam_date date,
  fees_gen_obc text,
  fees_sc_st text,
  eligibility text,
  is_confirmed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT exam_cycles_unique UNIQUE (exam_id, cycle_year)
);
CREATE INDEX idx_exam_cycles_exam ON public.exam_cycles(exam_id);

-- ============================================================
-- USER <-> EXAM SUBSCRIPTIONS
-- ============================================================
CREATE TABLE public.user_exam_subscriptions (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_id integer NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT user_exam_subscriptions_unique UNIQUE (user_id, exam_id)
);
CREATE INDEX idx_ues_user ON public.user_exam_subscriptions(user_id);
CREATE INDEX idx_ues_exam ON public.user_exam_subscriptions(exam_id);

-- ============================================================
-- FORM APPLICATIONS (tied to exam cycle)
-- ============================================================
CREATE TABLE public.form_applications (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  exam_cycle_id integer NOT NULL REFERENCES public.exam_cycles(id) ON DELETE RESTRICT,
  email text,
  dob date,
  gender text CHECK (gender IN ('male','female','other')),
  category text,
  academic_qualification text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','submitted','completed','rejected')),
  remarks text,
  doc_submission_method text NOT NULL DEFAULT 'upload' CHECK (doc_submission_method IN ('upload','telegram','in_person')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX idx_fa_user ON public.form_applications(user_id);
CREATE INDEX idx_fa_cycle ON public.form_applications(exam_cycle_id);

CREATE TABLE public.application_documents (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  application_id integer NOT NULL REFERENCES public.form_applications(id) ON DELETE CASCADE,
  file_type text NOT NULL,
  file_path text NOT NULL,
  file_name text NOT NULL,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_ad_application ON public.application_documents(application_id);

-- Recreate Broadcast Jobs & Message Logs linking to new exams table
CREATE TABLE public.broadcast_jobs (
  id text NOT NULL PRIMARY KEY,
  target_exam_id integer REFERENCES public.exams(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','running','completed','failed')),
  sent_count integer NOT NULL DEFAULT 0,
  total_count integer NOT NULL DEFAULT 0,
  error_msg text,
  created_by text,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  finished_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.notification_history (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id integer NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  broadcast_id text REFERENCES public.broadcast_jobs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent','failed','delivered')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  error text
);
CREATE INDEX idx_nh_user ON public.notification_history(user_id);
CREATE INDEX idx_nh_broadcast ON public.notification_history(broadcast_id);

CREATE TABLE public.message_logs (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  exam_id integer REFERENCES public.exams(id) ON DELETE SET NULL,
  message_text text NOT NULL,
  total_recipients integer NOT NULL DEFAULT 0,
  sent_at timestamptz NOT NULL DEFAULT now()
);
