# backend/routes/auth_routes.py

from datetime import datetime
from flask import Blueprint, request, jsonify
from bson import ObjectId
import bcrypt

from config import db, secondary_db
from user import User

auth_bp = Blueprint("auth_bp", __name__)


@auth_bp.post("/register")
def register():
    data = request.json or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify({"error": "missing_fields"}), 400

    # check if email already exists
    if db["users"].find_one({"email": email}):
        return jsonify({"error": "email_exists"}), 400

    # hash password like in the old big app.py
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    # create user object (same as before)
    user = User(
        user_id=str(ObjectId()),
        username=username,
        email=email,
        password=password,
    )

    db["users"].insert_one(
        {
            "_id": ObjectId(user.user_id),
            "username": user.username,
            "email": user.email,
            "password": hashed_pw.decode("utf-8"),  # store as string
            "profile": {
                "bio": user.profile.bio,
                "avatar_url": user.profile.avatar_url,
                "wishlist": [],
                "library": [],
            },
        }
    )

    return jsonify({"message": "User registered", "user_id": user.user_id}), 201


@auth_bp.post("/login")
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"error": "missing_fields"}), 400

    user_doc = db["users"].find_one({"email": email})
    if not user_doc:
        return jsonify({"error": "invalid_credentials"}), 401

    # check hashed password
    hashed_pw = user_doc["password"].encode("utf-8")
    if not bcrypt.checkpw(password.encode("utf-8"), hashed_pw):
        return jsonify({"error": "invalid_credentials"}), 401

    # create token, same as big app.py
    token = f"token_{str(user_doc['_id'])}"
    db["users"].update_one(
        {"_id": user_doc["_id"]},
        {"$set": {"auth_token": token}},
    )

    # log login to secondary DB
    secondary_db["login_history"].insert_one(
        {
            "user_id": str(user_doc["_id"]),
            "username": user_doc["username"],
            "email": user_doc["email"],
            "login_time": datetime.utcnow(),
            "auth_token": token,
        }
    )

    return jsonify(
        {
            "message": "Login successful",
            "auth_token": token,
            "user_id": str(user_doc["_id"]),
        }
    ), 200


