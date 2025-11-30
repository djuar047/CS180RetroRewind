import os
import time
import requests
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from firebase_setup import db as firebase_db, auth, bucket  # firebase db (if you ever need it)
from authorization import create_user, verify_token
from authorization_paths import auth_blueprint
from bson import ObjectId
import bcrypt

# Routes
from routes.thread_routes import thread_bp
from routes.comment_routes import comment_bp
from user import User
from profile import Profile

# Load environment
load_dotenv()

# ----- MongoDB setup -----
MONGO_URI = os.getenv("MONGO_URI")
if not MONGO_URI:
    raise RuntimeError("Missing MONGO_URI in .env")
mongo_client = MongoClient(MONGO_URI)
db = mongo_client["retro_rewind"]

SECONDARY_DB_URI = os.getenv("SECONDARY_DB_URI")  # add this to .env
if not SECONDARY_DB_URI:
    raise RuntimeError("Set SECONDARY_DB_URI in .env")

secondary_client = MongoClient(SECONDARY_DB_URI)
secondary_db = secondary_client["analytics_db"]  # or whatever DB you want

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
OMDB_API_KEY = os.getenv("OMDB_API_KEY")
if not CLIENT_ID or not CLIENT_SECRET:
    raise RuntimeError("Missing CLIENT_ID/CLIENT_SECRET in .env")

# ----- Flask setup -----
app = Flask(__name__)
CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
            ]
        }
    },
)

# Blueprints
app.register_blueprint(thread_bp)
app.register_blueprint(comment_bp)
app.register_blueprint(auth_blueprint, url_prefix="/auth")

# Token cache for IGDB
_token_cache = {"value": None, "expires_at": 0}

# ---------- AUTH / USERS / PROFILE ----------

@app.post("/register")
def register():
    data = request.json or {}
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")

    if not all([username, email, password]):
        return jsonify({"error": "missing_fields"}), 400

    # Check if email already exists
    if db["users"].find_one({"email": email}):
        return jsonify({"error": "email_exists"}), 400

    # Hash the password
    hashed_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt())

    # Create user and profile
    user = User(user_id=str(ObjectId()), username=username, email=email, password=password)
    db["users"].insert_one(
        {
            "_id": ObjectId(user.user_id),
            "username": user.username,
            "email": user.email,
            "password": hashed_pw.decode("utf-8"),
            "profile": {
                "bio": user.profile.bio,
                "avatar_url": user.profile.avatar_url,
                "wishlist": [],
                "library": [],
            },
        }
    )

    return jsonify({"message": "User registered", "user_id": user.user_id}), 201


@app.post("/login")
def login():
    data = request.json or {}
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"error": "missing_fields"}), 400

    user_doc = db["users"].find_one({"email": email})
    if not user_doc:
        return jsonify({"error": "invalid_credentials"}), 401

    hashed_pw = user_doc["password"].encode("utf-8")
    if not bcrypt.checkpw(password.encode("utf-8"), hashed_pw):
        return jsonify({"error": "invalid_credentials"}), 401

    # create token
    token = f"token_{str(user_doc['_id'])}"
    db["users"].update_one({"_id": user_doc["_id"]}, {"$set": {"auth_token": token}})

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
        {"message": "Login successful", "auth_token": token, "user_id": str(user_doc["_id"])}
    )


@app.get("/profile/<user_id>")
def get_profile(user_id):
    user_doc = db["users"].find_one({"_id": ObjectId(user_id)})
    if not user_doc:
        return jsonify({"error": "user_not_found"}), 404

    profile = user_doc.get("profile", {})
    return jsonify(
        {
            "username": user_doc["username"],
            "email": user_doc["email"],
            "bio": profile.get("bio", ""),
            "avatar_url": profile.get("avatar_url", ""),
            "wishlist": profile.get("wishlist", []),
            "library": profile.get("library", []),
        }
    )


@app.post("/profile/<user_id>/update")
def update_profile(user_id):
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


@app.post("/profile/<user_id>/library/add")
def add_to_library(user_id):
    data = request.json or {}

    # Validate input
    if not all([data.get("id"), data.get("title"), data.get("type")]):
        return jsonify({"error": "missing_fields"}), 400

    media = {
        "id": data.get("id"),
        "title": data.get("title"),
        "type": data.get("type"),
        "year": data.get("year", ""),
        "coverUrl": data.get("coverUrl", ""),
    }

    # Make sure profile exists and library exists
    db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {
            "$setOnInsert": {
                "profile": {"bio": "", "avatar_url": "", "wishlist": [], "library": []}
            },
        },
        upsert=True,
    )

    # Push to library
    result = db["users"].update_one(
        {"_id": ObjectId(user_id)}, {"$push": {"profile.library": media}}
    )

    if result.modified_count == 0:
        return jsonify({"error": "user_not_found"}), 404

    return jsonify({"message": "Added to watchlist", "item": media})


@app.get("/profile/<user_id>/library")
def get_library(user_id):
    user_doc = db["users"].find_one(
        {"_id": ObjectId(user_id)}, {"_id": 0, "profile.library": 1}
    )
    if not user_doc:
        return jsonify({"error": "User not found"}), 404
    return jsonify(user_doc.get("profile", {}).get("library", []))


@app.get("/profile/<user_id>/ratings")
def get_user_ratings(user_id):
    # Convert string → ObjectId if valid
    try:
        uid = ObjectId(user_id)
    except Exception:
        uid = user_id  # fallback for non-ObjectId IDs

    ratings = list(db["ratings"].find({"user_id": uid}))

    fixed = []
    for r in ratings:
        fixed.append(
            {
                "rating_id": str(r["_id"]),
                "media_id": str(r["media_id"]),
                "title": r.get("title", ""),
                "cover_url": r.get("cover_url", ""),
                "type": r.get("type", ""),
                "year": r.get("year", ""),
                "stars": r.get("stars"),
                "review_text": r.get("review_text", ""),
                "date_created": r.get("date_created"),
            }
        )

    return jsonify(fixed), 200


# ---------- IGDB / OMDB SEARCH ----------

def get_access_token() -> str:
    now = time.time()
    if _token_cache["value"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["value"]
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    r = requests.post(url, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    _token_cache["value"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)
    return _token_cache["value"]


def igdb_search_games(query: str, token: str):
    url = "https://api.igdb.com/v4/games"
    headers = {"Client-ID": CLIENT_ID, "Authorization": f"Bearer {token}"}
    body = (
        f'search "{query}"; '
        "fields name, first_release_date, platforms.name, summary, cover.image_id; "
        "limit 12;"
    )
    r = requests.post(url, headers=headers, data=body, timeout=20)
    r.raise_for_status()
    return r.json()


def fmt_unix_date(ts):
    if not ts:
        return None
    try:
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return None


def cover_url(image_id):
    return (
        f"https://images.igdb.com/igdb/image/upload/t_cover_small_2x/{image_id}.jpg"
        if image_id
        else "https://placehold.co/200x280?text=No+Cover"
    )


@app.get("/search")
def search():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    try:
        token = get_access_token()
        raw = igdb_search_games(q, token)
        items = []
        for g in raw:
            items.append(
                {
                    "id": g.get("id"),
                    "title": g.get("name"),
                    "year": fmt_unix_date(g.get("first_release_date")) or "—",
                    "platforms": [
                        p.get("name")
                        for p in (g.get("platforms") or [])
                        if p.get("name")
                    ],
                    "summary": g.get("summary") or "No summary available.",
                    "coverUrl": cover_url((g.get("cover") or {}).get("image_id")),
                    "type": "Game",
                }
            )
        return jsonify(items)
    except requests.HTTPError as e:
        return jsonify({"error": "igdb_http_error", "detail": str(e)}), 502
    except Exception as e:
        return jsonify({"error": "server_error", "detail": str(e)}), 500


def omdb_search_movies(query: str):
    url = f"https://www.omdbapi.com/?apikey={OMDB_API_KEY}&s={query}"
    r = requests.get(url, timeout=15)
    r.raise_for_status()
    data = r.json()
    if data.get("Response") != "True":
        return []
    results = []
    for m in data.get("Search", []):
        results.append(
            {
                "id": m.get("imdbID"),
                "title": m.get("Title"),
                "year": m.get("Year"),
                "platforms": ["Theaters", "Streaming"],
                "summary": "No summary available.",
                "coverUrl": m.get("Poster")
                if m.get("Poster") != "N/A"
                else "https://placehold.co/200x280?text=No+Cover",
                "type": "Movie",
            }
        )
    return results


@app.get("/movies")
def movies():
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])
    try:
        results = omdb_search_movies(q)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": "server_error", "detail": str(e)}), 500


# ---------- RATINGS ----------

@app.post("/ratings")
def submit_rating():
    data = request.json or {}
    user_id = data.get("user_id")
    media_id = str(data.get("media_id"))
    stars = data.get("stars")
    review_text = data.get("review_text", "")
    if not all([user_id, media_id, stars]):
        return jsonify({"error": "missing_fields"}), 400

    # normalize user_id for existing check
    try:
        uid = ObjectId(user_id)
    except Exception:
        uid = user_id

    existing = db["ratings"].find_one({"user_id": uid, "media_id": media_id})
    if existing:
        return jsonify(
            {
                "error": "already_rated",
                "rating_id": str(existing["_id"]),
            }
        ), 409

    rating = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "media_id": str(media_id),
        "title": data.get("title", ""),
        "cover_url": data.get("cover_url", ""),
        "type": data.get("type", ""),
        "year": data.get("year", ""),
        "stars": int(stars),
        "review_text": review_text,
        "date_created": datetime.utcnow(),
    }
    result = db["ratings"].insert_one(rating)
    return jsonify({"rating_id": str(result.inserted_id)}), 201


@app.get("/ratings/<media_id>")
def get_ratings(media_id):
    query_id = ObjectId(media_id) if ObjectId.is_valid(media_id) else media_id
    ratings = list(db["ratings"].find({"media_id": query_id}))
    fixed = []
    for r in ratings:
        fixed.append(
            {
                "rating_id": str(r["_id"]),
                "user_id": str(r["user_id"]),
                "media_id": str(r["media_id"]),
                "title": r.get("title", ""),
                "cover_url": r.get("cover_url", ""),
                "type": r.get("type", ""),
                "year": r.get("year", ""),
                "stars": r.get("stars"),
                "review_text": r.get("review_text", ""),
                "date_created": r.get("date_created"),
            }
        )
    return jsonify(fixed), 200

@app.route("/profile/<user_id>/library/<item_id>", methods=["DELETE"])
def remove_library_item(user_id, item_id):
    # convert to int if needed
    try:
        item_id_int = int(item_id)
    except ValueError:
        item_id_int = item_id

    result = db["users"].update_one(
        {"_id": ObjectId(user_id)},
        {"$pull": {"profile.library": {"id": item_id_int}}}
    )
    if result.modified_count:
        return jsonify({"message": "Item removed"}), 200
    else:
        return jsonify({"error": "Item not found"}), 404


@app.delete("/ratings/<rating_id>")
def delete_rating(rating_id):
    try:
        rid = ObjectId(rating_id)
    except Exception:
        return jsonify({"error": "invalid_id"}), 400

    result = db["ratings"].delete_one({"_id": rid})

    if result.deleted_count == 0:
        return jsonify({"error": "not_found"}), 404

    return jsonify({"status": "deleted"}), 200


@app.put("/ratings/<rating_id>")
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



# ---------- MISC / HEALTH ----------

@app.get("/")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)

