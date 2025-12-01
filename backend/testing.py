import requests
from pprint import pprint
from bson import ObjectId
import uuid
from pymongo import MongoClient
import os

BASE = "http://127.0.0.1:5000"

# Mongo setup for cleanup
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client = MongoClient(MONGO_URI)
db = client["retro_rewind"]

def unique_email():
    return f"tester_{uuid.uuid4().hex[:8]}@mail.com"

def test_health():
    r = requests.get(f"{BASE}/")
    assert r.status_code == 200
    assert r.json().get("ok") == True
    print("Health check passed.")

def test_register(email=None):
    user_data = {
        "username": "tester_edge",
        "email": email or unique_email(),
        "password": "pass1234"
    }
    r = requests.post(f"{BASE}/register", json=user_data)
    assert r.status_code == 201
    user_id = r.json()["user_id"]
    print("Register passed.")
    return user_id, user_data["email"]

def test_register_duplicate(email):
    user_data = {
        "username": "tester_edge",
        "email": email,
        "password": "pass1234"
    }
    r = requests.post(f"{BASE}/register", json=user_data)
    assert r.status_code == 400
    assert r.json()["error"] == "email_exists"
    print("Duplicate registration check passed.")

def test_register_missing_fields():
    r = requests.post(f"{BASE}/register", json={"username": "noemail"})
    assert r.status_code == 400
    assert r.json()["error"] == "missing_fields"
    print("Register missing fields check passed.")

def test_login(user_email, password):
    r = requests.post(f"{BASE}/login", json={"email": user_email, "password": password})
    assert r.status_code == 200
    token = r.json()["auth_token"]
    user_id = r.json()["user_id"]
    print("Login passed.")
    return token, user_id

def test_login_invalid():
    r = requests.post(f"{BASE}/login", json={"email": "fake@mail.com", "password": "123"})
    assert r.status_code == 401
    print("Login invalid credentials check passed.")

def test_login_missing_fields():
    r = requests.post(f"{BASE}/login", json={"email": "test@mail.com"})
    assert r.status_code == 400
    assert r.json()["error"] == "missing_fields"
    print("Login missing fields check passed.")

def test_profile_get(user_id):
    r = requests.get(f"{BASE}/profile/{user_id}")
    assert r.status_code == 200
    pprint(r.json())
    print("Profile GET passed.")

def test_profile_get_invalid():
    fake_id = str(ObjectId())
    r = requests.get(f"{BASE}/profile/{fake_id}")
    assert r.status_code == 404
    print("Profile GET invalid ID check passed.")

def test_profile_update(user_id):
    r = requests.post(f"{BASE}/profile/{user_id}/update", json={"bio": "Edge case bio"})
    assert r.status_code == 200
    print("Profile update passed.")

def test_library_add(user_id):
    media = {"id": "999", "title": "Test Game", "type": "Game", "year": "2025"}
    r = requests.post(f"{BASE}/profile/{user_id}/library/add", json=media)
    assert r.status_code == 200
    pprint(r.json())
    print("Library add passed.")

def test_library_add_missing_fields(user_id):
    r = requests.post(f"{BASE}/profile/{user_id}/library/add", json={"id": "2"})
    assert r.status_code == 400
    assert r.json()["error"] == "missing_fields"
    print("Library add missing fields check passed.")

def test_library_get(user_id):
    r = requests.get(f"{BASE}/profile/{user_id}/library")
    assert r.status_code == 200
    pprint(r.json())
    print("Library GET passed.")

def test_library_delete(user_id, item_id="999"):
    r = requests.delete(f"{BASE}/profile/{user_id}/library/{item_id}")
    assert r.status_code == 200
    print("Library delete passed.")

def test_library_delete_nonexistent(user_id):
    r = requests.delete(f"{BASE}/profile/{user_id}/library/doesnotexist")
    assert r.status_code == 404
    print("Library delete nonexistent check passed.")

def test_ratings_submit(user_id):
    rating_data = {"user_id": user_id, "media_id": "999", "stars": 5, "review_text": "Great!"}
    r = requests.post(f"{BASE}/ratings", json=rating_data)
    assert r.status_code == 201
    rating_id = r.json()["rating_id"]
    print("Rating submit passed.")
    return rating_id

def test_ratings_submit_duplicate(user_id):
    rating_data = {"user_id": user_id, "media_id": "999", "stars": 5}
    r = requests.post(f"{BASE}/ratings", json=rating_data)
    assert r.status_code == 409
    print("Rating duplicate submission check passed.")

def test_ratings_get(media_id):
    r = requests.get(f"{BASE}/ratings/{media_id}")
    assert r.status_code == 200
    pprint(r.json())
    print("Ratings GET passed.")

def test_ratings_update(rating_id):
    r = requests.put(f"{BASE}/ratings/{rating_id}", json={"stars": 4, "review_text": "Updated review"})
    assert r.status_code == 200
    print("Ratings update passed.")

def test_ratings_update_invalid():
    r = requests.put(f"{BASE}/ratings/invalid_id", json={"stars": 3})
    assert r.status_code == 400
    print("Ratings update invalid ID check passed.")

def test_ratings_delete(rating_id):
    r = requests.delete(f"{BASE}/ratings/{rating_id}")
    assert r.status_code == 200
    print("Ratings delete passed.")

def test_ratings_delete_invalid():
    r = requests.delete(f"{BASE}/ratings/invalid_id")
    assert r.status_code == 400
    print("Ratings delete invalid ID check passed.")

def test_search():
    r = requests.get(f"{BASE}/search?q=Halo")
    assert r.status_code == 200
    pprint(r.json())
    print("Search passed.")

def test_search_empty():
    r = requests.get(f"{BASE}/search?q=")
    assert r.status_code == 200
    assert r.json() == []
    print("Search empty query check passed.")

def test_movies():
    r = requests.get(f"{BASE}/movies?q=Inception")
    assert r.status_code == 200
    pprint(r.json())
    print("Movies search passed.")

def test_movies_empty():
    r = requests.get(f"{BASE}/movies?q=")
    assert r.status_code == 200
    assert r.json() == []
    print("Movies empty query check passed.")

def cleanup(user_email, user_id):
    # Remove ratings
    db["ratings"].delete_many({"user_id": ObjectId(user_id)})
    # Remove user
    db["users"].delete_one({"_id": ObjectId(user_id)})
    print("Cleanup complete.")

def run_all_tests():
    test_health()
    test_register_missing_fields()
    user_id, email = test_register()
    test_register_duplicate(email)
    token, user_id = test_login(email, "pass1234")
    test_login_invalid()
    test_login_missing_fields()
    test_profile_get(user_id)
    test_profile_get_invalid()
    test_profile_update(user_id)
    test_library_add(user_id)
    test_library_add_missing_fields(user_id)
    test_library_get(user_id)
    test_library_delete(user_id)
    test_library_delete_nonexistent(user_id)
    rating_id = test_ratings_submit(user_id)
    test_ratings_submit_duplicate(user_id)
    test_ratings_get("999")
    test_ratings_update(rating_id)
    test_ratings_update_invalid()
    test_ratings_delete(rating_id)
    test_ratings_delete_invalid()
    test_search()
    test_search_empty()
    test_movies()
    test_movies_empty()
    cleanup(email, user_id)
    print("\nAll edge case tests passed successfully.")

if __name__ == "__main__":
    run_all_tests()
