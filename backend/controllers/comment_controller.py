from flask import jsonify, request
from pymongo import MongoClient
from models.comment_model import Comment
from bson import ObjectId


# Connect directly to MongoDB (avoids circular import)
client = MongoClient("mongodb://localhost:27017/")
db = client["retrorewind"]
comments_collection = db["comments"]
threads_collection = db["threads"]

def post_comment():
    """Add a comment to a thread."""
    data = request.get_json()
    content = data.get("content")
    thread_id = data.get("thread_id")
    user_id = data.get("user_id")

    if not content or not thread_id:
        return jsonify({"error": "Content and thread_id are required"}), 400

    new_comment = Comment(content, thread_id, user_id)
    comment_data = new_comment.to_dict()
    result = comments_collection.insert_one(comment_data)

    # Link the comment to its thread by title
    threads_collection.update_one(
        {"title": thread_id},
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
            "deleted": doc.get("deleted", False),
        }
        comments.append(comment)
    return jsonify(comments), 200


def update_comment(comment_id):
    """Edit the content of a comment by its id."""
    data = request.get_json()
    new_content = data.get("content")

    if not new_content:
        return jsonify({"error": "Content is required"}), 400

    try:
        result = comments_collection.update_one(
            {"_id": ObjectId(comment_id)},
            {"$set": {"content": new_content, "deleted": False}}
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Comment not found"}), 404

    return jsonify({"message": "Comment updated"}), 200


def delete_comment(comment_id):
    """Soft delete a comment: keep it, but mark as deleted + change text."""
    try:
        result = comments_collection.update_one(
            {"_id": ObjectId(comment_id)},
            {
                "$set": {
                    "content": "Comment has been deleted",
                    "deleted": True,
                }
            }
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 400

    if result.matched_count == 0:
        return jsonify({"error": "Comment not found"}), 404

    return jsonify({"message": "Comment marked as deleted"}), 200
