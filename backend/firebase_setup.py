import firebase_admin
from firebase_admin import credentials, firestore, auth, storage
import os

# Path to firebase super secret key 
cred_path = os.path.join(os.path.dirname(__file__), "retrorewindKey.json")
cred = credentials.Certificate(cred_path)

# initializing the firebase api
try:
    firebase_admin.initialize_app(cred, {
        "storageBucket": "retrorewind.appspot.com"
    })
    print("Firebase initialized successfully.")
except ValueError:
    print("Firebase already initialized.")


# Initialize the Firebase services
db = firestore.client()
bucket = storage.bucket()

# make sure everything works
print("Firebase initialized successfully.")

# Export 
__all__ = ["db", "auth", "bucket"]
