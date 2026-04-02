import os
import sys
from dotenv import load_dotenv

# Try to load .env from the root directory or backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# ── FIX #1: Enforce secrets — crash loudly if missing in production ────────────
_admin_key = os.getenv("ADMIN_SECRET_KEY")
_jwt_key   = os.getenv("JWT_SECRET_KEY")

# Only enforce non-empty secrets when not in dev (allow local dev with defaults)
_is_dev = os.getenv("FLASK_ENV", "production") == "development"

if not _admin_key:
    if _is_dev:
        print("WARNING: ADMIN_SECRET_KEY not set. Using insecure default for development.")
        _admin_key = "emitra2025"
    else:
        print("FATAL: ADMIN_SECRET_KEY environment variable is not set!", file=sys.stderr)
        sys.exit(1)

if not _jwt_key:
    if _is_dev:
        print("WARNING: JWT_SECRET_KEY not set. Using insecure default for development.")
        _jwt_key = "super-secret-jwt-key-2025"
    else:
        print("FATAL: JWT_SECRET_KEY environment variable is not set!", file=sys.stderr)
        sys.exit(1)

ADMIN_SECRET_KEY = _admin_key
JWT_SECRET_KEY   = _jwt_key

# Webhook secret for verifying incoming Telegram updates
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "916377964293")
# Render automatically injects the PORT environment variable
FLASK_PORT = int(os.getenv("PORT", os.getenv("FLASK_PORT", 5000)))
