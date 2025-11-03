from user import User
from mediaitem import MediaItem

def display_menu():
    print("\n=== RetroRewind Menu ===")
    print("1. Create a new user")
    print("2. Login")
    print("3. View profile info")
    print("4. Add media to wishlist")
    print("5. Add media to library")
    print("6. Logout")
    # thread and comments??
    # im missing some stuff ngl
    print("0. Exit")

def main():
    print("Welcome to RetroRewind!")
    current_user = None

    while True:
        display_menu()
        choice = input("Enter your choice: ")

        if choice == "1":
            user_id = input("Enter user ID: ")
            username = input("Enter username: ")
            email = input("Enter email: ")
            password = input("Enter password: ")
            current_user = User(user_id, username, email, password)
            current_user.register_user()

        elif choice == "2":
            if current_user is None:
                print("You need to create a user first.")
                continue
            login_password = input("Enter password to login: ")
            current_user.login(login_password)

        elif choice == "3":
            if current_user:
                current_user.display_info()
            else:
                print("No user logged in.")

        elif choice == "4":
            if current_user:
                print("add to wishlist functionality not yet implemented")                #current_user.profile.add_to_wishlist()
            else:
                print("No user logged in.")

        elif choice == "5":
            if current_user:
                print("add to library functionality not yet implemented")
                #current_user.profile.add_to_library()
            else:
                print("No user logged in.")

        elif choice == "6":
            if current_user:
                current_user.logout()
            else:
                print("No user logged in.")

        elif choice == "0":
            print("Goodbye!")
            break

        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()
