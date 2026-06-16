/**
 * clean-player-data.ts
 *
 * Reads unique_players.json (1,196 historical players) and ipl_players_2026.json,
 * applies aggressive data-quality fixes, filters, and writes cleaned_players.json
 * ready for Supabase upsert.
 *
 * Run: npx tsx scripts/clean-player-data.ts
 */

import fs from "fs";
import path from "path";

// ─── Types ───────────────────────────────────────────────────────
interface RawPlayer {
  id: string;
  name: string;
  nationality: string;
  is_overseas: boolean;
  role: string;
  base_price_cr: number;
  capped_status?: string;
  auction_set?: string | null;
  contract_type_2026?: string | null;
  [key: string]: any;
}

// ─── 1. Retired / legacy players to exclude ─────────────────────
const RETIRED_NAMES = new Set([
  "Sachin Tendulkar",
  "Adam Gilchrist",
  "AB de Villiers",
  "Ricky Ponting",
  "Brett Lee",
  "Mahela Jayawardene",
  "Shane Warne",
  "Jacques Kallis",
  "Kumar Sangakkara",
  "Brendon McCullum",
  "Chris Gayle",
  "Dwayne Bravo",
  "Lasith Malinga",
  "Harbhajan Singh",
  "Yuvraj Singh",
  "Gautam Gambhir",
  "Virender Sehwag",
  "Zaheer Khan",
  "Sanath Jayasuriya",
  "Andrew Symonds",
  "Shaun Marsh",
  "Matthew Hayden",
  "Shane Watson",
  "Dale Steyn",
  "Muttiah Muralitharan",
  "Anil Kumble",
  "Michael Hussey",
  "David Hussey",
  "Cameron White",
  "Brad Hodge",
  "Tillakaratne Dilshan",
  "Daniel Vettori",
  "Scott Styris",
  "Stephen Fleming",
  "Graeme Smith",
  "Herschelle Gibbs",
  "Albie Morkel",
  "Morne Morkel",
  "Robin Uthappa",
  "S Sreesanth",
  "Irfan Pathan",
  "Yusuf Pathan",
  "Pragyan Ojha",
  "Ashish Nehra",
  "RP Singh",
  "Munaf Patel",
  "VVS Laxman",
  "Sourav Ganguly",
]);

// ─── 2. Abbreviation duplicates detection ───────────────────────
function isAbbreviatedName(name: string): boolean {
  const parts = name.split(" ");
  if (parts.length < 2) return false;
  const first = parts[0].replace(/\./g, "").trim(); // Strip dots like A.B.
  // Single uppercase letter or 2-3 uppercase letters (e.g., A, SS, AJ, DJ, CJ)
  if (/^[A-Z]{1,3}$/.test(first) && first.length <= 3) return true;
  return false;
}

// ─── 3. Nationality country to category mapping ─────────────────
const OVERSEAS_COUNTRIES = new Set([
  "australia", "england", "south africa", "new zealand", "west indies", 
  "sri lanka", "bangladesh", "afghanistan", "zimbabwe", "nepal", "ireland", 
  "scotland", "netherlands", "namibia", "usa", "overseas"
]);

// ─── 4. Role corrections from raw CSV data ──────────────────────
function buildRoleMapFromCSV(): Map<string, string> {
  const csvPath = path.resolve(process.cwd(), "Ipl players dataset/auction_with_performance.csv");
  if (!fs.existsSync(csvPath)) {
    console.warn("CSV not found, skipping role re-mapping.");
    return new Map();
  }

  const lines = fs.readFileSync(csvPath, "utf8").split("\n").filter(Boolean);
  const roleMap = new Map<string, string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const pid = cols[1]?.trim();
    const rawRole = cols[6]?.trim().toLowerCase() || "";

    if (!pid || roleMap.has(pid)) continue;

    let role = "BAT";
    if (rawRole.includes("wicket") || rawRole.includes("wk")) role = "WK";
    else if (rawRole.includes("all") || rawRole.includes("ar")) role = "AR";
    else if (rawRole.includes("bowl")) role = "BOWL";
    else if (rawRole.includes("bat")) role = "BAT";

    roleMap.set(pid, role);
  }
  return roleMap;
}

// ─── 5. Base price normalization ─────────────────────────────────
function buildBasePriceMap(): Map<string, { year: number; base: number }> {
  const csvPath = path.resolve(process.cwd(), "Ipl players dataset/auction_with_performance.csv");
  if (!fs.existsSync(csvPath)) return new Map();

  const lines = fs.readFileSync(csvPath, "utf8").split("\n").filter(Boolean);
  const priceMap = new Map<string, { year: number; base: number }>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const year = parseInt(cols[0]);
    const pid = cols[1]?.trim();
    const baseLakh = parseFloat(cols[4]) || 0;

    if (!pid || isNaN(year)) continue;

    const existing = priceMap.get(pid);
    if (!existing || year > existing.year) {
      if (baseLakh > 0) {
        priceMap.set(pid, { year, base: Math.round((baseLakh / 100) * 100) / 100 });
      }
    }
  }
  return priceMap;
}

// ─── 6. Latest year per player ───────────────────────────────────
function buildLatestYearMap(): Map<string, number> {
  const csvPath = path.resolve(process.cwd(), "Ipl players dataset/auction_with_performance.csv");
  if (!fs.existsSync(csvPath)) return new Map();

  const lines = fs.readFileSync(csvPath, "utf8").split("\n").filter(Boolean);
  const yearMap = new Map<string, number>();

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const year = parseInt(cols[0]);
    const pid = cols[1]?.trim();

    if (!pid || isNaN(year)) continue;

    const existing = yearMap.get(pid) || 0;
    if (year > existing) yearMap.set(pid, year);
  }
  return yearMap;
}

// ─── Main ────────────────────────────────────────────────────────
function main() {
  const inputPath = path.resolve(process.cwd(), "Ipl players dataset/unique_players.json");
  const curatedPath = path.resolve(process.cwd(), "Ipl players dataset/ipl_players_2026.json");
  const outputPath = path.resolve(process.cwd(), "Ipl players dataset/cleaned_players.json");

  if (!fs.existsSync(inputPath)) {
    console.error("unique_players.json not found!");
    process.exit(1);
  }

  // Load raw unique players
  const rawPlayers: RawPlayer[] = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  console.log(`Loaded ${rawPlayers.length} raw players from unique_players.json`);

  // Load curated 2026 players
  let curatedPlayers: RawPlayer[] = [];
  if (fs.existsSync(curatedPath)) {
    const curatedData = JSON.parse(fs.readFileSync(curatedPath, "utf8"));
    curatedPlayers = curatedData.players || [];
    console.log(`Loaded ${curatedPlayers.length} curated players from ipl_players_2026.json`);
  }

  const roleMap = buildRoleMapFromCSV();
  const priceMap = buildBasePriceMap();
  const latestYearMap = buildLatestYearMap();

  let dropped = { retired: 0, curated: 0, abbreviated: 0, tooOld: 0 };
  const seenNames = new Set<string>();
  const cleanedList: RawPlayer[] = [];

  // Seed curated names so we don't duplicate them
  const curatedNamesLower = new Set(curatedPlayers.map(p => p.name.toLowerCase().trim()));

  for (const player of rawPlayers) {
    const nameLower = player.name.toLowerCase().trim();

    // 1. Skip retired legends in explicit list
    if (RETIRED_NAMES.has(player.name)) {
      dropped.retired++;
      continue;
    }

    // 2. Skip curated players that already exist in ipl_players_2026.json
    if (curatedNamesLower.has(nameLower)) {
      dropped.curated++;
      continue;
    }

    // 3. Skip abbreviation duplicates (like "A Nortje")
    if (isAbbreviatedName(player.name)) {
      dropped.abbreviated++;
      continue;
    }

    // 4. Skip players retired before 2020
    const lastYear = latestYearMap.get(player.id) || 0;
    if (lastYear > 0 && lastYear < 2020) {
      dropped.tooOld++;
      continue;
    }

    // 5. Skip duplicate names
    if (seenNames.has(nameLower)) continue;
    seenNames.add(nameLower);

    // ── Nationality category (Indian vs Overseas) ──
    let nationality = "Indian";
    let isOverseas = false;
    const rawNatLower = (player.nationality || "").toLowerCase().trim();
    
    if (player.is_overseas || OVERSEAS_COUNTRIES.has(rawNatLower) || rawNatLower === "overseas") {
      isOverseas = true;
      nationality = "Overseas";
    }

    // ── Role correction ──
    let role = player.role || "BAT";
    if (roleMap.has(player.id)) {
      role = roleMap.get(player.id)!;
    }
    // Normalize role string format to BAT, BOWL, AR, WK
    if (role.toLowerCase().includes("wicket") || role.toLowerCase() === "wk" || role === "batter/wicket-keeper" || role === "wicket-keeper") role = "WK";
    else if (role.toLowerCase().includes("all") || role.toLowerCase() === "ar" || role === "all-rounder") role = "AR";
    else if (role.toLowerCase().includes("bowl") || role === "bowler") role = "BOWL";
    else role = "BAT";

    // ── Capped status ──
    const isCapped = player.capped_status === "capped" || (player.base_price_cr && player.base_price_cr >= 0.50);
    const capped_status = isCapped ? "capped" : "uncapped";

    // ── Base Price (Crore) ──
    let base_price_cr = 0.20; // Default minimum uncapped base price
    const priceData = priceMap.get(player.id);
    
    if (priceData && priceData.base > 0) {
      base_price_cr = priceData.base;
    } else if (player.base_price_cr > 0) {
      base_price_cr = player.base_price_cr;
    }

    // Clean up base price anomaly: if uncapped, ensure it is within IPL uncapped prices
    if (capped_status === "uncapped") {
      if (base_price_cr >= 0.50) {
        // Distribute uncapped base prices realistically (₹20L, ₹30L, ₹40L)
        const prices = [0.20, 0.30, 0.40];
        base_price_cr = prices[Math.floor(Math.random() * prices.length)];
      }
    } else {
      // For capped players, make sure it is at least ₹50L (0.50 Cr)
      if (base_price_cr < 0.50) {
        base_price_cr = 0.50;
      }
    }

    // ── Auction Set ──
    let auction_set = "CAPPED";
    if (capped_status === "uncapped") {
      // Assign uncapped sets: UNCAPPED_SET1 for BAT/WK, UNCAPPED_SET2 for BOWL/AR
      auction_set = (role === "BAT" || role === "WK") ? "UNCAPPED_SET1" : "UNCAPPED_SET2";
    } else {
      // Assign capped sets
      auction_set = base_price_cr >= 2.00 ? "MARQUEE_SET2" : "CAPPED";
    }

    cleanedList.push({
      id: player.id,
      name: player.name,
      nationality,
      is_overseas: isOverseas,
      capped_status,
      role,
      base_price_cr,
      auction_set,
      contract_type_2026: "AUCTION"
    });
  }

  // Combine curated and non-curated lists to have a single solid player pool
  // Normalize curated players to make sure they follow the same nationality/role structure
  const normalizedCurated = curatedPlayers.map(p => {
    let nat = "Indian";
    if (p.is_overseas || OVERSEAS_COUNTRIES.has((p.nationality || "").toLowerCase().trim()) || (p.nationality || "").toLowerCase().trim() === "overseas") {
      nat = "Overseas";
    }
    let role = p.role;
    if (role === "BATSMAN" || role === "batter") role = "BAT";
    else if (role === "BOWLER" || role === "bowler") role = "BOWL";
    else if (role === "ALL-ROUNDER" || role === "all-rounder") role = "AR";
    else if (role === "WICKET-KEEPER" || role === "wicket-keeper" || role === "WK") role = "WK";
    
    return {
      ...p,
      nationality: nat,
      is_overseas: nat === "Overseas",
      capped_status: p.capped_status || (p.base_price_cr >= 0.50 ? "capped" : "uncapped"),
      role
    };
  });

  // Filter non-curated players by lastYear to make sure they are active (lastYear >= 2025 or high-value 2024)
  // This helps trim down the player registry to ~300-350 active players in total
  const activeCleaned = cleanedList.filter(p => {
    const lastYear = latestYearMap.get(p.id) || 0;
    return lastYear >= 2025 || (lastYear === 2024 && p.base_price_cr >= 0.75);
  });

  // Consolidate list
  const consolidated = [...normalizedCurated, ...activeCleaned];

  console.log(`\n── Cleanup Summary ──`);
  console.log(`  Retired legends removed:     ${dropped.retired}`);
  console.log(`  Curated duplicates skipped:  ${dropped.curated}`);
  console.log(`  Abbreviation dupes removed:  ${dropped.abbreviated}`);
  console.log(`  Pre-2020 retired removed:    ${dropped.tooOld}`);
  console.log(`  Cleaned active pool size:    ${activeCleaned.length}`);
  console.log(`  Curated pool size:           ${normalizedCurated.length}`);
  console.log(`  Total consolidated players:  ${consolidated.length}`);

  // Role distribution statistics
  const rolesCount: Record<string, number> = {};
  const nationalityCount: Record<string, number> = {};
  for (const p of consolidated) {
    rolesCount[p.role] = (rolesCount[p.role] || 0) + 1;
    nationalityCount[p.nationality] = (nationalityCount[p.nationality] || 0) + 1;
  }
  console.log(`\n── Consolidate Role Distribution ──`);
  Object.entries(rolesCount).forEach(([r, c]) => console.log(`  ${r}: ${c}`));
  console.log(`\n── Consolidate Nationality ──`);
  Object.entries(nationalityCount).forEach(([n, c]) => console.log(`  ${n}: ${c}`));

  // Write to cleaned_players.json
  fs.writeFileSync(outputPath, JSON.stringify(consolidated, null, 2));
  console.log(`\n✅ Written ${consolidated.length} consolidated players to ${outputPath}`);
}

main();
