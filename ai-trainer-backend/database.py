
from pymongo import MongoClient
import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=".env")

MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise Exception("❌ MONGO_URI not found in .env file")

try:
    client = MongoClient(MONGO_URI)
    client.admin.command("ping")  # Ping to check connection
    print("✅ MongoDB connected successfully!")
except Exception as e:
    print("❌ MongoDB connection failed!")
    print(e)
    raise e

db = client["ai_trainer_db"]