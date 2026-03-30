import requests
import concurrent.futures

TELEGRAM_API_URL = "https://api.telegram.org/bot{token}/sendMessage"


def send_message_to_user(bot_token, telegram_id, message):
    """Send a single message to one user via Telegram HTTP API (no asyncio)."""
    url = TELEGRAM_API_URL.format(token=bot_token)
    try:
        response = requests.post(
            url,
            json={"chat_id": str(telegram_id), "text": message},
            timeout=15,
        )
        if response.ok:
            return True
        else:
            print(f"Telegram API error for {telegram_id}: {response.status_code} — {response.text}")
            return False
    except Exception as e:
        print(f"Failed to send to {telegram_id}: {e}")
        return False


def broadcast(bot_token, student_list, message):
    """
    Broadcasts a message to a list of students using a thread pool.
    Avoids asyncio.run() conflicts with Flask's WSGI context.
    student_list = [{"telegram_id": "123"}, ...]
    """
    if not student_list:
        return 0

    success_count = 0
    # Use up to 10 threads — safe for Telegram's rate limits on small lists
    max_workers = min(10, len(student_list))

    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        futures = {
            executor.submit(
                send_message_to_user, bot_token, student["telegram_id"], message
            ): student
            for student in student_list
        }
        for future in concurrent.futures.as_completed(futures):
            try:
                if future.result() is True:
                    success_count += 1
            except Exception as e:
                print(f"Broadcast future error: {e}")

    return success_count
