from flask import jsonify, request
from pymongo import MongoClient
from models.comment_model import Comment

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017/")
db = client["retrorewind"]
comments_collection = db["comments"]
threads_collection = db["threads"]

def post_comment():
    """Add a comment to a specific thread."""
    data = request.get_json()
    content = data.get("content")
    thread_id = data.get("thread_id")
    user_id = data.get("user_id")

    if not content or not thread_id:
        return jsonify({"error": "Content and thread_id are required"}), 400

    new_comment = Comment(content, thread_id, user_id)
    comment_data = new_comment.to_dict()
    result = comments_collection.insert_one(comment_data)

    # Optionally link the comment to its thread
    threads_collection.update_one(
        {"_id": thread_id}, {"$push": {"comments": str(result.inserted_id)}}
    )

    return jsonify({"message": "Comment added successfully"}), 201

def get_comments_by_thread(thread_id):
    """Fetch all comments for a given thread."""
    comments = list(comments_collection.find({"thread_id": thread_id}, {"_id": 0}))
    return jsonify(comments), 200

