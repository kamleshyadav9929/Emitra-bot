import time as _time
from datetime import datetime
from supabase import create_client, Client
import config

# ── In-memory TTL cache ──────────────────────────────────────────────────────
_cache = {}          # key -> (value, expiry_timestamp)
_CACHE_TTL = 300     # 5 minutes


def _cache_get(key):
    entry = _cache.get(key)
    if entry and entry[1] > _time.monotonic():
        return entry[0]
    return None


def _cache_set(key, value):
    _cache[key] = (value, _time.monotonic() + _CACHE_TTL)


def _cache_invalidate(*keys):
    for key in keys:
        _cache.pop(key, None)


# Initialize Supabase client
supabase: Client = None
if config.SUPABASE_URL and config.SUPABASE_KEY:
    try:
        import os
        import httpx
        from supabase import ClientOptions
        
        proxy = os.environ.get("HTTP_PROXY") or os.environ.get("http_proxy")
        
        if proxy:
            custom_client = httpx.Client(proxies=proxy)
            options = ClientOptions(httpx_client=custom_client, postgrest_client_timeout=10.0)
            supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY, options=options)
        else:
            options = ClientOptions(postgrest_client_timeout=10.0)
            supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY, options=options)
            
    except Exception as e:
        print(f"ERROR: Failed to initialize Supabase client: {e}")
else:
    print("WARNING: SUPABASE_URL and SUPABASE_KEY are not configured.")



def init_db():
    """Verify connection, create storage buckets, and seed default data."""
    if not supabase:
        print("WARNING: Supabase is not initialized. Skipping DB initialization.")
        return
    try:
        # Create required storage buckets if they don't exist
        try:
            supabase.storage.get_bucket("student_documents")
        except Exception:
            supabase.storage.create_bucket("student_documents", options={"public": False})
            print("Created private bucket: student_documents")
            
        try:
            supabase.storage.get_bucket("broadcast_images")
        except Exception:
            supabase.storage.create_bucket("broadcast_images", options={"public": True})
            print("Created public bucket: broadcast_images")

        # Check if services table is empty
        res = supabase.table("services").select("id", count="exact").limit(1).execute()
        if res.count == 0:
            _seed_default_services()
            print("Successfully seeded default services to Supabase.")
            
        # Check if exams table is empty
        res_ex = supabase.table("exams").select("id", count="exact").limit(1).execute()
        if res_ex.count == 0:
            _seed_default_exams()
            print("Successfully seeded default exams to Supabase.")

        # Check if bot_settings table is empty
        res_set = supabase.table("bot_settings").select("key", count="exact").limit(1).execute()
        if res_set.count == 0:
            _seed_default_settings()
            print("Successfully seeded default bot settings to Supabase.")
    except Exception as e:
        print(f"Database initialization warning: {e}. Please ensure you ran supabase_schema.sql on your Supabase dashboard.")


def _seed_default_services():
    defaults = [
        ("cert", "Pramaan Patra (Certificates)", "Mool Niwas (Domicile)",          "Niwas praman patra",          30.00),
        ("cert", "Pramaan Patra (Certificates)", "Jati Pramaan (Caste SC/ST/OBC)", "Jati praman patra",           30.00),
        ("cert", "Pramaan Patra (Certificates)", "Aay Pramaan (Income)",            "Aay praman patra",            30.00),
        ("cert", "Pramaan Patra (Certificates)", "Janma/Mrityu (Birth/Death)",      "Janm/mrityu praman",          20.00),
        ("cert", "Pramaan Patra (Certificates)", "Vivah Panjiyan (Marriage)",        "Vivah panjiyan",              50.00),
        ("cert", "Pramaan Patra (Certificates)", "Charitra Pramaan (Character)",    "Charitra praman patra",       30.00),
        ("cert", "Pramaan Patra (Certificates)", "Minority Certificate",             "Alpasankhyak praman patra",   30.00),
        ("cert", "Pramaan Patra (Certificates)", "EWS Certificate",                 "EWS praman patra",            30.00),

        ("id",   "Pehchan (IDs & Updates)",      "Aadhar Card (New/Update)",        "Aadhar naam/address update",  50.00),
        ("id",   "Pehchan (IDs & Updates)",      "Jan Aadhar (New/Update)",         "Jan Aadhar card",             0.00),
        ("id",   "Pehchan (IDs & Updates)",      "PAN Card (New/Correction)",       "Naye PAN ke liye apply",      110.00),
        ("id",   "Pehchan (IDs & Updates)",      "Voter ID (New/Correction)",       "Voter ID banwao ya sudhar",   0.00),
        ("id",   "Pehchan (IDs & Updates)",      "PVC Aadhar Card Print",           "PVC Aadhar card print",       50.00),
        ("id",   "Pehchan (IDs & Updates)",      "SSO ID Creation",                 "Rajasthan SSO ID banao",      0.00),
        ("id",   "Pehchan (IDs & Updates)",      "Ration Card Correction",          "Ration card mein sudhar",     0.00),
        ("id",   "Pehchan (IDs & Updates)",      "Passport Apply",                  "Passport ke liye apply",      1500.00),

        ("bills","Bills, Recharge & Taxes",       "Bijli Bill (Electricity)",        "Bijli bill payment",          0.00),
        ("bills","Bills, Recharge & Taxes",       "Pani Bill (Water)",               "Pani bill payment",           0.00),
        ("bills","Bills, Recharge & Taxes",       "Mobile/DTH Recharge",             "Mobile ya DTH recharge",      0.00),
        ("bills","Bills, Recharge & Taxes",       "Gas Cylinder Booking",            "LPG cylinder booking",        0.00),
        ("bills","Bills, Recharge & Taxes",       "FASTag Recharge",                 "FASTag recharge",             0.00),
        ("bills","Bills, Recharge & Taxes",       "ITR (Income Tax Return)",         "Income tax return file karo", 200.00),
        ("bills","Bills, Recharge & Taxes",       "CM Helpline Sikayat",             "CM helpline complaint",       0.00),
        ("bills","Bills, Recharge & Taxes",       "Traffic Challan Pay",             "Traffic challan payment",     0.00),

        ("forms","Siksha & Exams (Forms)",        "Govt. Job Form (RPSC/RSMSSB)",   "Sarkari naukri form",         100.00),
        ("forms","Siksha & Exams (Forms)",        "College Admission Form",          "College admission form",      50.00),
        ("forms","Siksha & Exams (Forms)",        "Scholarship (Chatravriti)",       "Chatravriti ke liye apply",   0.00),
        ("forms","Siksha & Exams (Forms)",        "RTE Form (Free Education)",       "RTE ke liye form",            0.00),
        ("forms","Siksha & Exams (Forms)",        "Gargi Puraskar Form",             "Gargi puraskar form",         0.00),
        ("forms","Siksha & Exams (Forms)",        "REET/CET/Police Form",            "REET, CET, Police form",      100.00),
        ("forms","Siksha & Exams (Forms)",        "Rojgar Panjiyan",                 "Rachayment panjiyan",         0.00),
        ("forms","Siksha & Exams (Forms)",        "Berojgari Bhatta",                "Berojgari bhatta ke liye",    0.00),

        ("schemes","Yojana & Pension",            "Vridhavastha Pension",            "Budhape ki pension",          0.00),
        ("schemes","Yojana & Pension",            "Vidhwa Pension",                  "Vidhwa pension",              0.00),
        ("schemes","Yojana & Pension",            "Viklang Pension",                 "Viklang pension",             0.00),
        ("schemes","Yojana & Pension",            "Palanhar Yojana",                 "Palanhar yojana form",        0.00),
        ("schemes","Yojana & Pension",            "Shramik/Labour Card",             "Shramik card banao",          0.00),
        ("schemes","Yojana & Pension",            "PM Awas Yojana",                  "PM Awas yojana",              0.00),
        ("schemes","Yojana & Pension",            "PM Kisaan Samman Nidhi",          "PM Kisaan samman nidhi",      0.00),
        ("schemes","Yojana & Pension",            "Ayushman/Chiranjeevi Card",       "Ayushman card banao",         0.00),

        ("land_auto","Krishi, Khata & Vahan",    "Khasra/Jamabandi Nakal",          "Khasra/jamabandi nakal",      20.00),
        ("land_auto","Krishi, Khata & Vahan",    "Tarbandi Subsidy",                "Tarbandi subsidy",            0.00),
        ("land_auto","Krishi, Khata & Vahan",    "Fasal Bima (Crop Insurance)",     "Fasal bima",                  0.00),
        ("land_auto","Krishi, Khata & Vahan",    "Krishi Yantra Subsidy",           "Krishi yantra subsidy",       0.00),
        ("land_auto","Krishi, Khata & Vahan",    "Driving License (DL)",            "DL banao ya renew karo",      200.00),
        ("land_auto","Krishi, Khata & Vahan",    "Vahan RC Print/Transfer",         "RC print ya transfer",        100.00),
        ("land_auto","Krishi, Khata & Vahan",    "Police Verification",             "Police verification",         50.00),
        ("land_auto","Krishi, Khata & Vahan",    "Hasiyat Pramaan (Solvency)",      "Hasiyat praman patra",        30.00),
    ]
    rows = []
    for i, row in enumerate(defaults):
        rows.append({
            "category_key": row[0],
            "category_label": row[1],
            "name": row[2],
            "description": row[3],
            "price": row[4],
            "enabled": 1,
            "show_in_web": 1,
            "sort_order": i
        })
    supabase.table("services").insert(rows).execute()


def _seed_default_exams():
    defaults = [
        ("JEE Main", "Joint Entrance Examination for undergraduate engineering admissions at NITs, IIITs and CFTIs.", "UG", "2026-11-01", "2026-12-15", "2027-01-24", "₹1000", "₹500", "12th Pass with PCM", "https://jeemain.nta.nic.in/"),
        ("NEET UG", "National Eligibility cum Entrance Test for undergraduate medical programs (MBBS/BDS) admissions.", "UG", "2026-02-09", "2026-03-16", "2026-05-03", "₹1700", "₹1000", "12th Pass with PCB", "https://neet.nta.nic.in/"),
        ("SSC CGL", "Staff Selection Commission - Combined Graduate Level Exam for various Group B & C government posts.", "Govt Job", "2026-06-15", "2026-07-20", "2026-09-10", "₹100", "Free", "Bachelor's Degree", "https://ssc.nic.in/"),
        ("UPSC CSE", "Union Public Service Commission Civil Services Exam for IAS, IPS, IFS and other elite civil services.", "Govt Job", "2026-02-01", "2026-03-05", "2026-05-26", "₹100", "Free", "Bachelor's Degree", "https://upsc.gov.in/"),
        ("CUET UG", "Common University Entrance Test for admission to undergraduate programs in central universities.", "UG", "2026-02-27", "2026-04-05", "2026-05-15", "₹750", "₹350", "12th Pass", "https://cuet.samarth.ac.in/")
    ]
    rows = []
    for row in defaults:
        rows.append({
            "name": row[0],
            "description": row[1],
            "category": row[2],
            "start_date": row[3],
            "end_date": row[4],
            "exam_date": row[5],
            "fees_gen_obc": row[6],
            "fees_sc_st": row[7],
            "eligibility": row[8],
            "official_url": row[9],
            "enabled": 1
        })
    supabase.table("exams").insert(rows).execute()


def _seed_default_settings():
    defaults = [
        {"key": "welcome_message",      "value": "🙏 Namaste! Krishna Emitra Seva mein aapka swagat hai.\n\nPehle apna mobile number share karein taaki hum aapko updates bhi bhej sakein:\n(Neeche button dabayein)"},
        {"key": "exam_confirm_message", "value": "✅ Aapke subscribed exams save ho gaye hain!"},
        {"key": "unsubscribe_message",  "value": "😢 Aapko Krishna Emitra notifications se unsubscribe kar diya gaya hai.\n\nWapas subscribe karne ke liye /start karein."},
        {"key": "bot_name",             "value": "Krishna Emitra Seva"},
        {"key": "language",             "value": "hinglish"},
        {"key": "max_msg_per_day",      "value": "3"}
    ]
    supabase.table("bot_settings").insert(defaults).execute()


# ── User Helpers ─────────────────────────────────────────────────────────────

def get_user_by_telegram_id(telegram_id):
    res = supabase.table("users").select("*").eq("telegram_id", str(telegram_id)).execute()
    return res.data[0] if res.data else None


def get_user_by_phone(phone):
    clean_phone = phone.strip().lstrip('+').lstrip('91')[-10:]
    pattern = f"%{clean_phone}"
    res = supabase.table("users").select("*").ilike("phone", pattern).execute()
    return res.data[0] if res.data else None


def get_user_by_id(user_id):
    res = supabase.table("users").select("*").eq("id", user_id).execute()
    return res.data[0] if res.data else None


def get_student_basic(telegram_id):
    """Fast lookup for user profile without fetching exam subscriptions."""
    user = get_user_by_telegram_id(telegram_id)
    if user:
        user["phone_number"] = user["phone"]
    return user


def get_student(telegram_id):
    """Alias for backwards compatibility with bot/main.py"""
    user = get_user_by_telegram_id(telegram_id)
    if user:
        # Map for backwards compatibility
        user["phone_number"] = user["phone"]
        subs = get_user_exam_subscriptions(user["id"])
        user["exam_preference"] = subs[0] if subs else "NONE"
    return user


def is_new_user(telegram_id):
    return get_user_by_telegram_id(telegram_id) is None


def register_user(telegram_id, name, username):
    """Bot registration: upsert a student profile record."""
    try:
        user = get_user_by_telegram_id(telegram_id)
        if not user:
            supabase.table("users").insert({
                "telegram_id": str(telegram_id),
                "name": name,
                "username": username,
                "phone": f"BOT_TEMP_{telegram_id}",
                "is_telegram_linked": True
            }).execute()
    except Exception as e:
        print(f"Error registering Telegram user: {e}")


def register_student_web(name, phone_number, exam_pref):
    """Public Website registration: creates/registers a user."""
    try:
        # Check if already exists
        existing = get_user_by_phone(phone_number)
        if existing:
            # Update name if guest
            if existing.get("name") == "Web Guest":
                supabase.table("users").update({"name": name}).eq("id", existing["id"]).execute()
            user_id = existing["id"]
        else:
            res = supabase.table("users").insert({
                "name": name,
                "phone": phone_number,
                "role": "student"
            }).execute()
            user_id = res.data[0]["id"]

        if exam_pref and exam_pref != "NONE":
            update_user_exam_subscriptions(user_id, [exam_pref])

        return True, user_id
    except Exception as e:
        return False, f"Error: {str(e)}"


def add_student_admin(name, phone_number, exam_pref="NONE"):
    """Admin-initiated manual student addition."""
    try:
        existing = get_user_by_phone(phone_number)
        if existing:
            return False, "A user with this phone number already exists."
        
        res = supabase.table("users").insert({
            "name": name.strip(),
            "phone": phone_number.strip(),
            "role": "student"
        }).execute()
        user_id = res.data[0]["id"]

        if exam_pref and exam_pref != "NONE":
            update_user_exam_subscriptions(user_id, [exam_pref])
            
        return True, user_id
    except Exception as e:
        return False, str(e)


def update_student_profile(user_id, name, phone, gender=None):
    """Update student name, phone number, and gender."""
    try:
        update_data = {"name": name.strip()}
        if phone:
            update_data["phone"] = phone.strip()
        if gender:
            update_data["gender"] = gender.strip()
            
        supabase.table("users").update(update_data).eq("id", user_id).execute()
        return True, "Profile updated"
    except Exception as e:
        return False, str(e)


def update_phone_number(telegram_id, phone_number):
    """Verify & link phone from bot contact button."""
    clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
    if clean_phone.startswith("+"):
        clean_phone = clean_phone[1:]
    if len(clean_phone) > 10 and (clean_phone.startswith("91") or clean_phone.startswith("091")):
        clean_phone = clean_phone[-10:]
    
    # Find user linked to telegram
    tg_user = get_user_by_telegram_id(telegram_id)
    # Find user linked to phone
    phone_user = get_user_by_phone(clean_phone)

    if tg_user and phone_user and tg_user["id"] != phone_user["id"]:
        # Merge: Phone user wins, delete temporary Telegram user
        try:
            # Transfer login tokens to the phone user to prevent cascade deletion
            supabase.table("login_tokens").update({
                "user_id": phone_user["id"]
            }).eq("user_id", tg_user["id"]).execute()

            # Delete temp user
            supabase.table("users").delete().eq("id", tg_user["id"]).execute()
            # Link phone user to telegram
            supabase.table("users").update({
                "telegram_id": str(telegram_id),
                "is_telegram_linked": True
            }).eq("id", phone_user["id"]).execute()
            
            # Backport service requests
            supabase.table("service_requests").update({"user_id": phone_user["id"]}).eq("user_id", tg_user["id"]).execute()
        except Exception as e:
            print(f"Error merging users: {e}")
    elif tg_user:
        # Safe update
        try:
            supabase.table("users").update({
                "phone": clean_phone
            }).eq("id", tg_user["id"]).execute()
        except Exception as e:
            print(f"Error updating phone: {e}")


# ── Exam Subscriptions Helpers ────────────────────────────────────────────────

def get_user_exam_subscriptions(user_id):
    res = supabase.table("user_exam_subscriptions")\
        .select("exams(name)")\
        .eq("user_id", user_id)\
        .execute()
    return [row["exams"]["name"] for row in res.data if row.get("exams")]


def update_user_exam_subscriptions(user_id, exam_names):
    """Sync user's many-to-many exam subscriptions."""
    try:
        # Delete old subscriptions
        supabase.table("user_exam_subscriptions").delete().eq("user_id", user_id).execute()
        
        if not exam_names or "NONE" in exam_names:
            return
            
        # Get matching exam ids
        exams_res = supabase.table("exams").select("id,name").in_("name", exam_names).execute()
        exam_ids = [e["id"] for e in exams_res.data]
        
        if exam_ids:
            rows = [{"user_id": user_id, "exam_id": eid} for eid in exam_ids]
            supabase.table("user_exam_subscriptions").insert(rows).execute()
    except Exception as e:
        print(f"Error syncing subscriptions: {e}")


def update_exam_preference(telegram_id, exam):
    """Backwards compatibility for Bot: links single preference."""
    user = get_user_by_telegram_id(telegram_id)
    if user:
        update_user_exam_subscriptions(user["id"], [exam])


def update_student_category(student_id, category):
    """Backwards compatibility for Admin: updates preference."""
    update_user_exam_subscriptions(student_id, [category])


def get_students_by_exam(exam):
    """Returns users subscribed to a given exam (or all students if 'ALL')."""
    if exam == "ALL":
        res = supabase.table("users").select("*").neq("role", "admin").execute()
        return res.data
    
    # Retrieve exam id
    exam_res = supabase.table("exams").select("id").eq("name", exam).execute()
    if not exam_res.data:
        return []
    eid = exam_res.data[0]["id"]
    
    # Find matching users
    res = supabase.table("user_exam_subscriptions")\
        .select("users(*)")\
        .eq("exam_id", eid)\
        .execute()
    return [row["users"] for row in res.data if row.get("users")]


def get_students_paginated(exam="ALL", page=1, limit=20, search=""):
    start = (page - 1) * limit
    end = start + limit - 1
    
    # Build join selection
    query = supabase.table("users").select("*, user_exam_subscriptions(exams(name))", count="exact").neq("role", "admin")
    
    if search:
        pattern = f"%{search}%"
        query = query.or_(f"name.ilike.{pattern},phone.ilike.{pattern},telegram_id.ilike.{pattern},username.ilike.{pattern}")
        
    res = query.order("created_at", desc=True).range(start, end).execute()
    total = res.count if res.count is not None else len(res.data)
    
    records = []
    for row in (res.data or []):
        subs = [sub["exams"]["name"] for sub in row.get("user_exam_subscriptions", []) if sub.get("exams")]
        records.append({
            "id": row["id"],
            "telegram_id": row["telegram_id"],
            "name": row["name"],
            "phone_number": row["phone"],
            "username": row["username"],
            "exam_preference": ", ".join(subs) if subs else "NONE",
            "created_at": row["created_at"]
        })
        
    # Optional exam filter in memory if specified
    if exam != "ALL":
        records = [r for r in records if exam in r["exam_preference"]]
        total = len(records)
        
    return records, total


def get_all_students():
    res = supabase.table("users").select("*").neq("role", "admin").order("created_at", desc=True).execute()
    records = []
    for row in res.data:
        subs = get_user_exam_subscriptions(row["id"])
        row["phone_number"] = row["phone"]
        row["exam_preference"] = ", ".join(subs) if subs else "NONE"
        records.append(row)
    return records


def block_student(telegram_id):
    user = get_user_by_telegram_id(telegram_id)
    if user:
        update_user_exam_subscriptions(user["id"], ["BLOCKED"])


def delete_student(student_id):
    supabase.table("users").delete().eq("id", student_id).execute()


def get_stats():
    total_res = supabase.table("users").select("id", count="exact").neq("role", "admin").execute()
    total = total_res.count if total_res.count is not None else 0
    
    by_exam = {}
    try:
        exams_res = supabase.table("exams").select("name").execute()
        for e in exams_res.data:
            by_exam[e["name"]] = 0
    except Exception:
        pass
        
    by_exam["ALL"] = 0
    by_exam["NONE"] = 0
    by_exam["BLOCKED"] = 0
    
    res = supabase.table("user_exam_subscriptions").select("exams(name)").execute()
    for row in (res.data or []):
        if row.get("exams"):
            name = row["exams"]["name"]
            by_exam[name] = by_exam.get(name, 0) + 1

    return {"total_students": total, "by_exam": by_exam}


def get_public_stats():
    stats = get_stats()
    real_total = stats["total_students"]
    display_total = max(real_total, 4000) if real_total < 4000 else real_total
    return {"total_students": display_total, "is_growing": real_total < 4000}


# ── Message log & Broadcast helpers ──────────────────────────────────────────

def log_message(target_exam, message_text, count):
    # Retrieve exam ID
    eid = None
    if target_exam != "ALL":
        ex_res = supabase.table("exams").select("id").eq("name", target_exam).execute()
        if ex_res.data:
            eid = ex_res.data[0]["id"]
            
    supabase.table("message_logs").insert({
        "exam_id": eid,
        "message_text": message_text,
        "total_recipients": count
    }).execute()


def get_logs():
    res = supabase.table("message_logs").select("*, exams(name)").order("sent_at", desc=True).execute()
    records = []
    for row in res.data:
        records.append({
            "id": row["id"],
            "target_exam": row["exams"]["name"] if row.get("exams") else "ALL",
            "message_text": row["message_text"],
            "total_recipients": row["total_recipients"],
            "sent_at": row["sent_at"]
        })
    return records


def get_public_news(limit=6):
    res = supabase.table("message_logs").select("*, exams(name)").order("sent_at", desc=True).limit(limit).execute()
    news = []
    for row in res.data:
        text = row.get("message_text") or ""
        for sym in ["*", "_", "`", "~"]:
            text = text.replace(sym, "")
        news.append({
            "id": row["id"],
            "message": text,
            "preview": text[:120] + ("..." if len(text) > 120 else ""),
            "exam": row["exams"]["name"] if row.get("exams") else "ALL",
            "recipients": row["total_recipients"],
            "sent_at": row["sent_at"],
        })
    return news


def create_broadcast_job(job_id, target_exam, total_count):
    eid = None
    if target_exam != "ALL":
        ex_res = supabase.table("exams").select("id").eq("name", target_exam).execute()
        if ex_res.data:
            eid = ex_res.data[0]["id"]
            
    supabase.table("broadcast_jobs").insert({
        "id": str(job_id),
        "target_exam_id": eid,
        "total_count": total_count,
        "status": "queued"
    }).execute()


def update_broadcast_status(job_id, status, sent_count=None, error_msg=None):
    now_str = datetime.utcnow().isoformat()
    updates = {"status": status, "updated_at": now_str}
    if sent_count is not None:
        updates["sent_count"] = sent_count
    if error_msg is not None:
        updates["error_msg"] = error_msg
    if status == "running" and not _cache_get(f"broadcast_start:{job_id}"):
        updates["started_at"] = now_str
        _cache_set(f"broadcast_start:{job_id}", True)
    elif status in ["done", "error"]:
        updates["finished_at"] = now_str
        
    supabase.table("broadcast_jobs").update(updates).eq("id", str(job_id)).execute()


def get_broadcast_status(job_id):
    res = supabase.table("broadcast_jobs").select("*, exams(name)").eq("id", str(job_id)).execute()
    if not res.data:
        return None
    row = res.data[0]
    return {
        "id": row["id"],
        "status": row["status"],
        "sent": row["sent_count"],
        "total": row["total_count"],
        "exam": row["exams"]["name"] if row.get("exams") else "ALL",
        "error": row["error_msg"],
        "updated_at": row["updated_at"]
    }


def add_notification_history(user_id, broadcast_id, status, error=None):
    try:
        supabase.table("notification_history").insert({
            "user_id": user_id,
            "broadcast_id": broadcast_id,
            "status": status,
            "error": error
        }).execute()
    except Exception as e:
        print(f"Error logging notification history: {e}")


# ── Service Request Helpers ──────────────────────────────────────────────────

def get_service_by_name(name):
    res = supabase.table("services").select("id").eq("name", name).execute()
    return res.data[0]["id"] if res.data else None


def add_service_request_direct(user_id, service_id, category_label="other"):
    """Inserts a service request directly using known user_id and service_id to save DB lookups."""
    res = supabase.table("service_requests").insert({
        "user_id": user_id,
        "service_id": service_id,
        "status": "pending"
    }).execute()
    return res.data[0]["id"] if res.data else None


def add_service_request(telegram_id, service_name, category):
    user = get_user_by_telegram_id(telegram_id)
    if not user:
        return None
    sid = get_service_by_name(service_name)
    res = supabase.table("service_requests").insert({
        "user_id": user["id"],
        "service_id": sid,
        "status": "pending"
    }).execute()
    return res.data[0]["id"]


def log_service_intent(phone_number, service_name, category):
    # Lookup or create Web Guest
    user = get_user_by_phone(phone_number)
    if not user:
        res_usr = supabase.table("users").insert({
            "name": "Web Guest",
            "phone": phone_number
        }).execute()
        uid = res_usr.data[0]["id"]
    else:
        uid = user["id"]
        
    sid = get_service_by_name(service_name)
    res = supabase.table("service_requests").insert({
        "user_id": uid,
        "service_id": sid,
        "status": "pending"
    }).execute()
    return res.data[0]["id"]


def get_service_requests(status=None):
    query = supabase.table("service_requests").select("*, users(*), services(*)")
    if status:
        res = query.eq("status", status).order("requested_at", desc=True).execute()
    else:
        res = query.order("requested_at", desc=True).execute()
        
    records = []
    for row in (res.data or []):
        usr = row.get("users") or {}
        svc = row.get("services") or {}
        records.append({
            "id": row["id"],
            "telegram_id": usr.get("telegram_id"),
            "service_name": svc.get("name", "Unknown"),
            "category": svc.get("category_label", "Other"),
            "status": row["status"],
            "requested_at": row["requested_at"],
            "completed_at": row["completed_at"],
            "student_name": usr.get("name", "Unknown"),
            "student_phone": usr.get("phone", ""),
            "student_username": usr.get("username", "")
        })
    return records


def get_pending_count():
    res = supabase.table("service_requests").select("id", count="exact").eq("status", "pending").execute()
    return res.count if res.count is not None else 0


def complete_service_request(request_id):
    now_str = datetime.utcnow().isoformat()
    supabase.table("service_requests").update({
        "status": "completed",
        "completed_at": now_str
    }).eq("id", request_id).execute()


def get_service_requests_paginated(status=None, page=1, limit=20):
    start = (page - 1) * limit
    end = start + limit - 1
    
    query = supabase.table("service_requests").select("*, users(*), services(*)", count="exact")
    if status and status != "all":
        query = query.eq("status", status)
        
    res = query.order("requested_at", desc=True).range(start, end).execute()
    total = res.count if res.count is not None else len(res.data)
    
    records = []
    for row in (res.data or []):
        usr = row.get("users") or {}
        svc = row.get("services") or {}
        records.append({
            "id": row["id"],
            "telegram_id": usr.get("telegram_id"),
            "service_name": svc.get("name", "Unknown"),
            "category": svc.get("category_key", "Other"),
            "status": row["status"],
            "requested_at": row["requested_at"],
            "completed_at": row["completed_at"],
            "student_name": usr.get("name", "Unknown"),
            "student_phone": usr.get("phone", ""),
            "student_username": usr.get("username", "")
        })
    return records, total


def get_student_history(identifier):
    """Returns requests and applications history combined for a user."""
    user = None
    if "@" in identifier:
        # Suppress email checks or query user by email from Clerk
        return []
    else:
        user = get_user_by_phone(identifier)
        if not user:
            # Check by Telegram ID
            try:
                user = get_user_by_telegram_id(int(identifier))
            except ValueError:
                user = get_user_by_telegram_id(identifier)
                
    if not user:
        return []

    res = supabase.table("service_requests")\
        .select("id, status, requested_at, completed_at, services(name, category_label)")\
        .eq("user_id", user["id"])\
        .order("requested_at", desc=True)\
        .limit(20)\
        .execute()
        
    history = []
    for row in res.data:
        svc = row.get("services") or {}
        history.append({
            "id": row["id"],
            "service_name": svc.get("name", "Unknown"),
            "category": svc.get("category_label", "Other"),
            "status": row["status"],
            "requested_at": row["requested_at"],
            "completed_at": row["completed_at"]
        })
    return history


# ── Document Handling ────────────────────────────────────────────────────────

def save_document(telegram_id, file_id, file_type, file_name=""):
    user = get_user_by_telegram_id(telegram_id)
    if user:
        supabase.table("user_documents").insert({
            "user_id": user["id"],
            "file_id": str(file_id),
            "file_type": str(file_type),
            "file_name": str(file_name)
        }).execute()


def get_user_documents(telegram_id):
    user = get_user_by_telegram_id(telegram_id)
    if not user:
        return []
    res = supabase.table("user_documents").select("*")\
        .eq("user_id", user["id"])\
        .order("uploaded_at", desc=True)\
        .execute()
    return res.data


def get_document_url(file_id):
    # Lookup file details if needed - backwards compatibility shim
    return {"file_id": file_id}


# ── Bot Settings CRUD ────────────────────────────────────────────────────────

def get_bot_setting(key, default=None):
    cache_key = f"bot_setting:{key}"
    cached = _cache_get(cache_key)
    if cached is not None:
        return cached
    res = supabase.table("bot_settings").select("value").eq("key", key).execute()
    val = res.data[0]["value"] if res.data else default
    if val is not None:
        _cache_set(cache_key, val)
    return val


def get_all_bot_settings():
    res = supabase.table("bot_settings").select("key,value").execute()
    return {row["key"]: row["value"] for row in res.data}


def set_bot_setting(key, value):
    supabase.table("bot_settings").upsert({"key": str(key), "value": str(value)}).execute()
    _cache_invalidate(f"bot_setting:{key}")


def set_bot_settings_bulk(settings_dict):
    rows = [{"key": str(k), "value": str(v)} for k, v in settings_dict.items()]
    if rows:
        supabase.table("bot_settings").upsert(rows).execute()
        for k in settings_dict:
            _cache_invalidate(f"bot_setting:{k}")


# ── Services CRUD ─────────────────────────────────────────────────────────────

def get_all_services():
    res = supabase.table("services").select("*")\
        .order("sort_order", desc=False)\
        .order("id", desc=False)\
        .execute()
    return res.data


def get_services_as_dict():
    cached = _cache_get("services_dict")
    if cached is not None:
        return cached

    res = supabase.table("services").select("*")\
        .eq("enabled", 1)\
        .order("sort_order", desc=False)\
        .order("id", desc=False)\
        .execute()
    
    result = {}
    for row in res.data:
        key = row["category_key"]
        if key not in result:
            result[key] = {
                "label": row["category_label"],
                "services": [],
            }
        result[key]["services"].append({
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "price": f"₹{row['price']:.2f}"
        })
    _cache_set("services_dict", result)
    return result


def get_public_services_as_dict():
    cached = _cache_get("public_services_dict")
    if cached is not None:
        return cached

    res = supabase.table("services").select("*")\
        .eq("show_in_web", 1)\
        .order("sort_order", desc=False)\
        .order("id", desc=False)\
        .execute()
    
    result = {}
    for row in res.data:
        key = row["category_key"]
        if key not in result:
            result[key] = {
                "label": row["category_label"],
                "services": [],
            }
        result[key]["services"].append({
            "name": row["name"],
            "description": row["description"],
            "price": f"₹{row['price']:.2f}"
        })
    _cache_set("public_services_dict", result)
    return result


def _clean_price(price_val):
    if price_val is None or str(price_val).strip() == "":
        return 0.00
    if isinstance(price_val, (int, float)):
        return float(price_val)
    s = str(price_val).strip().lower()
    if "free" in s:
        return 0.00
    cleaned = ""
    for char in s:
        if char.isdigit() or char == '.':
            cleaned += char
    try:
        return float(cleaned) if cleaned else 0.00
    except ValueError:
        return 0.00


def add_service(category_key, category_label, name, description="", price=0.0, enabled=True, show_in_web=True):
    res_max = supabase.table("services").select("sort_order").eq("category_key", category_key).order("sort_order", desc=True).limit(1).execute()
    max_order = res_max.data[0]["sort_order"] if res_max.data else 0
    next_order = max_order + 1
    
    res = supabase.table("services").insert({
        "category_key": category_key,
        "category_label": category_label,
        "name": name,
        "description": description,
        "price": _clean_price(price),
        "enabled": 1 if enabled else 0,
        "show_in_web": 1 if show_in_web else 0,
        "sort_order": next_order
    }).execute()
    _cache_invalidate("services_dict", "public_services_dict")
    return res.data[0]["id"]


def update_service(service_id, **fields):
    allowed = {"name", "description", "price", "category_key", "category_label", "enabled", "show_in_web"}
    updates = {k: v for k, v in fields.items() if k in allowed}
    if "enabled" in updates:
        updates["enabled"] = 1 if updates["enabled"] else 0
    if "show_in_web" in updates:
        updates["show_in_web"] = 1 if updates["show_in_web"] else 0
    if "price" in updates:
        updates["price"] = _clean_price(updates["price"])
        
    if updates:
        supabase.table("services").update(updates).eq("id", service_id).execute()
        _cache_invalidate("services_dict", "public_services_dict")


def toggle_service(service_id):
    res = supabase.table("services").select("enabled").eq("id", service_id).execute()
    if res.data:
        curr = res.data[0]["enabled"]
        new_val = 0 if curr == 1 else 1
        supabase.table("services").update({"enabled": new_val}).eq("id", service_id).execute()
        _cache_invalidate("services_dict", "public_services_dict")


def delete_service(service_id):
    supabase.table("services").delete().eq("id", service_id).execute()
    _cache_invalidate("services_dict", "public_services_dict")


# ── Exams Management ─────────────────────────────────────────────────────────

def get_all_exams():
    cached = _cache_get("all_exams")
    if cached is not None:
        return cached
    # Fetch active exams with their category and active cycles
    res = supabase.table("exams").select("*, exam_categories(key, label), exam_cycles(*)").eq("is_active", True).execute()
    _cache_set("all_exams", res.data)
    return res.data


def add_exam(name):
    # Backward compat for simple exam adding
    try:
        res = supabase.table("exams").insert({"name": name.strip()}).execute()
        _cache_invalidate("all_exams")
        return True, res.data[0]["id"]
    except Exception as e:
        return False, f"Exam already exists or error: {str(e)}"


def delete_exam(exam_id):
    supabase.table("exams").delete().eq("id", exam_id).execute()
    _cache_invalidate("all_exams")


def get_all_exams_admin():
    res = supabase.table("exams").select("*, exam_categories(key, label), exam_cycles(*)").order("id", desc=True).execute()
    return res.data


def add_exam_details(name, description='', category_id=None, official_url='', enabled=True, cycle_year=None, start_date='', end_date='', exam_date='', fees_gen_obc='', fees_sc_st='', eligibility=''):
    try:
        # Insert exam
        exam_res = supabase.table("exams").insert({
            "name": name.strip(),
            "description": description,
            "category_id": category_id,
            "official_url": official_url,
            "is_active": True if enabled else False
        }).execute()
        exam_id = exam_res.data[0]["id"]
        
        # Insert cycle
        if cycle_year:
            supabase.table("exam_cycles").insert({
                "exam_id": exam_id,
                "cycle_year": int(cycle_year),
                "start_date": start_date or None,
                "end_date": end_date or None,
                "exam_date": exam_date or None,
                "fees_gen_obc": fees_gen_obc,
                "fees_sc_st": fees_sc_st,
                "eligibility": eligibility,
                "is_confirmed": False
            }).execute()
            
        _cache_invalidate("all_exams")
        return True, exam_id
    except Exception as e:
        return False, f"Error: {str(e)}"


def update_exam_details(exam_id, name, description, category_id, official_url, enabled, cycle_id=None, cycle_year=None, start_date='', end_date='', exam_date='', fees_gen_obc='', fees_sc_st='', eligibility=''):
    try:
        supabase.table("exams").update({
            "name": name.strip(),
            "description": description,
            "category_id": category_id,
            "official_url": official_url,
            "is_active": True if enabled else False
        }).eq("id", exam_id).execute()
        
        if cycle_year:
            cycle_data = {
                "cycle_year": int(cycle_year),
                "start_date": start_date or None,
                "end_date": end_date or None,
                "exam_date": exam_date or None,
                "fees_gen_obc": fees_gen_obc,
                "fees_sc_st": fees_sc_st,
                "eligibility": eligibility
            }
            if cycle_id:
                supabase.table("exam_cycles").update(cycle_data).eq("id", cycle_id).execute()
            else:
                cycle_data["exam_id"] = exam_id
                supabase.table("exam_cycles").insert(cycle_data).execute()

        _cache_invalidate("all_exams")
        return True
    except Exception as e:
        return False, f"Error: {str(e)}"


# ── Form Applications CRUD ────────────────────────────────────────────────

def get_exam_categories():
    res = supabase.table("exam_categories").select("*").execute()
    return res.data


def submit_form_application(student_name, phone_number, email, dob, gender, category, exam_cycle_id, academic_qualification, doc_submission_method='upload'):
    # Lookup or create user by phone
    user = get_user_by_phone(phone_number)
    if not user:
        res_usr = supabase.table("users").insert({
            "name": student_name,
            "phone": phone_number
        }).execute()
        uid = res_usr.data[0]["id"]
    else:
        uid = user["id"]
        # Update name if guest
        if user.get("name") == "Web Guest":
            supabase.table("users").update({"name": student_name}).eq("id", uid).execute()
            
    res = supabase.table("form_applications").insert({
        "user_id": uid,
        "exam_cycle_id": int(exam_cycle_id),
        "email": email,
        "dob": dob or None,
        "gender": gender,
        "category": category,
        "academic_qualification": academic_qualification,
        "status": "pending",
        "doc_submission_method": doc_submission_method
    }).execute()
    return res.data[0]["id"]


def add_application_document(application_id, file_type, file_path, file_name):
    supabase.table("application_documents").insert({
        "application_id": application_id,
        "file_type": file_type,
        "file_path": file_path,
        "file_name": file_name
    }).execute()


def get_all_applications(status=None):
    query = supabase.table("form_applications").select("*, users(*), exam_cycles(*, exams(*))")
    if status:
        res = query.eq("status", status).order("submitted_at", desc=True).execute()
    else:
        res = query.order("submitted_at", desc=True).execute()
        
    records = []
    for row in (res.data or []):
        usr = row.get("users") or {}
        cycle = row.get("exam_cycles") or {}
        ex = cycle.get("exams") or {}
        
        # Build display name: "SSC CGL (2024)"
        exam_display = ex.get("name", "Unknown Exam")
        if cycle.get("cycle_year"):
            exam_display += f" ({cycle['cycle_year']})"
            
        records.append({
            "id": row["id"],
            "student_name": usr.get("name", "Unknown"),
            "phone_number": usr.get("phone", ""),
            "email": row["email"],
            "dob": row["dob"],
            "gender": row["gender"],
            "category": row["category"],
            "exam_name": exam_display,
            "academic_qualification": row["academic_qualification"],
            "status": row["status"],
            "submitted_at": row["submitted_at"],
            "completed_at": row["completed_at"],
            "doc_submission_method": row["doc_submission_method"]
        })
    return records


def get_application_details(app_id):
    res = supabase.table("form_applications").select("*, users(*), exam_cycles(*, exams(*))").eq("id", app_id).execute()
    if not res.data:
        return None
    row = res.data[0]
    usr = row.get("users") or {}
    cycle = row.get("exam_cycles") or {}
    ex = cycle.get("exams") or {}
    
    exam_display = ex.get("name", "Unknown Exam")
    if cycle.get("cycle_year"):
        exam_display += f" ({cycle['cycle_year']})"
        
    app_dict = {
        "id": row["id"],
        "student_name": usr.get("name", "Unknown"),
        "phone_number": usr.get("phone", ""),
        "email": row["email"],
        "dob": row["dob"],
        "gender": row["gender"],
        "category": row["category"],
        "exam_name": exam_display,
        "academic_qualification": row["academic_qualification"],
        "status": row["status"],
        "remarks": row["remarks"],
        "submitted_at": row["submitted_at"],
        "completed_at": row["completed_at"],
        "doc_submission_method": row["doc_submission_method"]
    }
    
    docs_res = supabase.table("application_documents").select("*").eq("application_id", app_id).execute()
    app_dict["documents"] = docs_res.data
    return app_dict


def update_application_status(app_id, status, remarks=None):
    updates = {"status": status, "remarks": remarks}
    if status == 'completed':
        updates["completed_at"] = datetime.utcnow().isoformat()
    supabase.table("form_applications").update(updates).eq("id", app_id).execute()


def get_student_applications_by_phone(identifier):
    user = None
    if "@" in identifier:
        res = supabase.table("form_applications").select("*, users(*), exams(*)").ilike("email", f"%{identifier}%").order("submitted_at", desc=True).execute()
    else:
        user = get_user_by_phone(identifier)
        if not user:
            return []
        res = supabase.table("form_applications").select("*, users(*), exams(*)").eq("user_id", user["id"]).order("submitted_at", desc=True).execute()
    
    apps = []
    for row in (res.data or []):
        usr = row.get("users") or {}
        ex = row.get("exams") or {}
        
        app_id = row["id"]
        docs_res = supabase.table("application_documents").select("*").eq("application_id", app_id).execute()
        
        apps.append({
            "id": row["id"],
            "student_name": usr.get("name", "Unknown"),
            "phone_number": usr.get("phone", ""),
            "email": row["email"],
            "dob": row["dob"],
            "gender": row["gender"],
            "category": row["category"],
            "exam_name": ex.get("name", "Unknown"),
            "academic_qualification": row["academic_qualification"],
            "status": row["status"],
            "remarks": row["remarks"],
            "submitted_at": row["submitted_at"],
            "completed_at": row["completed_at"],
            "doc_submission_method": row["doc_submission_method"],
            "documents": docs_res.data
        })
    return apps


# ── Scheduled Announcements Helper Functions ─────────────────────────────────

def get_all_announcements_raw():
    res = supabase.table("announcements").select("*").order("created_at", desc=True).execute()
    return res.data or []


def get_all_active_announcements():
    res = supabase.table("announcements").select("*").eq("is_active", 1).execute()
    return res.data or []


def add_scheduled_announcement(exam, message, run_at):
    res = supabase.table("announcements").insert({
        "title": exam,
        "content": message,
        "links": run_at,
        "is_active": 1
    }).execute()
    return res.data[0]["id"]


def update_scheduled_announcement(ann_id, exam, message, run_at, is_active):
    supabase.table("announcements").update({
        "title": exam,
        "content": message,
        "links": run_at,
        "is_active": is_active
    }).eq("id", ann_id).execute()


def mark_announcement_sent(ann_id):
    supabase.table("announcements").update({"is_active": 0}).eq("id", ann_id).execute()


def delete_scheduled_announcement(ann_id):
    supabase.table("announcements").delete().eq("id", ann_id).execute()


# ── Login Tokens Helpers ──────────────────────────────────────────────────────

def create_login_token(token, expires_at, user_id=None):
    try:
        now_str = datetime.utcnow().isoformat()
        try:
            supabase.table("login_tokens").delete().lt("expires_at", now_str).execute()
        except Exception:
            pass

        insert_data = {
            "token": token,
            "expires_at": expires_at.isoformat()
        }
        if user_id:
            insert_data["user_id"] = user_id

        supabase.table("login_tokens").insert(insert_data).execute()
        return True
    except Exception as e:
        print(f"WARNING: Error inserting login token: {e}")
        return False


def link_login_token(token, telegram_id):
    try:
        res = supabase.table("login_tokens").select("*").eq("token", token).execute()
        if not res.data:
            return False
        row = res.data[0]
        # Check expiry
        exp = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
        if exp.replace(tzinfo=None) < datetime.utcnow():
            return False
            
        tg_user = get_user_by_telegram_id(telegram_id)
        if not tg_user:
            return False

        existing_user_id = row.get("user_id")
        if existing_user_id and existing_user_id != tg_user["id"]:
            # Merge: link telegram_id to the Clerk user record and delete temporary Telegram user
            try:
                # Transfer subscriptions and requests
                supabase.table("user_exam_subscriptions").update({"user_id": existing_user_id}).eq("user_id", tg_user["id"]).execute()
                supabase.table("service_requests").update({"user_id": existing_user_id}).eq("user_id", tg_user["id"]).execute()
                
                # Delete temporary Telegram user first to free up the unique telegram_id constraint
                supabase.table("users").delete().eq("id", tg_user["id"]).execute()

                # Update the Clerk user record with Telegram details
                supabase.table("users").update({
                    "telegram_id": str(telegram_id),
                    "is_telegram_linked": True
                }).eq("id", existing_user_id).execute()
            except Exception as merge_err:
                print(f"Error merging user via login token: {merge_err}")
        else:
            # Normal link
            supabase.table("login_tokens").update({
                "user_id": tg_user["id"]
            }).eq("token", token).execute()
            
        return True
    except Exception as e:
        print(f"Error linking login token: {e}")
        return False


def get_login_token_status(token):
    try:
        res = supabase.table("login_tokens").select("*").eq("token", token).execute()
        if not res.data:
            return {"status": "not_found"}
        row = res.data[0]
        # Check expiry
        exp = datetime.fromisoformat(row["expires_at"].replace("Z", "+00:00"))
        if exp.replace(tzinfo=None) < datetime.utcnow():
            return {"status": "expired"}
            
        uid = row.get("user_id")
        if not uid:
            return {"status": "pending"}
            
        # Check if student is fully registered
        student = get_user_by_id(uid)
        if not student or not student.get("phone") or student.get("phone").startswith("BOT_TEMP_"):
            return {"status": "awaiting_onboarding", "telegram_id": student.get("telegram_id") if student else ""}
            
        # Add backwards-compatibility mapped field for main.py JWT generation
        student["phone_number"] = student["phone"]
        subs = get_user_exam_subscriptions(uid)
        student["exam_preference"] = subs[0] if subs else "NONE"

        return {
            "status": "success",
            "telegram_id": student["telegram_id"],
            "student": student
        }
    except Exception as e:
        print(f"Error checking login status: {e}")
        return {"status": "error", "error": str(e)}


def get_user_by_clerk_id(clerk_id):
    try:
        res = supabase.table("users").select("*").eq("clerk_user_id", str(clerk_id)).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Error fetching user by Clerk ID: {e}")
        return None


def sync_clerk_user(clerk_id, email, phone, name):
    try:
        clean_phone = None
        if phone:
            clean_phone = phone.strip().replace(" ", "").replace("-", "")
            if clean_phone.startswith("+"):
                clean_phone = clean_phone[1:]
            if len(clean_phone) > 10 and (clean_phone.startswith("91") or clean_phone.startswith("091")):
                clean_phone = clean_phone[-10:]

        # 1. Check if user already exists by clerk_user_id
        user = get_user_by_clerk_id(clerk_id)
        if user:
            updates = {}
            if name and user.get("name") != name:
                updates["name"] = name
            
            if clean_phone:
                current_phone = user.get("phone")
                if not current_phone or current_phone.startswith("CLERK_TEMP_") or current_phone.startswith("BOT_TEMP_"):
                    # Check if another user already has this phone number
                    phone_user = get_user_by_phone(clean_phone)
                    if phone_user and phone_user["id"] != user["id"]:
                        # Merge: transfer Clerk user ID to existing user and delete temporary Clerk record
                        try:
                            # Transfer subscriptions, requests, and tokens
                            supabase.table("user_exam_subscriptions").update({"user_id": phone_user["id"]}).eq("user_id", user["id"]).execute()
                            supabase.table("service_requests").update({"user_id": phone_user["id"]}).eq("user_id", user["id"]).execute()
                            supabase.table("login_tokens").update({"user_id": phone_user["id"]}).eq("user_id", user["id"]).execute()
                            
                            # Link existing user to Clerk
                            supabase.table("users").update({"clerk_user_id": clerk_id}).eq("id", phone_user["id"]).execute()
                            
                            # Delete the temporary Clerk record
                            supabase.table("users").delete().eq("id", user["id"]).execute()
                            
                            return get_user_by_clerk_id(clerk_id)
                        except Exception as merge_err:
                            print(f"Error merging Clerk user: {merge_err}")
                    else:
                        updates["phone"] = clean_phone
            
            if updates:
                supabase.table("users").update(updates).eq("id", user["id"]).execute()
                user = get_user_by_clerk_id(clerk_id)
            return user

        # 2. Check if user exists by phone
        if clean_phone:
            phone_user = get_user_by_phone(clean_phone)
            if phone_user:
                # Link Clerk user id to this existing phone user
                supabase.table("users").update({
                    "clerk_user_id": clerk_id
                }).eq("id", phone_user["id"]).execute()
                return get_user_by_clerk_id(clerk_id)

        # 3. Create a new user
        res = supabase.table("users").insert({
            "clerk_user_id": clerk_id,
            "name": name or "Student",
            "phone": clean_phone or f"CLERK_TEMP_{clerk_id[-10:]}",
            "role": "student"
        }).execute()
        return res.data[0] if res.data else None
    except Exception as e:
        print(f"Error syncing Clerk user: {e}")
        return None


# ── Audit Log Helpers ────────────────────────────────────────────────────────

def add_audit_log(admin_name, action):
    try:
        supabase.table("audit_logs").insert({
            "admin_name": admin_name,
            "action": action
        }).execute()
    except Exception as e:
        print(f"Error creating audit log: {e}")


def get_audit_logs():
    try:
        res = supabase.table("audit_logs").select("*").order("created_at", desc=True).limit(100).execute()
        return res.data or []
    except Exception as e:
        print(f"Error fetching audit logs: {e}")
        return []
