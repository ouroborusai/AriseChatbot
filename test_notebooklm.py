import json
import os
import requests

# Try to use the cookies from the cached auth file
auth_file = os.path.expanduser("~/.notebooklm-mcp/auth.json")
if os.path.exists(auth_file):
    with open(auth_file, "r") as f:
        auth_data = json.load(f)
        cookies = auth_data.get("cookies", {})
        
    print(f"Loaded {len(cookies)} cookies from {auth_file}")
    
    # Try a simple request to list notebooks (mimicking the internal logic)
    # The MCP uses a specific GraphQL or internal API. 
    # Let's try to just hit the home page and see if we get a 200 or 401.
    session = requests.Session()
    for name, value in cookies.items():
        session.cookies.set(name, value, domain=".google.com")
        
    response = session.get("https://notebooklm.google.com/api/v1/notebooks", timeout=10)
    print(f"Status Code: {response.status_code}")
    try:
        print(f"Response JSON: {response.json()[:2]}...") # Show a bit of JSON
    except:
        print(f"Response Text (first 100 chars): {response.text[:100]}")
else:
    print(f"Auth file not found at {auth_file}")
