from profile import Profile 

class User:
    def __init__(self, user_id, username, email, password):
        self.user_id = user_id
        self.username = username
        self.email = email
        self.password_hash = password  # For simplicity, plaintext for now
        self.auth_token = ""
        self.profile = Profile(user_id)  # One-to-one relationship

    # Methods
    def register_user(self):
        print(f"Registering user: {self.username}")
        return True

    def login(self, password):
        if password == self.password_hash:
            self.auth_token = f"token_{self.user_id}"
            print(f"User {self.username} logged in successfully!")
            return True
        else:
            print(f"Login failed for user {self.username}. Incorrect password.")
            return False

    def logout(self):
        print(f"User {self.username} logged out.")
        self.auth_token = ""

    def update_profile(self, new_username, new_email):
        self.username = new_username
        self.email = new_email
        print(f"Profile updated for {self.user_id}.")

    def display_info(self):
        print(f"User ID: {self.user_id}")
        print(f"Username: {self.username}")
        print(f"Email: {self.email}")
        print(f"Authenticated: {'Yes' if self.auth_token else 'No'}")
        print("Profile Info:")
        self.profile.display_profile()
