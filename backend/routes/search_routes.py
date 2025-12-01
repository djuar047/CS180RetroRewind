# backend/routes/search_routes.py

import time
from datetime import datetime, timezone

import requests
from flask import Blueprint, request, jsonify

from config import CLIENT_ID, CLIENT_SECRET, OMDB_API_KEY

# Blueprint just for search-related routes
search_bp = Blueprint("search", __name__)

# Small cache so we don't ask Twitch/IGDB for a token every request
_token_cache = {"value": None, "expires_at": 0}


def get_access_token() -> str:
    """Get or refresh the IGDB OAuth token."""
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
    """Ask IGDB for games that match the search text."""
    url = "https://api.igdb.com/v4/games"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}",
    }
    body = (
        f'search "{query}"; '
        "fields name, first_release_date, platforms.name, summary, cover.image_id; "
        "limit 12;"
    )
    r = requests.post(url, headers=headers, data=body, timeout=20)
    r.raise_for_status()
    return r.json()


def fmt_unix_date(ts):
    """Turn IGDB's Unix timestamp into YYYY-MM-DD."""
    if not ts:
        return None
    try:
        return datetime.fromtimestamp(ts, tz=timezone.utc).strftime("%Y-%m-%d")
    except Exception:
        return None


def cover_url(image_id):
    """Build the IGDB cover URL or a placeholder."""
    return (
        f"https://images.igdb.com/igdb/image/upload/t_cover_small_2x/{image_id}.jpg"
        if image_id
        else "https://placehold.co/200x280?text=No+Cover"
    )


@search_bp.get("/search")
def search_games():
    """Search for games using IGDB."""
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
    """Ask OMDb for movies that match the search text."""
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
                "coverUrl": (
                    m.get("Poster")
                    if m.get("Poster") != "N/A"
                    else "https://placehold.co/200x280?text=No+Cover"
                ),
                "type": "Movie",
            }
        )
    return results


@search_bp.get("/movies")
def search_movies():
    """Search for movies using OMDb."""
    q = (request.args.get("q") or "").strip()
    if not q:
        return jsonify([])

    try:
        results = omdb_search_movies(q)
        return jsonify(results)
    except Exception as e:
        return jsonify({"error": "server_error", "detail": str(e)}), 500
