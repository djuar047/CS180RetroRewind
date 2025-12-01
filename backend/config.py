# backend/config.py

import os
from dotenv import load_dotenv
from pymongo import MongoClient

# Load .env file
load_dotenv()

# ---------------------------
#       DATABASE SETUP
# ---------------------------

# Main MongoDB
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("Missing MONGO_URI in .env")

mongo_client = MongoClient(MONGO_URI)
db = mongo_client["retro_rewind"]

# Secondary DB
SECONDARY_DB_URI = os.getenv("SECONDARY_DB_URI")
if not SECONDARY_DB_URI:
    raise RuntimeError("Set SECONDARY_DB_URI in .env")

secondary_client = MongoClient(SECONDARY_DB_URI)
secondary_db = secondary_client["analytics_db"]

# ---------------------------
#       API CREDENTIALS
# ---------------------------
CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")

if not CLIENT_ID or not CLIENT_SECRET:
    raise RuntimeError("Missing CLIENT_ID or CLIENT_SECRET for IGDB API.")

# ---------------------------
# Exports
# ---------------------------
__all__ = [
    "db",
    "secondary_db",
    "CLIENT_ID",
    "CLIENT_SECRET",
    "OMDB_API_KEY",
]
