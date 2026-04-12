import json
import os
import urllib.request
import urllib.parse

def load_env():
    with open(".env.local", "r") as f:
        for line in f:
            if "=" in line:
                key, val = line.strip().split("=", 1)
                os.environ[key] = val.strip('"').strip("'")

load_env()
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("Missing Supabase credentials!")
    exit(1)

# 1. Clear existing database of old mutated duplicates
print("Wiping old database entries...")
del_req = urllib.request.Request(
    f"{SUPABASE_URL}/rest/v1/players?id=not.is.null",
    headers={
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Prefer": "return=minimal"
    },
    method="DELETE"
)
try:
    urllib.request.urlopen(del_req)
    print("Database wiped clean!")
except urllib.error.HTTPError as e:
    print(f"Delete step error: HTTP {e.code} - {e.read().decode('utf-8')}")
except Exception as e:
    print(f"Delete step note: {e}")

# 2. Upload deduplicated 1,329 roster
with open("Ipl players dataset/unique_players.json", "r", encoding="utf-8") as f:
    players = json.load(f)

print(f"Loaded {len(players)} UNIQUE mass players.")

headers = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}

BATCH_SIZE = 300
inserted = 0

for i in range(0, len(players), BATCH_SIZE):
    chunk = players[i:i+BATCH_SIZE]
    req = urllib.request.Request(
        f"{SUPABASE_URL}/rest/v1/players",
        data=json.dumps(chunk).encode("utf-8"),
        headers=headers,
        method="POST"
    )
    
    try:
        urllib.request.urlopen(req)
        inserted += len(chunk)
        print(f"Batch {i//BATCH_SIZE + 1} completed! ({inserted}/{len(players)})")
    except urllib.error.HTTPError as e:
        print(f"Error on batch {i//BATCH_SIZE + 1}: HTTP {e.code} - {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"Error on batch {i//BATCH_SIZE + 1}: {e}")

print(f"Successfully injected all {inserted} UNIQUE players into Supabase!")
