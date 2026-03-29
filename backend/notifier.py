import asyncio
from telegram import Bot

async def send_message_to_user(bot_token, telegram_id, message):
    bot = Bot(token=bot_token)
    try:
        await bot.send_message(chat_id=telegram_id, text=message)
        return True
    except Exception as e:
        print(f"Failed to send to {telegram_id}: {e}")
        return False

def broadcast(bot_token, student_list, message):
    """
    Broadcasts message to a list of students asynchronously.
    student_list = [{"telegram_id": "123"}, ...]
    """
    async def run_broadcast():
        success_count = 0
        tasks = []
        for student in student_list:
            tasks.append(send_message_to_user(bot_token, student["telegram_id"], message))
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        for r in results:
            if r is True:
                success_count += 1
        return success_count

    try:
        return asyncio.run(run_broadcast())
    except Exception as e:
        print(f"Broadcast error: {e}")
        return 0
