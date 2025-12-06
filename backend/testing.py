"""
Comprehensive Backend Testing Suite
Run with: python testing.py
"""

import uuid
from bson import ObjectId
from pymongo import MongoClient
import os
from app import create_app

# Setup
BASE = "http://127.0.0.1:5000"
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
client_db = MongoClient(MONGO_URI)
db = client_db["retro_rewind"]

# Create Flask test client
app = create_app()
app.config['TESTING'] = True
client = app.test_client()

def unique_email():
    return f"tester_{uuid.uuid4().hex[:8]}@mail.com"

# ==================== HEALTH CHECK ====================
def test_health():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json.get("ok") == True
    print("✓ Health check passed")

def test_health_wrong_method():
    r = client.post("/")
    assert r.status_code == 405
    print("✓ Health check wrong method passed")

# ==================== REGISTRATION ====================
def test_register(email=None):
    user_data = {
        "username": "tester_edge",
        "email": email or unique_email(),
        "password": "pass1234"
    }
    r = client.post("/register", json=user_data)
    assert r.status_code == 201
    user_id = r.json["user_id"]
    print("✓ Register passed")
    return user_id, user_data["email"]

def test_register_duplicate(email):
    user_data = {
        "username": "tester_edge",
        "email": email,
        "password": "pass1234"
    }
    r = client.post("/register", json=user_data)
    assert r.status_code == 400
    assert r.json["error"] == "email_exists"
    print("✓ Register duplicate check passed")

def test_register_missing_fields():
    r = client.post("/register", json={"username": "noemail"})
    assert r.status_code == 400
    assert r.json["error"] == "missing_fields"
    print("✓ Register missing fields check passed")

def test_register_missing_email():
    r = client.post("/register", json={"username": "test", "password": "pass"})
    assert r.status_code == 400
    assert r.json["error"] == "missing_fields"
    print("✓ Register missing email passed")

def test_register_missing_password():
    r = client.post("/register", json={"username": "test", "email": "test@test.com"})
    assert r.status_code == 400
    assert r.json["error"] == "missing_fields"
    print("✓ Register missing password passed")

def test_register_empty_json():
    r = client.post("/register", json={})
    assert r.status_code == 400
    print("✓ Register empty JSON passed")

def test_register_special_chars():
    r = client.post("/register", json={
        "username": "test@user#123",
        "email": unique_email(),
        "password": "pass123"
    })
    assert r.status_code == 201
    print("✓ Register special characters passed")

def test_register_long_username():
    r = client.post("/register", json={
        "username": "a" * 200,
        "email": unique_email(),
        "password": "pass123"
    })
    assert r.status_code == 201
    print("✓ Register long username passed")

# ==================== LOGIN ====================
def test_login(user_email, password):
    r = client.post("/login", json={"email": user_email, "password": password})
    assert r.status_code == 200
    token = r.json["auth_token"]
    user_id = r.json["user_id"]
    print("✓ Login passed")
    return token, user_id

def test_login_invalid():
    r = client.post("/login", json={"email": "fake@mail.com", "password": "123"})
    assert r.status_code == 401
    print("✓ Login invalid credentials check passed")

def test_login_missing_fields():
    r = client.post("/login", json={"email": "test@mail.com"})
    assert r.status_code == 400
    assert r.json["error"] == "missing_fields"
    print("✓ Login missing fields check passed")

def test_login_missing_password():
    r = client.post("/login", json={"email": "test@test.com"})
    assert r.status_code == 400
    print("✓ Login missing password passed")

def test_login_missing_email():
    r = client.post("/login", json={"password": "pass"})
    assert r.status_code == 400
    print("✓ Login missing email passed")

def test_login_wrong_password(user_email):
    r = client.post("/login", json={"email": user_email, "password": "wrongpass"})
    assert r.status_code == 401
    print("✓ Login wrong password passed")

def test_login_empty_json():
    r = client.post("/login", json={})
    assert r.status_code == 400
    print("✓ Login empty JSON passed")

# ==================== PROFILE ====================
def test_profile_get(user_id):
    r = client.get(f"/profile/{user_id}")
    assert r.status_code == 200
    assert "username" in r.json
    assert "email" in r.json
    print("✓ Profile GET passed")

def test_profile_get_invalid():
    fake_id = str(ObjectId())
    r = client.get(f"/profile/{fake_id}")
    assert r.status_code == 404
    print("✓ Profile GET invalid ID check passed")

def test_profile_get_malformed_id():
    r = client.get("/profile/invalid_id_123")
    assert r.status_code in [400, 404, 500]
    print("✓ Profile GET malformed ID passed")

def test_profile_update(user_id):
    r = client.post(f"/profile/{user_id}/update", json={"bio": "Test bio"})
    assert r.status_code == 200
    print("✓ Profile update passed")

def test_profile_update_username(user_id):
    r = client.post(f"/profile/{user_id}/update", json={"username": "newname"})
    assert r.status_code == 200
    profile = client.get(f"/profile/{user_id}")
    assert profile.json["username"] == "newname"
    print("✓ Profile update username passed")

def test_profile_update_avatar(user_id):
    r = client.post(f"/profile/{user_id}/update", json={"avatar_url": "http://test.com/avatar.jpg"})
    assert r.status_code == 200
    print("✓ Profile update avatar passed")

def test_profile_update_multiple_fields(user_id):
    r = client.post(f"/profile/{user_id}/update", json={
        "username": "multiuser",
        "bio": "Multi bio",
        "avatar_url": "http://test.com/new.jpg"
    })
    assert r.status_code == 200
    print("✓ Profile update multiple fields passed")

# ==================== LIBRARY ====================
def test_library_add(user_id):
    media = {"id": "999", "title": "Test Game", "type": "Game", "year": "2025"}
    r = client.post(f"/profile/{user_id}/library/add", json=media)
    assert r.status_code == 201
    print("✓ Library add passed")

def test_library_add_missing_fields(user_id):
    r = client.post(f"/profile/{user_id}/library/add", json={"id": "2"})
    assert r.status_code == 400
    assert r.json["error"] == "missing_fields"
    print("✓ Library add missing fields check passed")

def test_library_add_missing_id(user_id):
    r = client.post(f"/profile/{user_id}/library/add", json={"title": "Game", "type": "Game"})
    assert r.status_code == 400
    print("✓ Library add missing ID passed")

def test_library_add_missing_title(user_id):
    r = client.post(f"/profile/{user_id}/library/add", json={"id": "123", "type": "Game"})
    assert r.status_code == 400
    print("✓ Library add missing title passed")

def test_library_add_missing_type(user_id):
    r = client.post(f"/profile/{user_id}/library/add", json={"id": "123", "title": "Game"})
    assert r.status_code == 400
    print("✓ Library add missing type passed")

def test_library_add_duplicate(user_id):
    media = {"id": "dup123", "title": "Dup Game", "type": "Game"}
    client.post(f"/profile/{user_id}/library/add", json=media)
    r = client.post(f"/profile/{user_id}/library/add", json=media)
    assert r.status_code == 409
    print("✓ Library add duplicate check passed")

def test_library_get(user_id):
    r = client.get(f"/profile/{user_id}/library")
    assert r.status_code == 200
    assert isinstance(r.json, list)
    print("✓ Library GET passed")

def test_library_get_empty():
    email = unique_email()
    reg = client.post("/register", json={"username": "empty", "email": email, "password": "pass"})
    user_id = reg.json["user_id"]
    r = client.get(f"/profile/{user_id}/library")
    assert r.status_code == 200
    assert r.json == []
    print("✓ Library GET empty passed")

def test_library_get_invalid_user():
    fake_id = str(ObjectId())
    r = client.get(f"/profile/{fake_id}/library")
    assert r.status_code == 404
    print("✓ Library GET invalid user passed")

def test_library_delete(user_id, item_id="999"):
    r = client.delete(f"/profile/{user_id}/library/{item_id}")
    assert r.status_code == 200
    print("✓ Library delete passed")

def test_library_delete_nonexistent(user_id):
    r = client.delete(f"/profile/{user_id}/library/doesnotexist")
    assert r.status_code == 404
    print("✓ Library delete nonexistent check passed")

def test_library_delete_invalid_user():
    fake_id = str(ObjectId())
    r = client.delete(f"/profile/{fake_id}/library/item123")
    assert r.status_code == 404
    print("✓ Library delete invalid user passed")

# ==================== RATINGS ====================
def test_ratings_submit(user_id):
    rating_data = {"user_id": user_id, "media_id": "999", "stars": 5, "review_text": "Great!"}
    r = client.post("/ratings", json=rating_data)
    assert r.status_code == 201
    rating_id = r.json["rating_id"]
    print("✓ Rating submit passed")
    return rating_id

def test_ratings_submit_duplicate(user_id):
    rating_data = {"user_id": user_id, "media_id": "999", "stars": 5}
    r = client.post("/ratings", json=rating_data)
    assert r.status_code == 409
    print("✓ Rating duplicate submission check passed")

def test_ratings_submit_missing_user_id():
    r = client.post("/ratings", json={"media_id": "123", "stars": 5})
    assert r.status_code == 400
    print("✓ Rating missing user_id passed")

def test_ratings_submit_missing_media_id(user_id):
    r = client.post("/ratings", json={"user_id": user_id, "stars": 5})
    assert r.status_code == 400
    print("✓ Rating missing media_id passed")

def test_ratings_submit_missing_stars(user_id):
    r = client.post("/ratings", json={"user_id": user_id, "media_id": "123"})
    assert r.status_code == 400
    print("✓ Rating missing stars passed")

def test_ratings_get(media_id):
    r = client.get(f"/ratings/{media_id}")
    assert r.status_code == 200
    assert isinstance(r.json, list)
    print("✓ Ratings GET passed")

def test_ratings_get_no_ratings():
    r = client.get("/ratings/nonexistent_media_xyz")
    assert r.status_code == 200
    assert r.json == []
    print("✓ Ratings GET no ratings passed")

def test_ratings_update(rating_id):
    r = client.put(f"/ratings/{rating_id}", json={"stars": 4, "review_text": "Updated"})
    assert r.status_code == 200
    print("✓ Ratings update passed")

def test_ratings_update_invalid():
    r = client.put("/ratings/invalid_id", json={"stars": 3})
    assert r.status_code == 400
    print("✓ Ratings update invalid ID check passed")

def test_ratings_update_missing_stars(rating_id):
    r = client.put(f"/ratings/{rating_id}", json={"review_text": "Just text"})
    assert r.status_code == 400
    print("✓ Ratings update missing stars passed")

def test_ratings_delete(rating_id):
    r = client.delete(f"/ratings/{rating_id}")
    assert r.status_code == 200
    assert r.json["status"] == "deleted"
    print("✓ Ratings delete passed")

def test_ratings_delete_invalid():
    r = client.delete("/ratings/invalid_id")
    assert r.status_code == 400
    print("✓ Ratings delete invalid ID check passed")

def test_get_user_ratings(user_id):
    r = client.get(f"/profile/{user_id}/ratings")
    assert r.status_code == 200
    assert isinstance(r.json, list)
    print("✓ Get user ratings passed")

# ==================== SEARCH ====================
def test_search():
    r = client.get("/search?q=Halo")
    assert r.status_code == 200
    assert isinstance(r.json, list)
    print("✓ Search passed")

def test_search_empty():
    r = client.get("/search?q=")
    assert r.status_code == 200
    assert r.json == []
    print("✓ Search empty query check passed")

def test_search_no_param():
    r = client.get("/search")
    assert r.status_code == 200
    assert r.json == []
    print("✓ Search no param passed")

def test_search_special_chars():
    r = client.get("/search?q=Halo%3A+Combat")
    assert r.status_code == 200
    print("✓ Search special characters passed")

def test_movies():
    r = client.get("/movies?q=Inception")
    assert r.status_code == 200
    assert isinstance(r.json, list)
    print("✓ Movies search passed")

def test_movies_empty():
    r = client.get("/movies?q=")
    assert r.status_code == 200
    assert r.json == []
    print("✓ Movies empty query check passed")

def test_movies_no_param():
    r = client.get("/movies")
    assert r.status_code == 200
    assert r.json == []
    print("✓ Movies no param passed")

# ==================== ERROR HANDLING ====================
def test_invalid_route():
    r = client.get("/nonexistent/route")
    assert r.status_code == 404
    print("✓ Invalid route passed")

def test_method_not_allowed():
    r = client.delete("/register")
    assert r.status_code == 405
    print("✓ Method not allowed passed")

# ==================== CLEANUP ====================
def cleanup(user_email, user_id):
    try:
        db["ratings"].delete_many({"user_id": ObjectId(user_id)})
        db["users"].delete_one({"_id": ObjectId(user_id)})
        print("✓ Cleanup complete")
    except Exception as e:
        print(f"⚠ Cleanup skipped (DB not available): {type(e).__name__}")

# ==================== RUN ALL TESTS ====================
def run_all_tests():
    print("\n" + "="*60)
    print("RUNNING COMPREHENSIVE BACKEND TESTS")
    print("="*60 + "\n")
    
    test_count = 0
    
    # Health checks
    print("--- Health Check Tests ---")
    test_health(); test_count += 1
    test_health_wrong_method(); test_count += 1
    
    # Registration tests
    print("\n--- Registration Tests ---")
    test_register_missing_fields(); test_count += 1
    test_register_missing_email(); test_count += 1
    test_register_missing_password(); test_count += 1
    test_register_empty_json(); test_count += 1
    test_register_special_chars(); test_count += 1
    test_register_long_username(); test_count += 1
    user_id, email = test_register(); test_count += 1
    test_register_duplicate(email); test_count += 1
    
    # Login tests
    print("\n--- Login Tests ---")
    token, user_id = test_login(email, "pass1234"); test_count += 1
    test_login_invalid(); test_count += 1
    test_login_missing_fields(); test_count += 1
    test_login_missing_password(); test_count += 1
    test_login_missing_email(); test_count += 1
    test_login_wrong_password(email); test_count += 1
    test_login_empty_json(); test_count += 1
    
    # Profile tests
    print("\n--- Profile Tests ---")
    test_profile_get(user_id); test_count += 1
    test_profile_get_invalid(); test_count += 1
    test_profile_get_malformed_id(); test_count += 1
    test_profile_update(user_id); test_count += 1
    test_profile_update_username(user_id); test_count += 1
    test_profile_update_avatar(user_id); test_count += 1
    test_profile_update_multiple_fields(user_id); test_count += 1
    
    # Library tests
    print("\n--- Library Tests ---")
    test_library_add(user_id); test_count += 1
    test_library_add_missing_fields(user_id); test_count += 1
    test_library_add_missing_id(user_id); test_count += 1
    test_library_add_missing_title(user_id); test_count += 1
    test_library_add_missing_type(user_id); test_count += 1
    test_library_add_duplicate(user_id); test_count += 1
    test_library_get(user_id); test_count += 1
    test_library_get_empty(); test_count += 1
    test_library_get_invalid_user(); test_count += 1
    test_library_delete(user_id); test_count += 1
    test_library_delete_nonexistent(user_id); test_count += 1
    test_library_delete_invalid_user(); test_count += 1
    
    # Ratings tests
    print("\n--- Ratings Tests ---")
    rating_id = test_ratings_submit(user_id); test_count += 1
    test_ratings_submit_duplicate(user_id); test_count += 1
    test_ratings_submit_missing_user_id(); test_count += 1
    test_ratings_submit_missing_media_id(user_id); test_count += 1
    test_ratings_submit_missing_stars(user_id); test_count += 1
    test_ratings_get("999"); test_count += 1
    test_ratings_get_no_ratings(); test_count += 1
    test_ratings_update(rating_id); test_count += 1
    test_ratings_update_invalid(); test_count += 1
    test_ratings_update_missing_stars(rating_id); test_count += 1
    test_ratings_delete(rating_id); test_count += 1
    test_ratings_delete_invalid(); test_count += 1
    test_get_user_ratings(user_id); test_count += 1
    
    # Search tests
    print("\n--- Search Tests ---")
    test_search(); test_count += 1
    test_search_empty(); test_count += 1
    test_search_no_param(); test_count += 1
    test_search_special_chars(); test_count += 1
    test_movies(); test_count += 1
    test_movies_empty(); test_count += 1
    test_movies_no_param(); test_count += 1
    
    # Error handling tests
    print("\n--- Error Handling Tests ---")
    test_invalid_route(); test_count += 1
    test_method_not_allowed(); test_count += 1
    
    # Cleanup
    print("\n--- Cleanup ---")
    cleanup(email, user_id)
    
    print("\n" + "="*60)
    print(f"✅ ALL {test_count} TESTS PASSED SUCCESSFULLY!")
    print("="*60 + "\n")

if __name__ == "__main__":
    run_all_tests()
