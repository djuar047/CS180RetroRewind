from flask import Blueprint, request, jsonify
from authorization import create_user, verify_token, delete_user
import requests
import os

auth_blueprint = Blueprint("auth", __name__)

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY")

#register new user
@auth_blueprint.route("/register", methods=["POST"])
def register_user():
    data = request.get_json()
    if not data or "email" not in data or "password" not in data:
        return jsonify({"error": "Missing email or password"}), 400
    user = create_user(data["email"], data["password"])
    if user:
        return jsonify({"message": "User created", "uid": user.uid}), 201
    return jsonify({"error": "Failed to create user"}), 400

# verify token
@auth_blueprint.route("/verify", methods=["POST"])
def verify_user_token():
    data = request.get_json()
    if not data or "id_token" not in data:
        return jsonify({"error": "Missing token"}), 400

    decoded = verify_token(data["id_token"])
    if decoded:
        return jsonify({"message": "Token verified", "uid": decoded["uid"]}), 200
    return jsonify({"error": "Invalid or expired token"}), 401

#login after creating an account
@auth_blueprint.route("/login", methods=["POST"])
def login_user():
    data = request.get_json()
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Missing email or password"}), 400

    try:
        url = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_WEB_API_KEY}"
        payload = {
            "email": email,
            "password": password,
            "returnSecureToken": True
        }
        response = requests.post(url, json=payload)
        result = response.json()

        if response.status_code == 200:
            return jsonify({
                "message": "Login successful",
                "idToken": result["idToken"],
                "refreshToken": result["refreshToken"],
                "uid": result["localId"]
            }), 200
        else:
            return jsonify({"error": result.get("error", {}).get("message", "Login failed")}), 401

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# delete user
@auth_blueprint.route("/delete", methods=["POST"])
def delete_user_route():
    data = request.get_json()
    if not data or "uid" not in data:
        return jsonify({"error": "Missing UID"}), 400

    try:
        delete_user(data["uid"])
        return jsonify({"message": "User deleted"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
