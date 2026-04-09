import urllib.request
import urllib.error
import json

url = "https://agro-soil-ai-innovation.onrender.com/api/auth/register"
payload = {
    "name": "Debug User",
    "phone": "8888888888",
    "email": "debug@test.com",
    "password": "Debug1234",
    "role": "farmer"
}

data = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})

try:
    res = urllib.request.urlopen(req)
    print("SUCCESS:", res.read().decode())
except urllib.error.HTTPError as e:
    print(f"HTTP Error {e.code}: {e.reason}")
    body = e.read().decode()
    print("Response body:", body)
except Exception as e:
    print(f"Other error: {e}")
