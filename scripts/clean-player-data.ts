/**
 * clean-player-data.ts
 *
 * Reads unique_players.json (1,196 historical players), applies aggressive
 * data-quality fixes, and writes cleaned_players.json ready for Supabase upsert.
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
  "AB de Villiers",
  "Adam Gilchrist",
  "Sachin Tendulkar",
  "Shane Warne",
  "Jacques Kallis",
  "Ricky Ponting",
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
  "Brett Lee",
  "Michael Hussey",
  "David Hussey",
  "Cameron White",
  "Brad Hodge",
  "Mahela Jayawardene",
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
  "MS Dhoni", // curated version exists in ipl_players_2026.json — remove P-id duplicate
]);

// Players that also appear in ipl_players_2026.json under slug IDs — skip the P-series version
const CURATED_NAMES = new Set([
  "MS Dhoni",
  "Virat Kohli",
  "Rohit Sharma",
  "Jasprit Bumrah",
  "Rishabh Pant",
  "Shreyas Iyer",
  "Yashasvi Jaiswal",
  "Suryakumar Yadav",
  "Hardik Pandya",
  "Rashid Khan",
  "Shubman Gill",
  "Ruturaj Gaikwad",
  "Ravindra Jadeja",
  "Sanju Samson",
  "Arshdeep Singh",
  "Yuzvendra Chahal",
  "KL Rahul",
  "Axar Patel",
  "Kuldeep Yadav",
  "Cameron Green",
  "Matheesha Pathirana",
  "Prashant Veer",
  "Kartik Sharma",
  "Jos Buttler",
  "Kagiso Rabada",
  "Rinku Singh",
  "Sunil Narine",
  "Nicholas Pooran",
  "Heinrich Klaasen",
  "Pat Cummins",
  "Abhishek Sharma",
  "Travis Head",
  "Mayank Yadav",
  "Jofra Archer",
  "Trent Boult",
  "Shivam Dube",
  "Sai Sudarshan",
  "Varun Chakravarthy",
  "Dhruv Jurel",
  "Mohammed Shami",
  "Mitchell Starc",
  "Riyan Parag",
]);

// ─── 2. Abbreviation duplicates — keep full name, drop abbreviation ─
// Map of abbreviated ID → full-name ID that already exists
const ABBREVIATION_IDS_TO_DROP = new Set([
  // These are P-series IDs where a better full-name version exists
  // We identify them by checking if name looks like an abbreviation (e.g., "A Nortje", "SS Iyer")
]);

function isAbbreviatedName(name: string): boolean {
  // Matches patterns like "A Nortje", "SS Iyer", "VR Iyer", "RR Pant"
  // Single letter or two-letter all-caps first token
  const parts = name.split(" ");
  if (parts.length < 2) return false;
  const first = parts[0];
  // Single uppercase letter or 2-3 uppercase letters (initials)
  if (/^[A-Z]{1,3}$/.test(first) && first.length <= 2) return true;
  return false;
}

// ─── 3. Nationality normalization ────────────────────────────────
// For overseas players with nationality "Overseas", map known names → country
const OVERSEAS_COUNTRY_MAP: Record<string, string> = {
  // Australia
  "David Warner": "Australia",
  "Steve Smith": "Australia",
  "Mitchell Marsh": "Australia",
  "Marcus Stoinis": "Australia",
  "Josh Hazlewood": "Australia",
  "Nathan Coulter-Nile": "Australia",
  "Ben Cutting": "Australia",
  "Moises Henriques": "Australia",
  "Chris Lynn": "Australia",
  "Aaron Finch": "Australia",
  "Shaun Marsh": "Australia",
  "Mitchell Johnson": "Australia",
  "James Faulkner": "Australia",
  "George Bailey": "Australia",
  "Andrew Tye": "Australia",
  "Jason Behrendorff": "Australia",
  "Jhye Richardson": "Australia",
  "Riley Meredith": "Australia",
  "Sean Abbott": "Australia",
  "Nathan Ellis": "Australia",
  "Matt Short": "Australia",
  "Josh Inglis": "Australia",
  "Adam Zampa": "Australia",
  "Ashton Turner": "Australia",
  // England
  "Ben Stokes": "England",
  "Jos Buttler": "England",
  "Jonny Bairstow": "England",
  "Sam Curran": "England",
  "Tom Curran": "England",
  "Moeen Ali": "England",
  "Liam Livingstone": "England",
  "Jofra Archer": "England",
  "Mark Wood": "England",
  "Chris Woakes": "England",
  "Jason Roy": "England",
  "Dawid Malan": "England",
  "Phil Salt": "England",
  "Harry Brook": "England",
  "Will Jacks": "England",
  "Jamie Overton": "England",
  "Reece Topley": "England",
  // South Africa
  "Quinton de Kock": "South Africa",
  "Faf du Plessis": "South Africa",
  "David Miller": "South Africa",
  "Kagiso Rabada": "South Africa",
  "Anrich Nortje": "South Africa",
  "Marco Jansen": "South Africa",
  "Lungi Ngidi": "South Africa",
  "Aiden Markram": "South Africa",
  "Rassie van der Dussen": "South Africa",
  "Dewald Brevis": "South Africa",
  "Gerald Coetzee": "South Africa",
  "Tristan Stubbs": "South Africa",
  "Heinrich Klaasen": "South Africa",
  "Wayne Parnell": "South Africa",
  "Chris Morris": "South Africa",
  "Imran Tahir": "South Africa",
  // New Zealand
  "Kane Williamson": "New Zealand",
  "Trent Boult": "New Zealand",
  "Tim Southee": "New Zealand",
  "Devon Conway": "New Zealand",
  "Daryl Mitchell": "New Zealand",
  "Lockie Ferguson": "New Zealand",
  "Adam Milne": "New Zealand",
  "Mitchell Santner": "New Zealand",
  "Jimmy Neesham": "New Zealand",
  "Kyle Jamieson": "New Zealand",
  "Glenn Phillips": "New Zealand",
  "Rachin Ravindra": "New Zealand",
  // West Indies
  "Andre Russell": "West Indies",
  "Sunil Narine": "West Indies",
  "Nicholas Pooran": "West Indies",
  "Shimron Hetmyer": "West Indies",
  "Sherfane Rutherford": "West Indies",
  "Romario Shepherd": "West Indies",
  "Alzarri Joseph": "West Indies",
  "Odean Smith": "West Indies",
  "Rovman Powell": "West Indies",
  "Jason Holder": "West Indies",
  "Kieron Pollard": "West Indies",
  "Dwayne Smith": "West Indies",
  "Lendl Simmons": "West Indies",
  // Sri Lanka
  "Wanindu Hasaranga": "Sri Lanka",
  "Matheesha Pathirana": "Sri Lanka",
  "Maheesh Theekshana": "Sri Lanka",
  "Dushmantha Chameera": "Sri Lanka",
  "Bhanuka Rajapaksa": "Sri Lanka",
  "Dasun Shanaka": "Sri Lanka",
  // Bangladesh
  "Shakib Al Hasan": "Bangladesh",
  "Mustafizur Rahman": "Bangladesh",
  "Taskin Ahmed": "Bangladesh",
  "Litton Das": "Bangladesh",
  // Afghanistan
  "Rashid Khan": "Afghanistan",
  "Mohammad Nabi": "Afghanistan",
  "Mujeeb Ur Rahman": "Afghanistan",
  "Fazalhaq Farooqi": "Afghanistan",
  "Rahmanullah Gurbaz": "Afghanistan",
  "Naveen-ul-Haq": "Afghanistan",
  "Noor Ahmad": "Afghanistan",
  // Zimbabwe
  "Sikandar Raza": "Zimbabwe",
  "Blessing Muzarabani": "Zimbabwe",
  "Sean Williams": "Zimbabwe",
  // Nepal
  "Sandeep Lamichhane": "Nepal",
};

// ─── 4. Role corrections from raw CSV data ──────────────────────
// The CSV used "Batsman", "Bowler", "All-Rounder", "Wicket-Keeper" which
// were mapped but many fell through to BAT. Re-read the CSV to rebuild the mapping.
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
    if (rawRole.includes("wicket")) role = "WK";
    else if (rawRole.includes("all")) role = "AR";
    else if (rawRole.includes("bowl")) role = "BOWL";
    else if (rawRole.includes("bat")) role = "BAT";

    roleMap.set(pid, role);
  }
  return roleMap;
}

// ─── 5. Base price normalization ─────────────────────────────────
// Recalculate base prices using the most recent auction year data
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

// ─── 6. Latest year per player (to filter truly retired) ─────────
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
  const outputPath = path.resolve(process.cwd(), "Ipl players dataset/cleaned_players.json");

  if (!fs.existsSync(inputPath)) {
    console.error("unique_players.json not found!");
    process.exit(1);
  }

  const rawPlayers: RawPlayer[] = JSON.parse(fs.readFileSync(inputPath, "utf8"));
  console.log(`Loaded ${rawPlayers.length} raw players from unique_players.json`);

  const roleMap = buildRoleMapFromCSV();
  const priceMap = buildBasePriceMap();
  const latestYearMap = buildLatestYearMap();

  let dropped = { retired: 0, curated: 0, abbreviated: 0, tooOld: 0 };
  const seenNames = new Set<string>();
  const cleaned: RawPlayer[] = [];

  for (const player of rawPlayers) {
    // Skip retired legends
    if (RETIRED_NAMES.has(player.name)) {
      dropped.retired++;
      continue;
    }

    // Skip if curated version exists in ipl_players_2026.json
    if (CURATED_NAMES.has(player.name)) {
      dropped.curated++;
      continue;
    }

    // Skip abbreviated name duplicates
    if (isAbbreviatedName(player.name)) {
      dropped.abbreviated++;
      continue;
    }

    // Skip players whose last recorded year is before 2019 (truly retired)
    const lastYear = latestYearMap.get(player.id) || 0;
    if (lastYear > 0 && lastYear < 2019) {
      dropped.tooOld++;
      continue;
    }

    // Skip exact name duplicates
    const normalizedName = player.name.toLowerCase().trim();
    if (seenNames.has(normalizedName)) continue;
    seenNames.add(normalizedName);

    // ── Fix nationality ──
    let nationality = player.nationality;
    if (nationality === "Indian" || nationality === "India") {
      nationality = "India";
      player.is_overseas = false;
    } else if (nationality === "Overseas" || nationality === "overseas") {
      // Try to resolve from our lookup
      nationality = OVERSEAS_COUNTRY_MAP[player.name] || "Overseas";
      player.is_overseas = true;
    }
    player.nationality = nationality;

    // ── Fix role ──
    if (roleMap.has(player.id)) {
      player.role = roleMap.get(player.id)!;
    }

    // ── Fix base price ──
    const priceData = priceMap.get(player.id);
    if (priceData && priceData.base > 0) {
      player.base_price_cr = priceData.base;
    }
    // Ensure minimum base price
    if (!player.base_price_cr || player.base_price_cr <= 0) {
      player.base_price_cr = 0.20;
    }

    // ── Assign auction_set ──
    if (!player.auction_set) {
      if (player.base_price_cr >= 2.0) {
        player.auction_set = "CAPPED";
      } else if (player.base_price_cr >= 1.0) {
        player.auction_set = player.is_overseas ? "CAPPED" : "CAPPED";
      } else if (player.base_price_cr >= 0.5) {
        player.auction_set = player.is_overseas ? "CAPPED" : "UNCAPPED";
      } else {
        player.auction_set = "UNCAPPED";
      }
    }

    // ── Ensure capped_status ──
    if (!player.capped_status) {
      player.capped_status = player.base_price_cr >= 1.0 ? "capped" : "uncapped";
    }

    // ── Ensure contract_type ──
    if (!player.contract_type_2026) {
      player.contract_type_2026 = "AUCTION";
    }

    cleaned.push(player);
  }

  console.log(`\n── Cleanup Summary ──`);
  console.log(`  Retired legends removed:     ${dropped.retired}`);
  console.log(`  Curated duplicates removed:  ${dropped.curated}`);
  console.log(`  Abbreviation dupes removed:  ${dropped.abbreviated}`);
  console.log(`  Pre-2019 retired removed:    ${dropped.tooOld}`);
  console.log(`  Final cleaned pool:          ${cleaned.length}`);

  // Stats
  const roles: Record<string, number> = {};
  const nationalities: Record<string, number> = {};
  for (const p of cleaned) {
    roles[p.role] = (roles[p.role] || 0) + 1;
    nationalities[p.nationality] = (nationalities[p.nationality] || 0) + 1;
  }
  console.log(`\n── Role Distribution ──`);
  Object.entries(roles).sort((a, b) => b[1] - a[1]).forEach(([r, c]) => console.log(`  ${r}: ${c}`));
  console.log(`\n── Top Nationalities ──`);
  Object.entries(nationalities).sort((a, b) => b[1] - a[1]).slice(0, 10).forEach(([n, c]) => console.log(`  ${n}: ${c}`));

  fs.writeFileSync(outputPath, JSON.stringify(cleaned, null, 2));
  console.log(`\n✅ Written ${cleaned.length} cleaned players to ${outputPath}`);
}

main();
