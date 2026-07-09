import time as _time
from datetime import datetime
from supabase import create_client, Client
import config

# ── In-memory TTL cache ──────────────────────────────────────────────────────
# Eliminates redundant Supabase round-trips on hot bot paths.
# Services/exams/settings rarely change but are fetched on EVERY interaction.

_cache = {}          # key -> (value, expiry_timestamp)
_CACHE_TTL = 300     # 5 minutes


def _cache_get(key):
    """Return cached value if present and not expired, else None."""
    entry = _cache.get(key)
    if entry and entry[1] > _time.monotonic():
        return entry[0]
    return None


def _cache_set(key, value):
    """Store a value in cache with TTL."""
    _cache[key] = (value, _time.monotonic() + _CACHE_TTL)


def _cache_invalidate(*keys):
    """Remove specific cache entries (call after admin writes)."""
    for key in keys:
        _cache.pop(key, None)

# Initialize Supabase client
supabase: Client = None
if config.SUPABASE_URL and config.SUPABASE_KEY:
    try:
        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_KEY)
    except Exception as e:
        print(f"ERROR: Failed to initialize Supabase client: {e}")
else:
    print("WARNING: SUPABASE_URL and SUPABASE_KEY are not configured.")

def init_db():
    """Verify connection and seed default services/exams/settings if tables are empty."""
    if not supabase:
        print("WARNING: Supabase is not initialized. Skipping DB initialization.")
        return
    try:
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
        ("cert", "Pramaan Patra (Certificates)", "Mool Niwas (Domicile)",          "Niwas praman patra",          "₹30"),
        ("cert", "Pramaan Patra (Certificates)", "Jati Pramaan (Caste SC/ST/OBC)", "Jati praman patra",           "₹30"),
        ("cert", "Pramaan Patra (Certificates)", "Aay Pramaan (Income)",            "Aay praman patra",            "₹30"),
        ("cert", "Pramaan Patra (Certificates)", "Janma/Mrityu (Birth/Death)",      "Janm/mrityu praman",          "₹20"),
        ("cert", "Pramaan Patra (Certificates)", "Vivah Panjiyan (Marriage)",        "Vivah panjiyan",              "₹50"),
        ("cert", "Pramaan Patra (Certificates)", "Charitra Pramaan (Character)",    "Charitra praman patra",       "₹30"),
        ("cert", "Pramaan Patra (Certificates)", "Minority Certificate",             "Alpasankhyak praman patra",   "₹30"),
        ("cert", "Pramaan Patra (Certificates)", "EWS Certificate",                 "EWS praman patra",            "₹30"),

        ("id",   "Pehchan (IDs & Updates)",      "Aadhar Card (New/Update)",        "Aadhar naam/address update",  "₹50"),
        ("id",   "Pehchan (IDs & Updates)",      "Jan Aadhar (New/Update)",         "Jan Aadhar card",             "₹0"),
        ("id",   "Pehchan (IDs & Updates)",      "PAN Card (New/Correction)",       "Naye PAN ke liye apply",      "₹110"),
        ("id",   "Pehchan (IDs & Updates)",      "Voter ID (New/Correction)",       "Voter ID banwao ya sudhar",   "₹0"),
        ("id",   "Pehchan (IDs & Updates)",      "PVC Aadhar Card Print",           "PVC Aadhar card print",       "₹50"),
        ("id",   "Pehchan (IDs & Updates)",      "SSO ID Creation",                 "Rajasthan SSO ID banao",      "₹0"),
        ("id",   "Pehchan (IDs & Updates)",      "Ration Card Correction",          "Ration card mein sudhar",     "₹0"),
        ("id",   "Pehchan (IDs & Updates)",      "Passport Apply",                  "Passport ke liye apply",      "₹1500"),

        ("bills","Bills, Recharge & Taxes",       "Bijli Bill (Electricity)",        "Bijli bill payment",          "Free"),
        ("bills","Bills, Recharge & Taxes",       "Pani Bill (Water)",               "Pani bill payment",           "Free"),
        ("bills","Bills, Recharge & Taxes",       "Mobile/DTH Recharge",             "Mobile ya DTH recharge",      "Free"),
        ("bills","Bills, Recharge & Taxes",       "Gas Cylinder Booking",            "LPG cylinder booking",        "Free"),
        ("bills","Bills, Recharge & Taxes",       "FASTag Recharge",                 "FASTag recharge",             "Free"),
        ("bills","Bills, Recharge & Taxes",       "ITR (Income Tax Return)",         "Income tax return file karo", "₹200"),
        ("bills","Bills, Recharge & Taxes",       "CM Helpline Sikayat",             "CM helpline complaint",       "Free"),
        ("bills","Bills, Recharge & Taxes",       "Traffic Challan Pay",             "Traffic challan payment",     "Free"),

        ("forms","Siksha & Exams (Forms)",        "Govt. Job Form (RPSC/RSMSSB)",   "Sarkari naukri form",         "₹100"),
        ("forms","Siksha & Exams (Forms)",        "College Admission Form",          "College admission form",      "₹50"),
        ("forms","Siksha & Exams (Forms)",        "Scholarship (Chatravriti)",       "Chatravriti ke liye apply",   "Free"),
        ("forms","Siksha & Exams (Forms)",        "RTE Form (Free Education)",       "RTE ke liye form",            "Free"),
        ("forms","Siksha & Exams (Forms)",        "Gargi Puraskar Form",             "Gargi puraskar form",         "Free"),
        ("forms","Siksha & Exams (Forms)",        "REET/CET/Police Form",            "REET, CET, Police form",      "₹100"),
        ("forms","Siksha & Exams (Forms)",        "Rojgar Panjiyan",                 "Rachayment panjiyan",         "Free"),
        ("forms","Siksha & Exams (Forms)",        "Berojgari Bhatta",                "Berojgari bhatta ke liye",    "Free"),

        ("schemes","Yojana & Pension",            "Vridhavastha Pension",            "Budhape ki pension",          "Free"),
        ("schemes","Yojana & Pension",            "Vidhwa Pension",                  "Vidhwa pension",              "Free"),
        ("schemes","Yojana & Pension",            "Viklang Pension",                 "Viklang pension",             "Free"),
        ("schemes","Yojana & Pension",            "Palanhar Yojana",                 "Palanhar yojana form",        "Free"),
        ("schemes","Yojana & Pension",            "Shramik/Labour Card",             "Shramik card banao",          "Free"),
        ("schemes","Yojana & Pension",            "PM Awas Yojana",                  "PM Awas yojana",              "Free"),
        ("schemes","Yojana & Pension",            "PM Kisaan Samman Nidhi",          "PM Kisaan samman nidhi",      "Free"),
        ("schemes","Yojana & Pension",            "Ayushman/Chiranjeevi Card",       "Ayushman card banao",         "Free"),

        ("land_auto","Krishi, Khata & Vahan",    "Khasra/Jamabandi Nakal",          "Khasra/jamabandi nakal",      "₹20"),
        ("land_auto","Krishi, Khata & Vahan",    "Tarbandi Subsidy",                "Tarbandi subsidy",            "Free"),
        ("land_auto","Krishi, Khata & Vahan",    "Fasal Bima (Crop Insurance)",     "Fasal bima",                  "Free"),
        ("land_auto","Krishi, Khata & Vahan",    "Krishi Yantra Subsidy",           "Krishi yantra subsidy",       "Free"),
        ("land_auto","Krishi, Khata & Vahan",    "Driving License (DL)",            "DL banao ya renew karo",      "₹200"),
        ("land_auto","Krishi, Khata & Vahan",    "Vahan RC Print/Transfer",         "RC print ya transfer",        "₹100"),
        ("land_auto","Krishi, Khata & Vahan",    "Police Verification",             "Police verification",         "₹50"),
        ("land_auto","Krishi, Khata & Vahan",    "Hasiyat Pramaan (Solvency)",      "Hasiyat praman patra",        "₹30"),
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
        {"key": "exam_confirm_message", "value": "✅ Aapka exam {exam} set ho gaya hai!\n\nAb aap exam se related updates seedhe yahan paayenge."},
        {"key": "unsubscribe_message",  "value": "😢 Aapko Krishna Emitra notifications se unsubscribe kar diya gaya hai.\n\nWapas subscribe karne ke liye /start karein."},
        {"key": "bot_name",             "value": "Krishna Emitra Seva"},
        {"key": "language",             "value": "hinglish"},
        {"key": "max_msg_per_day",      "value": "3"}
    ]
    supabase.table("bot_settings").insert(defaults).execute()


# ── Student helpers ──────────────────────────────────────────────────────────

def is_new_user(telegram_id):
    res = supabase.table("students").select("telegram_id").eq("telegram_id", str(telegram_id)).execute()
    return len(res.data) == 0


def register_user(telegram_id, name, username):
    """Bot registration: uses upsert to avoid a separate is_new_user check.
    If the user already exists, this is a no-op (does not overwrite existing data)."""
    try:
        supabase.table("students").upsert({
            "telegram_id": str(telegram_id),
            "name": name,
            "username": username,
            "phone_number": f"BOT_TEMP_{telegram_id}",
            "is_registered": 1
        }, on_conflict="telegram_id", ignore_duplicates=True).execute()
    except Exception:
        pass  # User already exists — safe to ignore


def register_student_web(name, phone_number, exam_pref):
    """Public Website registration: no telegram_id yet."""
    try:
        res = supabase.table("students").insert({
            "name": name,
            "phone_number": phone_number,
            "exam_preference": exam_pref,
            "is_registered": 1
        }).execute()
        return True, res.data[0]["id"]
    except Exception as e:
        return False, f"Phone number already registered or error: {str(e)}"


def add_student_admin(name, phone_number, exam_pref="NONE"):
    """Admin-initiated manual student addition. Bypasses Telegram requirement."""
    try:
        res = supabase.table("students").insert({
            "name": name.strip(),
            "phone_number": phone_number.strip(),
            "exam_preference": exam_pref or "NONE",
            "is_registered": 1
        }).execute()
        return True, res.data[0]["id"]
    except Exception as e:
        return False, f"A student with this phone number already exists or error: {str(e)}"


def update_phone_number(telegram_id, phone_number):
    now_str = datetime.utcnow().isoformat()
    # Clean phone number to exactly the last 10 digits to match website registration format
    clean_phone = phone_number.strip().replace(" ", "").replace("-", "")
    if clean_phone.startswith("+"):
        clean_phone = clean_phone[1:]
    if len(clean_phone) > 10 and (clean_phone.startswith("91") or clean_phone.startswith("091")):
        clean_phone = clean_phone[-10:]
    elif len(clean_phone) > 10:
        clean_phone = clean_phone[-10:]
        
    # 1. Check if there is an existing student record with this phone number (e.g., from web registration)
    try:
        res = supabase.table("students").select("*").eq("phone_number", clean_phone).execute()
        existing = res.data[0] if res.data else None
    except Exception as e:
        print(f"Error checking existing student by phone: {e}")
        existing = None

    if existing:
        # If an existing student record is found with the same phone number
        existing_tg_id = existing.get("telegram_id")
        if not existing_tg_id or existing_tg_id != str(telegram_id):
            try:
                # 1. Delete the temporary student record first to release the telegram_id unique constraint
                supabase.table("students").delete().eq("telegram_id", str(telegram_id)).neq("id", existing["id"]).execute()
                
                # 2. Merge the records: Associate the existing row with this telegram_id
                supabase.table("students").update({
                    "telegram_id": str(telegram_id),
                    "last_active": now_str,
                    "is_registered": 1
                }).eq("id", existing["id"]).execute()
                
                # 3. Backport telegram_id to past service requests
                supabase.table("service_requests").update({"telegram_id": str(telegram_id)}).eq("phone_number", clean_phone).execute()
            except Exception as e:
                print(f"Error merging student rows: {e}")
        return

    # 2. If no duplicate exists, update the current student row with the phone number
    try:
        supabase.table("students").update({
            "phone_number": clean_phone,
            "last_active": now_str
        }).eq("telegram_id", str(telegram_id)).execute()
        
        # Backport telegram_id to past service requests
        supabase.table("service_requests").update({"telegram_id": str(telegram_id)}).eq("phone_number", clean_phone).execute()
    except Exception as e:
        print(f"Error updating phone number/backporting requests: {e}")


def update_exam_preference(telegram_id, exam):
    now_str = datetime.utcnow().isoformat()
    supabase.table("students").update({
        "exam_preference": exam,
        "is_registered": 1,
        "last_active": now_str
    }).eq("telegram_id", str(telegram_id)).execute()


def update_student_category(student_id, category):
    """Update exam preference by primary key ID (useful for manually added students)."""
    now_str = datetime.utcnow().isoformat()
    supabase.table("students").update({
        "exam_preference": category,
        "last_active": now_str
    }).eq("id", student_id).execute()


def get_student(telegram_id):
    """Fetch a single student by telegram_id."""
    res = supabase.table("students").select("*").eq("telegram_id", str(telegram_id)).execute()
    return res.data[0] if res.data else None


def get_students_by_exam(exam):
    """
    Returns students to notify for a given exam target.
    - exam = "ALL"  → everyone who has selected ANY exam (excludes NONE and BLOCKED)
    - exam = "JEE"  → JEE students + students who opted into ALL
    """
    if exam == "ALL":
        res = supabase.table("students").select("*")\
            .neq("exam_preference", "NONE")\
            .neq("exam_preference", "BLOCKED")\
            .execute()
    else:
        res = supabase.table("students").select("*")\
            .or_(f"exam_preference.eq.{exam},exam_preference.eq.ALL")\
            .execute()
    return res.data


def get_announcements(limit=5):
    """Fetch latest active announcements for the website ticker."""
    res = supabase.table("announcements").select("*")\
        .eq("is_active", 1)\
        .order("created_at", desc=True)\
        .limit(limit)\
        .execute()
    return res.data


def get_student_history(phone_number):
    """
    Fetch request history for a student by phone number (public lookup).
    Works for both:
    - Web users: phone_number stored directly in service_requests via log_service_intent.
    - Bot users: telegram_id stored in service_requests; we join via students table.
    """
    clean_phone = phone_number.strip().lstrip('+').lstrip('91')[-10:]
    pattern = f"%{clean_phone}"
    
    # First, let's find the student's telegram_id if they exist
    students_res = supabase.table("students").select("telegram_id").ilike("phone_number", pattern).execute()
    telegram_ids = [s["telegram_id"] for s in students_res.data if s.get("telegram_id")]
    
    # Query service requests with ID, category, status, requested_at, completed_at
    query = supabase.table("service_requests").select("id,service_name,category,status,requested_at,completed_at")
    if telegram_ids:
        # Create an OR condition
        tg_filters = ",".join(f"telegram_id.eq.{tid}" for tid in telegram_ids)
        query = query.or_(f"phone_number.ilike.{pattern},{tg_filters}")
    else:
        query = query.ilike("phone_number", pattern)
        
    res = query.order("requested_at", desc=True).limit(20).execute()
    return res.data


def get_all_students():
    """Returns every student (for admin listing, includes NONE)."""
    res = supabase.table("students").select("*").order("joined_at", desc=True).execute()
    return res.data


def block_student(telegram_id):
    """Marks a student as blocked — they stay in DB but won't receive broadcasts."""
    supabase.table("students").update({
        "exam_preference": "BLOCKED",
        "is_registered": 0
    }).eq("telegram_id", str(telegram_id)).execute()


def delete_student(telegram_id):
    """Permanently removes a student and all their associated data."""
    tid = str(telegram_id)
    supabase.table("service_requests").delete().eq("telegram_id", tid).execute()
    supabase.table("user_documents").delete().eq("telegram_id", tid).execute()
    supabase.table("students").delete().eq("telegram_id", tid).execute()


def get_stats():
    # Count total
    total_res = supabase.table("students").select("id", count="exact").execute()
    total = total_res.count if total_res.count is not None else 0
    
    # Fetch all exam names dynamically to initialize the counts
    try:
        exams_res = supabase.table("exams").select("name").execute()
        by_exam = {exam["name"]: 0 for exam in (exams_res.data or [])}
    except Exception as e:
        print(f"Error fetching exams for stats: {e}")
        by_exam = {}
        
    by_exam["ALL"] = 0
    by_exam["NONE"] = 0
    by_exam["BLOCKED"] = 0
    
    # Fetch all students to count by exam preference in Python
    students = supabase.table("students").select("exam_preference").execute().data
    for s in students:
        pref = s.get("exam_preference") or "NONE"
        if pref in by_exam:
            by_exam[pref] += 1
        else:
            by_exam[pref] = 1
            
    return {"total_students": total, "by_exam": by_exam}


def get_public_stats():
    """Returns a slightly padded count for marketing purposes if real count is low."""
    stats = get_stats()
    real_total = stats["total_students"]
    display_total = max(real_total, 4000) if real_total < 4000 else real_total
    return {"total_students": display_total, "is_growing": real_total < 4000}


# ── Message log helpers ──────────────────────────────────────────────────────

def log_message(target_exam, message_text, count):
    supabase.table("message_logs").insert({
        "target_exam": target_exam,
        "message_text": message_text,
        "total_recipients": count
    }).execute()


def get_logs():
    res = supabase.table("message_logs").select("*").order("sent_at", desc=True).execute()
    return res.data


def get_public_news(limit=6):
    """Returns latest admin broadcasted messages as public news items.
    Strips excessively long messages to a preview length for the sidebar."""
    res = supabase.table("message_logs").select("id,target_exam,message_text,total_recipients,sent_at")\
        .order("sent_at", desc=True).limit(limit).execute()
    news = []
    for row in res.data:
        text = row.get("message_text") or ""
        for sym in ["*", "_", "`", "~"]:
            text = text.replace(sym, "")
        news.append({
            "id": row["id"],
            "message": text,
            "preview": text[:120] + ("..." if len(text) > 120 else ""),
            "exam": row["target_exam"],
            "recipients": row["total_recipients"],
            "sent_at": row["sent_at"],
        })
    return news


# ── Service Request helpers ──────────────────────────────────────────────────

def add_service_request(telegram_id, service_name, category):
    res = supabase.table("service_requests").insert({
        "telegram_id": str(telegram_id),
        "service_name": service_name,
        "category": category
    }).execute()
    return res.data[0]["id"]


def log_service_intent(phone_number, service_name, category):
    """Logs an application intent from the web (before user goes to WhatsApp)."""
    res = supabase.table("service_requests").insert({
        "phone_number": phone_number,
        "service_name": service_name,
        "category": category,
        "status": "pending"
    }).execute()
    return res.data[0]["id"]


def get_service_requests(status=None):
    """Fetch service requests with student info via manual memory join (bypasses missing FK relation)."""
    query = supabase.table("service_requests").select(
        "id,telegram_id,phone_number,service_name,category,status,requested_at,completed_at"
    )
    if status:
        res = query.eq("status", status).order("requested_at", desc=True).execute()
    else:
        res = query.order("requested_at", desc=True).execute()
        
    requests_data = res.data or []
    if not requests_data:
        return []

    # Batch fetch matching student details using unique telegram_ids
    telegram_ids = list(set(row["telegram_id"] for row in requests_data if row.get("telegram_id")))
    
    students_map = {}
    if telegram_ids:
        try:
            student_res = supabase.table("students").select("telegram_id,name,phone_number,username").in_("telegram_id", telegram_ids).execute()
            for s in (student_res.data or []):
                if s.get("telegram_id"):
                    students_map[s["telegram_id"]] = s
        except Exception as e:
            print(f"Error fetching students for join: {e}")
            
    records = []
    for row in requests_data:
        tid = row.get("telegram_id")
        student = students_map.get(tid) if tid else None
        
        # Parse name & phone if saved in format "Name | Phone" for anonymous web requests
        phone_raw = row.get("phone_number") or ""
        parsed_name = None
        if " | " in phone_raw:
            parts = phone_raw.split(" | ", 1)
            parsed_name = parts[0].strip()
            phone_raw = parts[1].strip()

        records.append({
            "id": row["id"],
            "telegram_id": row["telegram_id"],
            "service_name": row["service_name"],
            "category": row["category"],
            "status": row["status"],
            "requested_at": row["requested_at"],
            "completed_at": row["completed_at"],
            "student_name": student.get("name") if student else (parsed_name or "Unknown"),
            "student_phone": (student.get("phone_number") if student else None) or phone_raw,
            "student_username": student.get("username") if student else ""
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


# ── Document Handling ────────────────────────────────────────────────────────

def save_document(telegram_id, file_id, file_type, file_name=""):
    supabase.table("user_documents").insert({
        "telegram_id": str(telegram_id),
        "file_id": str(file_id),
        "file_type": str(file_type),
        "file_name": str(file_name)
    }).execute()


def get_user_documents(telegram_id):
    res = supabase.table("user_documents").select("*")\
        .eq("telegram_id", str(telegram_id))\
        .order("uploaded_at", desc=True)\
        .execute()
    return res.data


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
    """Upsert multiple settings at once."""
    rows = [{"key": str(k), "value": str(v)} for k, v in settings_dict.items()]
    if rows:
        supabase.table("bot_settings").upsert(rows).execute()
        for k in settings_dict:
            _cache_invalidate(f"bot_setting:{k}")


# ── Services CRUD ─────────────────────────────────────────────────────────────

def get_all_services():
    """Returns all services ordered by category and sort_order."""
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
            "name": row["name"],
            "description": row["description"],
            "price": row["price"]
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
            "price": row["price"]
        })
    _cache_set("public_services_dict", result)
    return result


def add_service(category_key, category_label, name, description="", price="", enabled=True, show_in_web=True):
    res_max = supabase.table("services").select("sort_order").eq("category_key", category_key).order("sort_order", desc=True).limit(1).execute()
    max_order = res_max.data[0]["sort_order"] if res_max.data else 0
    next_order = max_order + 1
    
    res = supabase.table("services").insert({
        "category_key": category_key,
        "category_label": category_label,
        "name": name,
        "description": description,
        "price": price,
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
    """Returns list of enabled exams."""
    cached = _cache_get("all_exams")
    if cached is not None:
        return cached
    res = supabase.table("exams").select("*").eq("enabled", 1).order("id", desc=False).execute()
    _cache_set("all_exams", res.data)
    return res.data


def add_exam(name):
    try:
        res = supabase.table("exams").insert({"name": name.strip()}).execute()
        _cache_invalidate("all_exams")
        return True, res.data[0]["id"]
    except Exception as e:
        return False, f"Exam already exists or error: {str(e)}"


def delete_exam(exam_id):
    supabase.table("exams").delete().eq("id", exam_id).execute()
    _cache_invalidate("all_exams")


# ── Broadcast Jobs persistence ─────────────────────────────────────────────

def create_broadcast_job(job_id, target_exam, total_count):
    supabase.table("broadcast_jobs").insert({
        "id": str(job_id),
        "target_exam": target_exam,
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
        
    supabase.table("broadcast_jobs").update(updates).eq("id", str(job_id)).execute()


def get_broadcast_job(job_id):
    res = supabase.table("broadcast_jobs").select("*").eq("id", str(job_id)).execute()
    if not res.data:
        return None
    row = res.data[0]
    return {
        "id": row["id"],
        "status": row["status"],
        "sent": row["sent_count"],
        "total": row["total_count"],
        "exam": row["target_exam"],
        "error": row["error_msg"],
        "updated_at": row["updated_at"]
    }


# ── Exam Manager Extensions (Admin CRUD) ───────────────────────────────────

def get_all_exams_admin():
    """Returns list of all exams (both enabled & disabled) for admin portal."""
    res = supabase.table("exams").select("*").order("id", desc=True).execute()
    return res.data


def add_exam_details(name, description='', category='UG', start_date='', end_date='', exam_date='', fees_gen_obc='', fees_sc_st='', eligibility='', official_url='', enabled=True):
    try:
        res = supabase.table("exams").insert({
            "name": name.strip(),
            "description": description,
            "category": category,
            "start_date": start_date,
            "end_date": end_date,
            "exam_date": exam_date,
            "fees_gen_obc": fees_gen_obc,
            "fees_sc_st": fees_sc_st,
            "eligibility": eligibility,
            "official_url": official_url,
            "enabled": 1 if enabled else 0
        }).execute()
        _cache_invalidate("all_exams")
        return True, res.data[0]["id"]
    except Exception as e:
        return False, f"Exam already exists or error: {str(e)}"


def update_exam_details(exam_id, name, description, category, start_date, end_date, exam_date, fees_gen_obc, fees_sc_st, eligibility, official_url, enabled):
    try:
        supabase.table("exams").update({
            "name": name.strip(),
            "description": description,
            "category": category,
            "start_date": start_date,
            "end_date": end_date,
            "exam_date": exam_date,
            "fees_gen_obc": fees_gen_obc,
            "fees_sc_st": fees_sc_st,
            "eligibility": eligibility,
            "official_url": official_url,
            "enabled": 1 if enabled else 0
        }).eq("id", exam_id).execute()
        _cache_invalidate("all_exams")
        return True
    except Exception as e:
        return False, f"Another exam with this name already exists or error: {str(e)}"


# ── Form Applications CRUD ────────────────────────────────────────────────

def submit_form_application(student_name, phone_number, email, dob, gender, category, exam_name, academic_qualification, doc_submission_method='upload'):
    res = supabase.table("form_applications").insert({
        "student_name": student_name,
        "phone_number": phone_number,
        "email": email,
        "dob": dob,
        "gender": gender,
        "category": category,
        "exam_name": exam_name,
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
    if status:
        res = supabase.table("form_applications").select("*").eq("status", status).order("submitted_at", desc=True).execute()
    else:
        res = supabase.table("form_applications").select("*").order("submitted_at", desc=True).execute()
    return res.data


def get_application_details(app_id):
    res = supabase.table("form_applications").select("*").eq("id", app_id).execute()
    if not res.data:
        return None
    app_dict = res.data[0]
    
    docs_res = supabase.table("application_documents").select("*").eq("application_id", app_id).execute()
    app_dict["documents"] = docs_res.data
    return app_dict


def update_application_status(app_id, status, remarks=None):
    updates = {"status": status, "remarks": remarks}
    if status == 'completed':
        updates["completed_at"] = datetime.utcnow().isoformat()
    supabase.table("form_applications").update(updates).eq("id", app_id).execute()


def get_student_applications_by_phone(phone_number):
    clean_phone = phone_number.strip().lstrip('+').lstrip('91')[-10:]
    pattern = f"%{clean_phone}"
    
    res = supabase.table("form_applications").select("*").ilike("phone_number", pattern).order("submitted_at", desc=True).execute()
    
    apps = []
    for row in res.data:
        app_id = row["id"]
        docs_res = supabase.table("application_documents").select("*").eq("application_id", app_id).execute()
        row["documents"] = docs_res.data
        apps.append(row)
    return apps


# ── Scheduled Announcements Helper Functions ─────────────────────────────────

def get_all_announcements_raw():
    """Fetch all announcements from the Supabase database."""
    res = supabase.table("announcements").select("*").order("created_at", desc=True).execute()
    return res.data or []


def get_all_active_announcements():
    """Fetch pending active scheduled announcements."""
    res = supabase.table("announcements").select("*").eq("is_active", 1).execute()
    return res.data or []


def add_scheduled_announcement(exam, message, run_at):
    """Insert a new scheduled announcement."""
    res = supabase.table("announcements").insert({
        "title": exam,
        "content": message,
        "links": run_at,
        "is_active": 1
    }).execute()
    return res.data[0]["id"]


def update_scheduled_announcement(ann_id, exam, message, run_at, is_active):
    """Update an existing scheduled announcement."""
    supabase.table("announcements").update({
        "title": exam,
        "content": message,
        "links": run_at,
        "is_active": is_active
    }).eq("id", ann_id).execute()


def mark_announcement_sent(ann_id):
    """Mark an announcement as sent/inactive."""
    supabase.table("announcements").update({"is_active": 0}).eq("id", ann_id).execute()


def delete_scheduled_announcement(ann_id):
    """Permanently delete a scheduled announcement."""
    supabase.table("announcements").delete().eq("id", ann_id).execute()
