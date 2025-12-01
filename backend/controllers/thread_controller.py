from flask import jsonify, request
from pymongo import MongoClient
from models.thread_model import Thread
from bson import ObjectId
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("Missing MONGO_URI in .env")


client = MongoClient(MONGO_URI)
db = client["retro_rewind"]
threads_collection = db["threads"]
users_collection = db["users"] 


def create_thread():
    """Create a new discussion thread."""
    data = request.get_json() or {}
    title = data.get("title")
    content = data.get("content")
    user_id = data.get("user_id")
    category = data.get("category", "General")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    # convert to ObjectId if possible
    try:
        oid = ObjectId(user_id)
    except Exception:
        return jsonify({"error": "Invalid user_id"}), 400

    user = users_collection.find_one({"_id": oid})
    if not user:
        return jsonify({"error": "Invalid user_id"}), 400

    username = user.get("username", "Unknown")

    new_thread = {
        "title": title,
        "content": content,
        "category": category,
        "user_id": str(oid),
        "username": username,
        "date_created": datetime.utcnow(),
        "comments": [],
    }

    result = threads_collection.insert_one(new_thread)

    return jsonify(
        {
            "message": "Thread created successfully",
            "thread_id": str(result.inserted_id),
            "username": username,
        }
    ), 201



def get_all_threads():
    """Fetch threads with simple pagination."""
    try:
        page = int(request.args.get("page", 1))
        limit = int(request.args.get("limit", 5))
    except ValueError:
        page = 1
        limit = 5

    if page < 1:
        page = 1
    if limit < 1 or limit > 50:
        limit = 5

    skip = (page - 1) * limit

    cursor = (
        threads_collection
        .find({})
        .sort("date_created", -1)
        .skip(skip)
        .limit(limit)
    )

    threads = []
    for doc in cursor:
        doc["id"] = str(doc["_id"])
        del doc["_id"]

        # backfill username if missing
        if "username" not in doc and "user_id" in doc:
            try:
                uid = ObjectId(doc["user_id"])
                user = users_collection.find_one({"_id": uid})
                doc["username"] = user.get("username", "Unknown") if user else "Unknown"
            except Exception:
                doc["username"] = "Unknown"

        threads.append(doc)

    return jsonify(threads), 200


def get_thread_by_id(thread_id):
    """Fetch a single thread by its Mongo _id."""
    try:
        oid = ObjectId(thread_id)
    except Exception:
        return jsonify({"error": "Invalid thread id"}), 400

    doc = threads_collection.find_one({"_id": oid})
    if not doc:
        return jsonify({"error": "Thread not found"}), 404

    doc["id"] = str(doc["_id"])
    del doc["_id"]
    return jsonify(doc), 200


def update_thread(thread_id):
    """Update the content of a thread identified by its _id."""
    data = request.get_json() or {}
    new_content = data.get("content")
    user_id = data.get("user_id")

    if not new_content:
        return jsonify({"error": "Content is required"}), 400
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        oid = ObjectId(thread_id)
    except Exception:
        return jsonify({"error": "Invalid thread id"}), 400

    thread = threads_collection.find_one({"_id": oid})
    if not thread:
        return jsonify({"error": "Thread not found"}), 404

    # Only owner can edit
    if str(thread.get("user_id")) != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    result = threads_collection.update_one(
        {"_id": oid},
        {"$set": {"content": new_content}}
    )

    return jsonify({"message": "Thread updated"}), 200



def delete_thread(thread_id):
    """Delete a thread identified by its _id."""
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        oid = ObjectId(thread_id)
    except Exception:
        return jsonify({"error": "Invalid thread id"}), 400

    thread = threads_collection.find_one({"_id": oid})
    if not thread:
        return jsonify({"error": "Thread not found"}), 404

    # Only owner can delete
    if str(thread.get("user_id")) != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    result = threads_collection.delete_one({"_id": oid})
    if result.deleted_count == 0:
        return jsonify({"error": "Thread not found"}), 404

    return jsonify({"message": "Thread deleted"}), 200
