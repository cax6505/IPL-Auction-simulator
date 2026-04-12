# IPL Auction Pro - Real-time Simulator

## Overview
**IPL Auction Pro** is a high-performance, real-time web application designed to simulate the high-stakes environment of an IPL Mega Auction. Built with **Next.js 15**, **TypeScript**, and **Supabase**, it allows friends to create private rooms, compete for world-class players, and manage their franchises with sub-second synchronization.

Inspired by industry-standard platforms, this project features a premium glassmorphic UI, dynamic host controls, and a robust real-time bidding engine.

---

## 🚀 LIVE DEMO
[https://auction-simulator-six.vercel.app/](https://auction-simulator-six.vercel.app/)

---

## ✨ Key Features

- **⚡ Real-time Bidding**: Experience sub-second bid updates using Supabase Realtime (Postgres CDC & Broadcast).
- **🏟️ Live Room Chat**: Strategize and banter in real-time with a built-in messaging system.
- **📊 Professional Squad Dashboard**: View your team's depth with categorized role views (BAT, WK, AR, BOWL) and Overseas counts.
- **⚙️ Dynamic Host Controls**: Room hosts can adjust the bid timer (5s - 20s) and manage auction states (Pause/Resume/End).
- **🌐 Public Lobby Browser**: Discover and join active public auctions as a Manager or Spectator.
- **📱 Responsive Design**: Fully optimized for mobile, tablet, and desktop viewing.

---

## 🛠️ Tech Stack

- **Frontend**: [Next.js 15](https://nextjs.org/) (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4 (Custom Modern UI Tokens)
- **Backend**: [Supabase](https://supabase.com/) (PostgreSQL, Authentication & Realtime)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🏁 Getting Started

### Prerequisites
- Node.js 18+ 
- A Supabase Project

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cax6505/IPL-Auction-simulator.git
   cd IPL-Auction-simulator
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Local Production Build**
   ```bash
   npm run build
   npm run start
   ```

---

## 📜 Auction Rules & Limits
- **Squad Size**: 18 Min / 25 Max
- **Overseas Limit**: Maximum 8 players per squad
- **Starting Purse**: ₹120.00 Cr
- **Retention Mode**: Mock 2026 mode pre-loads real retention data for authentic team states.

---

## 🤝 Contributing
Contributions are welcome! If you have ideas for new features or improvements, feel free to open an issue or submit a pull request.

---

## 📄 License
MIT License. Created with ❤️ for the Cricket community.
