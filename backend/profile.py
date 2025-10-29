class Profile:
    def __init__(self, profile_id, bio="", avatar_url=""):
        self.profile_id = profile_id
        self.bio = bio
        self.avatar_url = avatar_url
        self.wishlist = []
        self.library = []

    def add_to_wishlist(self, item):
        self.wishlist.append(item)
        print(f"Added {item.get_title()} to wishlist.")

    def add_to_library(self, item):
        self.library.append(item)
        print(f"Added {item.get_title()} to library.")

    def display_profile(self):
        print(f"Profile ID: {self.profile_id}")
        print(f"Bio: {self.bio}")
        print(f"Avatar URL: {self.avatar_url}")
        print("Wishlist:")
        for item in self.wishlist:
            print(f"- {item.get_title()}")
        print("Library:")
        for item in self.library:
            print(f"- {item.get_title()}")
