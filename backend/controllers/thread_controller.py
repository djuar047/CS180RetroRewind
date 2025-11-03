from flask import jsonify, request
from pymongo import MongoClient
from models.thread_model import Thread

# Connect directly to MongoDB (avoids circular import)
client = MongoClient("mongodb://localhost:27017/")
db = client["retrorewind"]
threads_collection = db["threads"]

def create_thread():
    """Create a new discussion thread."""
    data = request.get_json()
    title = data.get("title")
    content = data.get("content")
    user_id = data.get("user_id")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    new_thread = Thread(title, content, user_id)
    threads_collection.insert_one(new_thread.to_dict())
    return jsonify({"message": "Thread created successfully"}), 201

def get_all_threads():
    """Fetch all threads."""
    threads = list(threads_collection.find({}, {"_id": 0}))
    return jsonify(threads), 200

