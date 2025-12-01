from flask import jsonify, request
from pymongo import MongoClient
from models.comment_model import Comment
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
comments_collection = db["comments"]
threads_collection = db["threads"]
users_collection = db["users"]

def post_comment():
    """Add a comment to a thread."""
    data = request.get_json() or {}
    content = data.get("content")
    thread_id = data.get("thread_id")
    user_id = data.get("user_id")

    if not content or not thread_id:
        return jsonify({"error": "Content and thread_id are required"}), 400

    # Look up username if we have a user_id
    username = "Unknown"
    if user_id:
        try:
            uid = ObjectId(user_id)
            user = users_collection.find_one({"_id": uid})
            if user:
                username = user.get("username", "Unknown")
        except Exception:
            # leave username = "Unknown" if ObjectId or lookup fails
            pass

    # build comment doc
    new_comment = Comment(content, thread_id, user_id)
    comment_data = new_comment.to_dict()
    comment_data["username"] = username   # 👈 add username field

    result = comments_collection.insert_one(comment_data)

    # Link the comment to its thread by _id
    try:
        thread_oid = ObjectId(thread_id)
    except Exception:
        return jsonify({"error": "Invalid thread_id"}), 400

    threads_collection.update_one(
        {"_id": thread_oid},
        {"$push": {"comments": str(result.inserted_id)}}
    )

    return jsonify({"message": "Comment added successfully"}), 201





def get_comments_by_thread(thread_id):
    """Fetch all comments for a given thread."""
    docs = comments_collection.find({"thread_id": thread_id})
    comments = []
    for doc in docs:
        comment = {
            "id": str(doc["_id"]),
            "content": doc.get("content", ""),
            "date_created": doc.get("date_created"),
            "thread_id": doc.get("thread_id"),
            "user_id": doc.get("user_id"),
            "username": doc.get("username"),      # 👈 new
            "deleted": doc.get("deleted", False),
        }
        comments.append(comment)
    return jsonify(comments), 200


def update_comment(comment_id):
    """Edit the content of a comment by its id."""
    data = request.get_json() or {}
    new_content = data.get("content")
    user_id = data.get("user_id")

    if not new_content:
        return jsonify({"error": "Content is required"}), 400
    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        oid = ObjectId(comment_id)
    except Exception as e:
        return jsonify({"error": "Invalid comment id"}), 400

    comment = comments_collection.find_one({"_id": oid})
    if not comment:
        return jsonify({"error": "Comment not found"}), 404

    # Only owner can edit
    if str(comment.get("user_id")) != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    result = comments_collection.update_one(
        {"_id": oid},
        {"$set": {"content": new_content, "deleted": False}}
    )

    return jsonify({"message": "Comment updated"}), 200


def delete_comment(comment_id):
    """Soft delete a comment: keep it, but mark as deleted + change text."""
    data = request.get_json() or {}
    user_id = data.get("user_id")

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    try:
        oid = ObjectId(comment_id)
    except Exception:
        return jsonify({"error": "Invalid comment id"}), 400

    comment = comments_collection.find_one({"_id": oid})
    if not comment:
        return jsonify({"error": "Comment not found"}), 404

    # Only owner can delete
    if str(comment.get("user_id")) != str(user_id):
        return jsonify({"error": "Forbidden"}), 403

    result = comments_collection.update_one(
        {"_id": oid},
        {
            "$set": {
                "content": "Comment has been deleted",
                "deleted": True,
            }
        }
    )

    return jsonify({"message": "Comment marked as deleted"}), 200
