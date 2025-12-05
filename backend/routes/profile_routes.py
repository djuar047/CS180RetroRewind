# backend/routes/profile_routes.py

from flask import Blueprint, request, jsonify
from bson import ObjectId
from config import db

profile_bp = Blueprint("profile_bp", __name__)

# ------------------ PROFILE INFO ------------------ #

@profile_bp.get("/profile/<user_id>")
def get_profile(user_id):
    """Return basic profile info for a user."""
    user_doc = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return jsonify({"error": "user_not_found"}), 404

    profile = user_doc.get("profile", {})
    return jsonify({
        "username": user_doc["username"],
        "email": user_doc["email"],
        "bio": profile.get("bio", ""),
        "avatar_url": profile.get("avatar_url", ""),
        "wishlist": profile.get("wishlist", []),
        "library": profile.get("library", []),
    })


@profile_bp.post("/profile/<user_id>/update")
def update_profile(user_id):
    """Update username, email, avatar_url, or bio for a profile."""
    data = request.json or {}
    new_username = data.get("username")
    new_email = data.get("email")
    bio = data.get("bio")
    avatar_url = data.get("avatar_url")

    updates = {}
    if new_username:
        updates["username"] = new_username
    if new_email:
        updates["email"] = new_email
    if bio is not None:
        updates["profile.bio"] = bio
    if avatar_url is not None:
        updates["profile.avatar_url"] = avatar_url

    db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    return jsonify({"message": "Profile updated"})


# ------------------ LIBRARY (WATCHLIST) ------------------ #

@profile_bp.route("/profile/<user_id>/library/add", methods=["POST"])
def add_to_library(user_id):
    """
    Add a media item into the user's library (watchlist).
    Expects JSON with: id, title, type, optional year & coverUrl.
    Prevents duplicates per user + media id.
    """
    data = request.get_json() or {}

    if not all([data.get("id"), data.get("title"), data.get("type")]):
        return jsonify({"error": "missing_fields"}), 400

    media = {
        "id": data.get("id"),
        "title": data.get("title"),
        "type": data.get("type"),
        "year": data.get("year", ""),
        "coverUrl": data.get("coverUrl", ""),
    }

    # Ensure profile structure exists
    db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {
            "$setOnInsert": {
                "profile": {
                    "bio": "",
                    "avatar_url": "",
                    "wishlist": [],
                    "library": [],
                }
            }
        },
        upsert=True,
    )

    # 🔍 check if this media is already in the user's library
    existing = db["users"].find_one(
        {
            "_id": ObjectId(user_id),
            "profile.library.id": media["id"],  # check by media id
        }
    )
    if existing:
        return jsonify({"error": "already_in_library"}), 409

    # Push item into library array
    result = db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$push": {"profile.library": media}},
    )

    if result.modified_count == 0:
        return jsonify({"error": "user_not_found"}), 404

    return jsonify({"message": "Added to watchlist", "item": media}), 201



@profile_bp.get("/profile/<user_id>/library")
def get_library(user_id):
    """Return the list of items in the user's library."""
    user_doc = db["users"].find_one(
        {"_id": ObjectId(user_id)}, {"_id": 0, "profile.library": 1}
    )
    if not user_doc:
        return jsonify({"error": "User not found"}), 404

    return jsonify(user_doc.get("profile", {}).get("library", []))


# ------------------ USER'S RATINGS ------------------ #

@profile_bp.get("/profile/<user_id>/ratings")
def get_user_ratings(user_id):
    """
    Return all ratings for a given user, formatted for the Profile page.
    Handles user_id stored as ObjectId or as a plain string.
    """
    # figure out how user_id is stored in the ratings collection
    if ObjectId.is_valid(user_id):
        uid = ObjectId(user_id)
    else:
        uid = user_id

    cursor = db["ratings"].find({"user_id": uid})

    ratings = []
    for r in cursor:
        ratings.append(
            {
                "rating_id": str(r["_id"]),
                "media_id": r.get("media_id", ""),
                "title": r.get("title", ""),
                "cover_url": r.get("cover_url", ""),
                "type": r.get("type", ""),
                "year": r.get("year", ""),
                "stars": r.get("stars", 0),
                "review_text": r.get("review_text", ""),
                "date_created": r.get("date_created"),
            }
        )

    return jsonify(ratings), 200


