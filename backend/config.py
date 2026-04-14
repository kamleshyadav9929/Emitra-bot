import os
import sys
from dotenv import load_dotenv

# Try to load .env from the root directory or backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")

# ── Clerk Configuration ───────────────────────────────────────────────────────
CLERK_PUBLISHABLE_KEY = os.getenv("CLERK_PUBLISHABLE_KEY", "pk_test_cGlja2VkLWJveGVyLTk2LmNsZXJrLmFjY291bnRzLmRldiQ")
try:
    import base64
    _key_part = CLERK_PUBLISHABLE_KEY.split("_")[2]
    _padded = _key_part + '=' * (-len(_key_part) % 4)
    CLERK_DOMAIN = base64.b64decode(_padded).decode('utf-8').rstrip('$')
    CLERK_JWKS_URL = f"https://{CLERK_DOMAIN}/.well-known/jwks.json"
except Exception as e:
    print(f"WARNING: Invalid CLERK_PUBLISHABLE_KEY format ({e}). Clerk JWTs cannot be verified.")
    CLERK_JWKS_URL = ""


# Webhook secret for verifying incoming Telegram updates
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "916377964293")
# Render automatically injects the PORT environment variable
FLASK_PORT = int(os.getenv("PORT", os.getenv("FLASK_PORT", 5000)))
