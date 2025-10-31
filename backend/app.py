# app.py
import os
import time
import requests
from datetime import datetime, timezone
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

# load the CLIENT_ID and CLIENT_SECRET from the .env file in the backend folder
load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")

# make sure both are actually set or stop the app
if not CLIENT_ID or not CLIENT_SECRET:
    raise RuntimeError("Set CLIENT_ID and CLIENT_SECRET in backend/.env (no quotes, no spaces).")

# set up the Flask web app + allow requests from our React frontend
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://127.0.0.1:5173"]}})

# store the access token here so we don’t have to request a new one every time
_token_cache = {"value": None, "expires_at": 0}


def get_access_token() -> str:
    """Get a Twitch access token for IGDB API (reuses one if it's still valid)."""
    now = time.time()
    # if we already have a valid token, just reuse it
    if _token_cache["value"] and _token_cache["expires_at"] > now + 60:
        return _token_cache["value"]

    # otherwise, request a new one from Twitch
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials",
    }
    r = requests.post(url, params=params, timeout=15)
    r.raise_for_status()
    data = r.json()
    # save token + when it expires
    _token_cache["value"] = data["access_token"]
    _token_cache["expires_at"] = now + data.get("expires_in", 3600)
    return _token_cache["value"]


def igdb_search_games(query: str, token: str):
    """Send a search request to IGDB for games matching the user’s search."""
    url = "https://api.igdb.com/v4/games"
    headers = {"Client-ID": CLIENT_ID, "Authorization": f"Bearer {token}"}
    # ask IGDB for name, release date, platforms, summary, and cover image
    body = f'''
      search "{query}";
      fields name, first_release_date, platforms.name, summary, cover.image_id;
      limit 12;
    '''
    r = requests.post(url, headers=headers, data=body, timeout=20)
    r.raise_for_status()
    return r.json()


def fmt_unix_date(ts):
    """Turn the weird timestamp (seconds since 1970) into a readable date."""
    if not ts:
        return None
    try:
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return None


def cover_url(image_id):
    """Build a full image URL from IGDB’s image ID (or use a placeholder)."""
    return (
        f"https://images.igdb.com/igdb/image/upload/t_cover_small_2x/{image_id}.jpg"
        if image_id else
        "https://placehold.co/200x280?text=No+Cover"
    )


@app.get("/search")
def search():
    """Main endpoint — frontend calls this when user searches for a game."""
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])

    try:
        # get a valid token + search IGDB
        token = get_access_token()
        raw = igdb_search_games(q, token)

        # clean up and format the results to match what React expects
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
        # if IGDB errors out (like rate limit or bad token)
        return jsonify({"error": "igdb_http_error", "detail": str(e)}), 502
    except Exception as e:
        # if something else breaks in our code
        return jsonify({"error": "server_error", "detail": str(e)}), 500


@app.get("/")
def health():
    """Simple test route to confirm backend is running."""
    return jsonify({"ok": True})


if __name__ == "__main__":
    # run the backend locally for development
    app.run(host="127.0.0.1", port=5000, debug=True)


