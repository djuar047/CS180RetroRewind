from authorization import create_user, delete_user

# testing email and password
TEST_EMAIL = "djuar047@ucr.com"
TEST_PASSWORD = "MonkeysInSpaaaaaace"

# creating new user......
print(" Creating user...")
user = create_user(TEST_EMAIL, TEST_PASSWORD)

if user:
    print("User was created successfully!")
    print("UID:", user.uid)

    # delete the user once the test is successful
    print("Deleting the user...")
    delete_user(user.uid)
else:
    print("Could not create a new user :(")
