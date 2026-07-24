# DraftForge | Auction Simulator 🏏

A premium, real-time multiplayer cricket manager draft room simulator. Experience the tactical intensity of the Mega Auction right in your browser. Built with Next.js (App Router), TypeScript, Tailwind CSS, and Supabase.

---

## 🚀 Key Features

- **Real-Time Bidding**: Powered by Supabase Realtime for sub-second, multi-client bid synchronization.
- **RESTful Architecture**: Clean, noun-based, and semantic route layout.
- **Realistic Bid Increments**: Implements actual Mega Auction bidding ladder increments (Lakhs to Crores).
- **Roster Constraints**: Strictly enforces squad size limitations (18-25 players) and overseas quotas (max 8).
- **Multiple Game Modes**: Choose between *Full Draft*, *Mock 2026*, and *Retired Legends* pools.

---

## 📁 Codebase Directory Structure

```
├── app/
│   ├── api/                      # Next.js API route handlers
│   │   ├── health/               # Health check endpoint
│   │   └── rooms/                # RESTful rooms endpoints (Create, Get, Join, Advance)
│   ├── guide/                    # Rules handbook & bidding strategy (/guide)
│   ├── players/                  # Complete player search registry (/players)
│   ├── rooms/                    # Available rooms discovery list (/rooms)
│   │   └── [code]/               # Dynamic routing under custom 6-digit lobby code
│   │       ├── auction/          # Live, real-time bidding war room
│   │       └── results/          # Post-game leaderboard & compiled rosters
│   ├── globals.css               # Global theme styles & ambient animations
│   ├── layout.tsx                # Master page layout wrapper
│   └── page.tsx                  # Home lobby landing screen
│
├── components/
│   ├── auction/                  # Bidding-specific client components & context provider
│   ├── layout/                   # General UI shells (Navbar, Footer)
│   ├── players/                  # Search, filter, and sorting registries
│   └── ui/                       # Reusable custom UI components (Buttons, Badges, Modals)
│
├── lib/
│   ├── auction-engine.ts         # Deterministic bid increment calculators and roster validators
│   ├── supabase.ts               # Client wrapper and database connection setup
│   └── types/                    # Common interface declarations
│
└── scripts/                      # SQL migrations, database seed tools, and data cleaners
```

---

## 🛠 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Supabase account & database

### Environment Setup

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation

```bash
# Install dependencies
npm install

# Start the dev compilation server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the simulator dashboard.

---

## 🏗 Architectural Design Principles

1. **Semantic Route Naming**: Routes are noun-based, lowercase, and follow clean Next.js patterns (e.g., `/rooms/[code]`).
2. **One-Way Data Flow**: State is managed via `AuctionContext` utilizing Supabase broadcast streams to keep all players instantly updated.
3. **Robust Safety Enforcements**: Roster validation is executed via Postgres RPC functions (such as `execute_bid`) ensuring that funds and limits are never exceeded, even under extreme concurrent bidding pressure.
