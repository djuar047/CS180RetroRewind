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
    category = data.get("category", "General")

    if not title or not content:
        return jsonify({"error": "Title and content are required"}), 400

    new_thread = Thread(title, content, user_id, category)
    threads_collection.insert_one(new_thread.to_dict())
    return jsonify({"message": "Thread created successfully"}), 201

def get_all_threads():
    """Fetch threads with simple pagination."""
    # page and limit from query params: /threads?page=1&limit=5
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
        .find({}, {"_id": 0})
        .sort("date_created", -1)  # newest first
        .skip(skip)
        .limit(limit)
    )

    threads = list(cursor)
    return jsonify(threads), 200



def update_thread(title):
    """Update the content of a thread identified by its title."""
    data = request.get_json()
    new_content = data.get("content")

    if not new_content:
        return jsonify({"error": "Content is required"}), 400

    result = threads_collection.update_one(
        {"title": title},
        {"$set": {"content": new_content}}
    )

    if result.matched_count == 0:
        return jsonify({"error": "Thread not found"}), 404

    return jsonify({"message": "Thread updated"}), 200


def delete_thread(title):
    """Delete a thread identified by its title."""
    result = threads_collection.delete_one({"title": title})

    if result.deleted_count == 0:
        return jsonify({"error": "Thread not found"}), 404

    return jsonify({"message": "Thread deleted"}), 200


