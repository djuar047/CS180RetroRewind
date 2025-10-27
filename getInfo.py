import requests
import os

class MediaItem:
    def __init__(self, db):
        self.db = db
        self.client_id = os.getenv("IGDB_CLIENT_ID")
        self.token = os.getenv("IGDB_ACCESS_TOKEN")

    def get_details(self, title):
        headers = {
            "Client-ID": self.client_id,
            "Authorization": f"Bearer {self.token}"
        }
        query = f'search "{title}"; fields name, first_release_date, genres.name, platforms.name; limit 1;'
        res = requests.post("https://api.igdb.com/v4/games", headers=headers, data=query)

        if res.status_code != 200:
            return None

        game_data = res.json()[0]
        media_doc = {
            "title": game_data["name"],
            "year": game_data.get("first_release_date"),
            "genre": [g["name"] for g in game_data.get("genres", [])],
            "platform": [p["name"] for p in game_data.get("platforms", [])],
            "type": "Game"
        }
        self.db.save("media_items", media_doc)
        return media_doc
