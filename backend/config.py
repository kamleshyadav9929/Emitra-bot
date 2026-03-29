import os
from dotenv import load_dotenv

# Try to load .env from the root directory or backend directory
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
load_dotenv(env_path)

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
ADMIN_SECRET_KEY = os.getenv("ADMIN_SECRET_KEY", "emitra2025")
# Render automatically injects the PORT environment variable
FLASK_PORT = int(os.getenv("PORT", os.getenv("FLASK_PORT", 5000)))
