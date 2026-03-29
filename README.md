# E-Mitra Telegram Bot & Dashboard

E-Mitra is a comprehensive student notification system combining a Telegram Bot ecosystem and a dark-themed React Admin Dashboard.

## Setup Instructions

### 1. Telegram Bot Token
You must acquire a bot token from [@BotFather](https://t.me/botfather) on Telegram and place it inside the `.env` file at the root.

```env
TELEGRAM_BOT_TOKEN="your_bot_token_here"
```

### 2. Run Backend
The backend utilizes Python, Flask, and SQLite.

```bash
cd backend
pip install -r requirements.txt
python main.py
```
> **Note**: This will automatically generate the `emitra.db` database. Port defaults to `5000`.

### 3. Run Frontend
The frontend utilizes React, Vite, and Tailwind CSS v4 to achieve the dark, terminal-inspired design.

```bash
cd frontend
npm install
npm run dev
```

### 4. Setting up the Telegram Webhook (Post-Deployment)
Whenever you deploy the backend to Render (or any public server), you MUST tell Telegram where to send updates. Visit this URL in your browser:
```text
https://api.telegram.org/bot{YOUR_BOT_TOKEN}/setWebhook?url=https://{YOUR_RENDER_URL}/webhook
```

### 5. Prevent Server Sleep (Render Free Tier)
The backend exposes a `/ping` route that doesn't trigger database requests.
Go to `cron-job.org` and set it up to call `https://{YOUR_RENDER_URL}/ping` every 14 minutes.
