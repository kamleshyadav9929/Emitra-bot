import requests
import time

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"

# Telegram allows 30 messages/sec globally, and 1 msg/sec per chat.
# For broadcasts: send sequentially with a small delay to stay safe.
# For single receipts from admin: no delay needed.
# Optimized for speed: 1/30s = 0.033s. We use 0.035s to stay safe.
BROADCAST_DELAY_SECONDS = 0.035   # ~28 messages per second
MAX_RETRIES = 2


def send_message_to_user(bot_token, telegram_id, message, parse_mode="Markdown"):
    """
    Send a single message to one user via Telegram HTTP API (no asyncio).
    Supports Markdown formatting by default (for admin receipts).
    """
    url = TELEGRAM_API_URL.format(token=bot_token)
    payload = {
        "chat_id": str(telegram_id),
        "text": message,
        "parse_mode": parse_mode,
    }
    for attempt in range(MAX_RETRIES + 1):
        try:
            response = requests.post(url, json=payload, timeout=15)
            if response.ok:
                return True
            data = response.json()
            # Handle rate limit specifically
            if response.status_code == 429:
                retry_after = data.get("parameters", {}).get("retry_after", 5)
                print(f"Rate limited for {telegram_id}. Retrying after {retry_after}s...")
                time.sleep(retry_after)
                continue
            # Handle blocked / user deactivated — don't retry
            if response.status_code in (400, 403):
                print(f"Permanent failure for {telegram_id}: {data.get('description', response.text)}")
                return False
            print(f"Telegram API error for {telegram_id}: {response.status_code} — {response.text}")
            return False
        except Exception as e:
            print(f"Failed to send to {telegram_id}: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(2)
            else:
                return False
    return False


def broadcast(bot_token, student_list, message, parse_mode="Markdown", on_progress=None):
    """
    Broadcasts a message sequentially with high speed.
    - on_progress: Optional callback function(current_count)
    """
    if not student_list:
        return 0

    success_count = 0
    total = len(student_list)

    for i, student in enumerate(student_list):
        ok = send_message_to_user(bot_token, student["telegram_id"], message, parse_mode)
        if ok:
            success_count += 1
        
        # Update progress every 10 messages to reduce DB write overhead
        if on_progress and (i + 1) % 10 == 0:
            on_progress(success_count)

        # Add inter-message delay to stay under rate limit
        if i < total - 1:
            time.sleep(BROADCAST_DELAY_SECONDS)

    return success_count
