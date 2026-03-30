import requests
import os
import sys

from config import TELEGRAM_BOT_TOKEN

def set_commands():
    if not TELEGRAM_BOT_TOKEN:
        print("Bot token not found in config")
        sys.exit(1)
        
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/setMyCommands"
    commands = [
        {"command": "start", "description": "Registration aur shuruwat karein"},
        {"command": "services", "description": "E-Mitra ki sabhi sewaiyen dekhein"},
        {"command": "status", "description": "Apni registration details dekhein"},
        {"command": "change", "description": "Apna exam preference badlein"}
    ]
    
    response = requests.post(url, json={"commands": commands})
    print(response.json())

if __name__ == "__main__":
    set_commands()
