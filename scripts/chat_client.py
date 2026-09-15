import requests

BASE_URL = "http://127.0.0.1:8000/api"

print("--- SAGE Terminal Client ---")
username = input("Username [default: test_runner]: ").strip() or "test_runner"
password = input("Password [default: testpass123]: ").strip() or "testpass123"

# 1. Fetch JWT Access Token
token_resp = requests.post(f"{BASE_URL}/token/", json={
    "username": username,
    "password": password
})

if token_resp.status_code != 200:
    print(f"Login failed ({token_resp.status_code}): {token_resp.text}")
    exit()

# Extract token
access_token = token_resp.json().get("access")
print("Login successful!\nType 'quit' to exit.\n")

# Prepare Authorization Header
headers = {
    "Authorization": f"Bearer {access_token}"
}

# 2. Chat Session Loop
while True:
    user_msg = input("You: ").strip()
    if user_msg.lower() in ["quit", "exit"]:
        break
    if not user_msg:
        continue

    # POST request with Authorization header attached
    chat_resp = requests.post(
        f"{BASE_URL}/chat/",
        json={"message": user_msg},
        headers=headers
    )

    if chat_resp.status_code == 200:
        print(f"SAGE: {chat_resp.json().get('ai_response')}\n")
    else:
        print(f"Error ({chat_resp.status_code}): {chat_resp.text}\n")