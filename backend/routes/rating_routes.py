# backend/routes/rating_routes.py

from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId

from config import db  # uses the Mongo connection from config.py

rating_bp = Blueprint("ratings_bp", __name__)


@rating_bp.post("/ratings")
def submit_rating():
    data = request.json or {}
    user_id = data.get("user_id")
    media_id = data.get("media_id")
    stars = data.get("stars")
    review_text = data.get("review_text", "")

    # Check if all required fields are present and not None
    if not all([user_id, media_id, stars]):
        return jsonify({"error": "missing_fields"}), 400
    
    # Convert media_id to string (it might be a number)
    media_id = str(media_id)

    # handle both ObjectId and string user_id
    try:
        uid = ObjectId(user_id)
    except Exception:
        uid = user_id

    # prevent duplicate rating for same user + media
    existing = db["ratings"].find_one({"user_id": uid, "media_id": media_id})
    if existing:
        return jsonify({
            "error": "already_rated",
            "rating_id": str(existing["_id"])
        }), 409

    rating_doc = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "media_id": media_id,
        "title": data.get("title", ""),
        "cover_url": data.get("cover_url", ""),
        "type": data.get("type", ""),
        "year": data.get("year", ""),
        "stars": int(stars),
        "review_text": review_text,
        "date_created": datetime.utcnow(),
    }

    result = db["ratings"].insert_one(rating_doc)
    return jsonify({"rating_id": str(result.inserted_id)}), 201


@rating_bp.get("/ratings/<media_id>")
def get_ratings(media_id):
    # media_id is stored as string in ratings, so we just query by that
    ratings = list(db["ratings"].find({"media_id": media_id}))

    fixed = []
    for r in ratings:
        fixed.append({
            "_id": str(r["_id"]),
            "user_id": str(r["user_id"]),
            "media_id": str(r["media_id"]),
            "title": r.get("title", ""),
            "cover_url": r.get("cover_url", ""),
            "type": r.get("type", ""),
            "year": r.get("year", ""),
            "stars": r.get("stars"),
            "review_text": r.get("review_text", ""),
            "date_created": r.get("date_created"),
        })

    return jsonify(fixed), 200


@rating_bp.delete("/ratings/<rating_id>")
def delete_rating(rating_id):
    try:
        rid = ObjectId(rating_id)
    except Exception:
        return jsonify({"error": "invalid_id"}), 400

    result = db["ratings"].delete_one({"_id": rid})

    if result.deleted_count == 0:
        return jsonify({"error": "not_found"}), 404

    return jsonify({"status": "deleted"}), 200


@rating_bp.put("/ratings/<rating_id>")
def update_rating(rating_id):
    try:
        rid = ObjectId(rating_id)
    except Exception:
        return jsonify({"error": "invalid_id"}), 400

    data = request.json or {}
    stars = data.get("stars")
    review_text = data.get("review_text", "")

    if not stars:
        return jsonify({"error": "missing_stars"}), 400

    result = db["ratings"].update_one(
        {"_id": rid},
        {"$set": {"stars": int(stars), "review_text": review_text}},
    )

    if result.modified_count == 0:
        return jsonify({"error": "not_found"}), 404

    return jsonify({"status": "updated"}), 200
