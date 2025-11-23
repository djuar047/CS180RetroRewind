from firebase_setup import auth


# New user 
def create_user(email, password):
    try:
        user = auth.create_user(
            email=email, password=password
        )
        print(f"Successfully create an account: {user.uid}")
        return user
    except Exception as e:
        print(f'Error creating user: {e}')
        return None

# Verify ID 
def verify_token(id_token):
    try:
        decoded_token= auth.verify_id_token(id_token)
        print(f"Token verified:", decoded_token['uid'])
        return decoded_token
    except Exception as e:
        print(f"Invalid token: {e}")
        return None

# Delete a user
def delete_user(uid):
    try:
        auth.delete_user(uid)
        print(f"User has been deleted!: {uid}")
    except Exception as e:
        print(f"Error deleting user: {e}") 