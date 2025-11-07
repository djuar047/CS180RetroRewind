import os
import time
import requests
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from pymongo import MongoClient
from firebase_setup import db, auth, bucket
from authorization import create_user, verify_token
from authorization_paths import auth_blueprint
from bson import ObjectId

# Routes
from routes.thread_routes import thread_bp
from routes.comment_routes import comment_bp
from user import User
from profile import Profile

# Load environment
load_dotenv()

# MongoDB setup
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

# Flask setup
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})
app.register_blueprint(thread_bp)
app.register_blueprint(comment_bp)

# Token cache for IGDB
_token_cache = {"value": None, "expires_at": 0}

# register the authorization routes
app.register_blueprint(auth_blueprint, url_prefix="/auth")
# Add a route to register a new user
@app.post("/register")
def register():
    data = request.json
    username = data.get("username")
    email = data.get("email")
    password = data.get("password")
    
    if not all([username, email, password]):
        return jsonify({"error": "missing_fields"}), 400

    # Check if email already exists
    if db["users"].find_one({"email": email}):
        return jsonify({"error": "email_exists"}), 400

    # Create user and profile
    user = User(user_id=str(ObjectId()), username=username, email=email, password=password)
    db["users"].insert_one({
        "_id": ObjectId(user.user_id),
        "username": user.username,
        "email": user.email,
        "password": user.password_hash,
        "profile": {"bio": user.profile.bio, "avatar_url": user.profile.avatar_url, "wishlist": [], "library": []}
    })

    return jsonify({"message": "User registered", "user_id": user.user_id}), 201


# Login route
@app.post("/login")
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not all([email, password]):
        return jsonify({"error": "missing_fields"}), 400

    user_doc = db["users"].find_one({"email": email})
    if not user_doc or user_doc["password"] != password:
        return jsonify({"error": "invalid_credentials"}), 401

    # create token
    token = f"token_{str(user_doc['_id'])}"
    db["users"].update_one({"_id": user_doc["_id"]}, {"$set": {"auth_token": token}})

    # push info to secondary database
    secondary_db["login_history"].insert_one({
        "user_id": str(user_doc["_id"]),
        "username": user_doc["username"],
        "email": user_doc["email"],
        "login_time": datetime.utcnow(),
        "auth_token": token
    })

    return jsonify({"message": "Login successful", "auth_token": token, "user_id": str(user_doc["_id"])})

# Get profile
@app.get("/profile/<user_id>")
def get_profile(user_id):
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
        "library": profile.get("library", [])
    })


# Update profile
@app.post("/profile/<user_id>/update")
def update_profile(user_id):
    data = request.json
    new_username = data.get("username")
    new_email = data.get("email")
    bio = data.get("bio")
    avatar_url = data.get("avatar_url")

    updates = {}
    if new_username: updates["username"] = new_username
    if new_email: updates["email"] = new_email
    if bio is not None: updates["profile.bio"] = bio
    if avatar_url is not None: updates["profile.avatar_url"] = avatar_url

    db["users"].update_one({"_id": ObjectId(user_id)}, {"$set": updates})
    return jsonify({"message": "Profile updated"})

def get_access_token() -> str:
    now = time.time()
    if _token_cache["value"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["value"]
    url = "https://id.twitch.tv/oauth2/token"
    params = {"client_id": CLIENT_ID, "client_secret": CLIENT_SECRET, "grant_type": "client_credentials"}
    r = requests.post(url, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    _token_cache["value"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)
    return _token_cache["value"]


def igdb_search_games(query: str, token: str):
    url = "https://api.igdb.com/v4/games"
    headers = {"Client-ID": CLIENT_ID, "Authorization": f"Bearer {token}"}
    body = f'search "{query}"; fields name, first_release_date, platforms.name, summary, cover.image_id; limit 12;'
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
            items.append({
                "id": g.get("id"),
                "title": g.get("name"),
                "year": fmt_unix_date(g.get("first_release_date")) or "—",
                "platforms": [p.get("name") for p in (g.get("platforms") or []) if p.get("name")],
                "summary": g.get("summary") or "No summary available.",
                "coverUrl": cover_url((g.get("cover") or {}).get("image_id")),
                "type": "Game",
            })
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
        results.append({
            "id": m.get("imdbID"),
            "title": m.get("Title"),
            "year": m.get("Year"),
            "platforms": ["Theaters", "Streaming"],
            "summary": "No summary available.",
            "coverUrl": m.get("Poster") if m.get("Poster") != "N/A" else "https://placehold.co/200x280?text=No+Cover",
            "type": "Movie",
        })
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


@app.post("/ratings")
def submit_rating():
    data = request.json
    user_id = data.get("user_id")
    media_id = data.get("media_id")
    stars = data.get("stars")
    review_text = data.get("review_text", "")
    if not all([user_id, media_id, stars]):
        return jsonify({"error": "missing_fields"}), 400

    rating = {
        "user_id": ObjectId(user_id) if ObjectId.is_valid(user_id) else user_id,
        "media_id": ObjectId(media_id) if ObjectId.is_valid(media_id) else media_id,
        "stars": int(stars),
        "review_text": review_text,
        "date_created": datetime.utcnow()
    }
    result = db["ratings"].insert_one(rating)
    return jsonify({"rating_id": str(result.inserted_id)}), 201


@app.get("/ratings/<media_id>")
def get_ratings(media_id):
    ratings = list(db["ratings"].find({"media_id": media_id}))
    for r in ratings:
        r["_id"] = str(r["_id"])
        r["user_id"] = str(r["user_id"])
    return jsonify(ratings)


@app.get("/")
def health():
    return jsonify({"ok": True})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)


db.collection("test").add({"hello": "world"})
