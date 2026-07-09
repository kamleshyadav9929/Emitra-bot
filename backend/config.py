import os
import sys
from dotenv import load_dotenv

# Try to load .env from the root directory or backend directory
env_path_root = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
env_path_backend = os.path.join(os.path.dirname(os.path.abspath(__file__)), '.env')

if os.path.exists(env_path_root):
    load_dotenv(env_path_root)
elif os.path.exists(env_path_backend):
    load_dotenv(env_path_backend)
else:
    load_dotenv()

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

def _normalize_pem_key(raw):
    """Convert any .env format of a PEM key into a valid multi-line PEM string.
    
    Handles:
      - Literal \\n escape sequences (single-line .env value)
      - Actual newlines (multi-line .env value)
      - Raw base64 without PEM headers
      - Already-valid PEM
    """
    if not raw:
        return ""
    key = raw.strip().strip('"').strip("'")

    # Replace literal \n sequences (common when pasting into .env files)
    key = key.replace("\\n", "\n")

    if "-----BEGIN" in key:
        # Extract the base64 body, strip all whitespace, and re-wrap at 64 chars
        inner = key.replace("-----BEGIN PUBLIC KEY-----", "") \
                   .replace("-----END PUBLIC KEY-----", "") \
                   .replace("\n", "").replace("\r", "").replace(" ", "").strip()
        wrapped = "\n".join(inner[i:i+64] for i in range(0, len(inner), 64))
        return f"-----BEGIN PUBLIC KEY-----\n{wrapped}\n-----END PUBLIC KEY-----"

    # Raw base64 without PEM headers — wrap it
    key_clean = key.replace("\n", "").replace("\r", "").replace(" ", "")
    wrapped = "\n".join(key_clean[i:i+64] for i in range(0, len(key_clean), 64))
    return f"-----BEGIN PUBLIC KEY-----\n{wrapped}\n-----END PUBLIC KEY-----"


CLERK_JWT_PUBLIC_KEY = _normalize_pem_key(os.getenv("CLERK_JWT_PUBLIC_KEY", ""))



# Webhook secret for verifying incoming Telegram updates
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET", "")

WHATSAPP_NUMBER = os.getenv("WHATSAPP_NUMBER", "916377964293")
# Render automatically injects the PORT environment variable
FLASK_PORT = int(os.getenv("PORT", os.getenv("FLASK_PORT", 5000)))

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

