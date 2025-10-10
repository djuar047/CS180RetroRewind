import requests


# copied from the getting started page
def get_access_token():
    url = "https://id.twitch.tv/oauth2/token"
    params = {
        "client_id": CLIENT_ID,
        "client_secret": CLIENT_SECRET,
        "grant_type": "client_credentials"
    }
    response = requests.post(url, params=params)
    response.raise_for_status()
    access_token = response.json()["access_token"]
    return access_token
def search_games(query, token):
    url = "https://api.igdb.com/v4/games"
    headers = {
        "Client-ID": CLIENT_ID,
        "Authorization": f"Bearer {token}"
    }

    # IGDB API
    #10 results
    body = f'search "{query}"; fields name, first_release_date, platforms.name, summary; limit 10;'
    response = requests.post(url, headers=headers, data=body)
    response.raise_for_status()
    return response.json()

# search
if __name__ == "__main__":
    token = get_access_token()
    query = input("Enter a game name to search: ")
    results = search_games(query, token)

    if not results:
        print("No results found.")
    else:
        for game in results:
            print("=" * 50)
            print(f"{game.get('name', 'Unknown')}")
            if "first_release_date" in game:
                from datetime import datetime
                date = datetime.utcfromtimestamp(game["first_release_date"]).strftime("%Y-%m-%d")
                print(f"Release Date: {date}")
            if "platforms" in game:
                platforms = [p["name"] for p in game["platforms"] if "name" in p]
                print(f"Platforms: {', '.join(platforms)}")
            print(f"Summary: {game.get('summary', 'No summary available.')}")