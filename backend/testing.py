import requests

url = "http://127.0.0.1:5000/register"
data = {
    "username": "allen",
    "email": "allen@test.com",
    "password": "mypassword"
}

res = requests.post(url, json=data)
print(res.json())

url = "http://127.0.0.1:5000/login"
data = {"email": "allen@test.com", "password": "mypassword"}

res = requests.post(url, json=data)
print(res.json())
