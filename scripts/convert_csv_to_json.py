import csv
import json
import os

csv_path = "Ipl players dataset/auction_with_performance.csv"
json_path = "Ipl players dataset/unique_players.json"

unique_players = {}

def map_role(r):
    r = r.lower()
    if 'wicket' in r: return 'WK'
    if 'all' in r: return 'AR'
    if 'bowl' in r: return 'BOWL'
    return 'BAT'

with open(csv_path, mode='r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        uid = row['player_id'].strip() # Use pure player_id
        name = row['player_name'].strip()
        
        if uid and uid not in unique_players:
            try:
                bp_lakh = float(row['base_price_lakh']) if row['base_price_lakh'] else 50.0
                bp_cr = bp_lakh / 100.0
            except:
                bp_cr = 0.50
                
            unique_players[uid] = {
                "id": uid,
                "name": name,
                "nationality": row['nationality'] if row['nationality'] else "India",
                "is_overseas": True if row['nationality'] == 'Overseas' else False,
                "role": map_role(row['role']),
                "base_price_cr": round(bp_cr, 2)
            }

final_roster = list(unique_players.values())

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(final_roster, f, indent=2)

print(f"Generated {len(final_roster)} unique deduplicated players to {json_path} successfully!")
