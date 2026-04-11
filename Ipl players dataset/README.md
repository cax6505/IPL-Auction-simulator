# IPL Auction Game — Data Package

## Files Included

| File | Format | Description |
|------|--------|-------------|
| `ipl_players_2026.json` | JSON | Full player profiles with all-time auction history |
| `ipl_players_2026.csv` | CSV | Flat player table for spreadsheets / game engines |
| `ipl_all_time_auctions.csv` | CSV | Every auction record from 2008–2026 |
| `ipl_rules_and_config.json` | JSON | Game rules, bid increments, team purses |

---

## Data Schema

### Player Fields

| Field | Type | Values |
|-------|------|--------|
| `id` | string | Slug e.g. `rishabh-pant` |
| `name` | string | Full name |
| `nationality` | string | Country |
| `is_overseas` | bool | `true` if non-Indian |
| `capped_status` | enum | `capped` / `uncapped` |
| `role` | enum | `BAT` / `BOWL` / `AR` / `WK` |
| `batting_style` | enum | `RHB` / `LHB` |
| `bowling_style` | enum | `RAF`, `LAF`, `RFM`, `LFM`, `OB`, `LB`, `SLA` |
| `ipl_team_2026` | string | Team code e.g. `CSK`, `MI` |
| `ipl_team_2025` | string | Previous team |
| `contract_type_2026` | enum | `RETAINED` / `AUCTION` / `TRADED` / `REPLACEMENT` |
| `base_price_cr` | float | Base price in crore INR at last auction |
| `sold_price_cr` | float | Final sold price in crore INR |
| `auction_year` | int | Year of last auction |
| `auction_set` | enum | `MARQUEE_SET1`, `MARQUEE_SET2`, `CAPPED`, `UNCAPPED`, `RETAINED` |
| `retention_cost_cr` | float | Cost deducted from purse if directly retained |
| `rtm_used` | bool | Was RTM used to acquire? |
| `all_time_auctions` | array | All historical auction records |

### Team Codes
| Code | Team |
|------|------|
| CSK | Chennai Super Kings |
| DC | Delhi Capitals |
| GT | Gujarat Titans |
| KKR | Kolkata Knight Riders |
| LSG | Lucknow Super Giants |
| MI | Mumbai Indians |
| PBKS | Punjab Kings |
| RR | Rajasthan Royals |
| RCB | Royal Challengers Bengaluru |
| SRH | Sunrisers Hyderabad |

---

## Key IPL Auction Rules (2025 Mega / 2026 Mini)

### Purse
- **2025 Mega:** ₹120 Cr per team
- **2026 Mini:** ₹125 Cr per team

### Squad Limits
- **Min:** 18 players | **Max:** 25 players
- **Overseas max in squad:** 8
- **Overseas max in playing XI:** 4

### Retention Rules (2025 Mega Auction)
- Max **6 retentions** (combination of direct + RTM)
- Max **5 capped** players retained
- Max **2 uncapped** players retained
- Uncapped player cost: ₹4 Cr each
- Capped retention salary slabs: ₹18Cr → ₹14Cr → ₹11Cr → ₹18Cr → ₹14Cr

### RTM (Right to Match) Card
- Available **only in Mega Auctions** (not mini)
- RTM cards = `6 − number_of_direct_retentions`
- If RTM invoked: highest bidder gets one final chance to overbid, then RTM team decides

### Bid Increments
| Bracket | Increment |
|---------|-----------|
| Up to ₹1 Cr | ₹5 Lakh |
| ₹1–2 Cr | ₹10 Lakh |
| ₹2–5 Cr | ₹25 Lakh |
| ₹5–10 Cr | ₹50 Lakh |
| Above ₹10 Cr | ₹1 Cr |

### Base Price Categories
₹20L · ₹30L · ₹50L · ₹75L · ₹1 Cr · ₹2 Cr

### 2025 Mega Auction Order
1. Marquee Set 1 (6 players)
2. Marquee Set 2 (6 players)
3. Capped Batters → All-Rounders → WKs → Fast Bowlers → Spinners
4. Uncapped Batters → All-Rounders → WKs → Fast Bowlers → Spinners
5. Accelerated Auction (unsold players rapid-fire)

---

## All-Time Records

| Record | Player | Price (Cr) | Team | Year |
|--------|--------|-----------|------|------|
| Most Expensive Ever | Rishabh Pant | ₹27 Cr | LSG | 2025 |
| Most Expensive Overseas | Cameron Green | ₹25.20 Cr | KKR | 2026 |
| Most Expensive Uncapped (joint) | Prashant Veer | ₹14.20 Cr | CSK | 2026 |
| Most Expensive Uncapped (joint) | Kartik Sharma | ₹14.20 Cr | CSK | 2026 |
| Previous Overseas Record | Mitchell Starc | ₹24.75 Cr | KKR | 2024 |

---

## Additional Dataset Sources

For full player stats (batting avg, economy, SR) to enhance your game, use:

- **Kaggle:** `kaggle.com/datasets/bhadramohit/tata-ipl-auction-list2025-dataset`
- **Kaggle:** `kaggle.com/datasets/souviksamanta1053/ipl-2025-mega-auction-dataset`
- **Kaggle (all-time):** `kaggle.com/datasets/kalilurrahman/ipl-player-auction-dataset-from-start-to-now`
- **ESPNcricinfo:** `espncricinfo.com/auction/ipl-2026-auction-1515016/all-players`
- **GitHub (match data):** `github.com/ritesh-ojha/IPL-DATASET`

---

## Suggested Game Integration

```javascript
// Load players
const players = await fetch('./ipl_players_2026.json').then(r => r.json());
const config = await fetch('./ipl_rules_and_config.json').then(r => r.json());

// Filter by auction set
const marquee = players.players.filter(p => 
  p.auction_set?.includes('MARQUEE')
);

// Filter available (not already retained)
const available = players.players.filter(p => 
  p.contract_type_2026 === 'AUCTION'
);

// Check overseas limit for a team
function canBidOverseas(team, currentSquad) {
  const overseasCount = currentSquad.filter(p => p.is_overseas).length;
  return overseasCount < config.auction_config.overseas_max;
}

// Calculate RTM cards for a team (2025 mega auction rules)
function getRTMCards(directRetentions) {
  return Math.max(0, 6 - directRetentions);
}
```
