# KickScan.io — Odds Scraper Architecture

## Overview
Real-time odds comparison engine that pulls betting data from multiple sportsbooks and serves it to the KickScan frontend. Designed for the 2026 FIFA World Cup (104 matches over 39 days).

---

## Data Sources (Ranked by Priority)

### Primary: The Odds API (the-odds-api.com)
- **Why:** Established, reliable, covers soccer/World Cup markets
- **Free Tier:** 500 requests/month — enough for testing/development
- **Paid:** $79/month gets 10,000 requests — sufficient for tournament
- **Markets:** h2h (moneyline), spreads, totals
- **Bookmakers:** 40+ (Bet365, FanDuel, DraftKings, William Hill, Betway, etc.)
- **Endpoint:** `GET /v4/sports/soccer_fifa_world_cup/odds`
- **Format:** JSON, well-documented

### Secondary: OddsPapi (oddspapi.io)
- **Why:** Free tier includes all 348 bookmakers, historical odds
- **Free Tier:** Generous — good for additional coverage
- **Markets:** Match result, over/under, BTTS, Asian handicap
- **Use Case:** Backup source, historical odds for trend analysis

### Tertiary: Manual Scraping (Fallback)
- **Source:** Oddschecker, OddsPortal — public-facing odds comparison sites
- **Method:** Puppeteer/Playwright headless browser scraping
- **Risk:** TOS concerns, anti-bot detection, slower updates
- **Use Case:** Only if APIs don't cover specific markets (props, group winner, etc.)

---

## Architecture

```
┌──────────────────────────────────────────┐
│              CRON SCHEDULER              │
│   (Vercel Cron / GitHub Actions)         │
│   Runs every 15 min on match days        │
│   Runs every 2 hrs on non-match days     │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│           ODDS FETCHER SERVICE           │
│   (Next.js API Route or Edge Function)   │
│                                          │
│   1. Call The Odds API (primary)         │
│   2. Call OddsPapi (secondary)           │
│   3. Normalize odds to decimal format    │
│   4. Calculate implied probabilities     │
│   5. Detect arbitrage opportunities      │
│   6. Store in database                   │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│            SUPABASE DATABASE             │
│   (PostgreSQL — free tier)               │
│                                          │
│   Tables:                                │
│   - matches (104 rows)                   │
│   - odds_snapshots (time-series)         │
│   - arbitrage_alerts                     │
│   - bookmakers                           │
└──────────────┬───────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────┐
│          NEXT.JS FRONTEND                │
│   (Static + ISR + Client-side refresh)   │
│                                          │
│   Pages served:                          │
│   - /odds (main comparison table)        │
│   - /match/[id] (individual match odds)  │
│   - /arb-alerts (arbitrage feed)         │
│   - /groups/[letter] (group odds)        │
│   - API: /api/odds/[matchId]             │
└──────────────────────────────────────────┘
```

---

## Database Schema

### `matches` Table
```sql
CREATE TABLE matches (
  id TEXT PRIMARY KEY,           -- e.g., "group-a-mex-kor"
  group_letter CHAR(1),
  stage TEXT,                    -- "group", "r32", "r16", "qf", "sf", "final"
  home_team TEXT,
  away_team TEXT,
  kickoff TIMESTAMPTZ,
  venue TEXT,
  city TEXT,
  status TEXT DEFAULT 'upcoming', -- "upcoming", "live", "finished"
  home_score INT,
  away_score INT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `odds_snapshots` Table (Time Series)
```sql
CREATE TABLE odds_snapshots (
  id SERIAL PRIMARY KEY,
  match_id TEXT REFERENCES matches(id),
  bookmaker TEXT,                -- "bet365", "fanduel", etc.
  market TEXT,                   -- "h2h", "spreads", "totals"
  outcome TEXT,                  -- "home", "away", "draw", "over", "under"
  odds DECIMAL(6,3),            -- decimal format (e.g., 2.150)
  implied_prob DECIMAL(5,4),    -- calculated (e.g., 0.4651)
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_odds_match_time ON odds_snapshots(match_id, fetched_at DESC);
CREATE INDEX idx_odds_bookmaker ON odds_snapshots(bookmaker, match_id);
```

### `arbitrage_alerts` Table
```sql
CREATE TABLE arbitrage_alerts (
  id SERIAL PRIMARY KEY,
  match_id TEXT REFERENCES matches(id),
  market TEXT,
  total_implied_prob DECIMAL(6,4),  -- < 1.0 means arb exists
  profit_pct DECIMAL(5,3),          -- e.g., 2.3%
  bookmaker_1 TEXT,
  outcome_1 TEXT,
  odds_1 DECIMAL(6,3),
  stake_1_pct DECIMAL(5,3),         -- % of total stake
  bookmaker_2 TEXT,
  outcome_2 TEXT,
  odds_2 DECIMAL(6,3),
  stake_2_pct DECIMAL(5,3),
  bookmaker_3 TEXT,                  -- for 3-way markets (draw)
  outcome_3 TEXT,
  odds_3 DECIMAL(6,3),
  stake_3_pct DECIMAL(5,3),
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  still_active BOOLEAN DEFAULT TRUE
);
```

### `bookmakers` Table
```sql
CREATE TABLE bookmakers (
  key TEXT PRIMARY KEY,           -- "bet365", "fanduel"
  name TEXT,                      -- "Bet365", "FanDuel"
  region TEXT,                    -- "uk", "us", "eu", "au"
  affiliate_url TEXT,             -- Revenue link
  logo_url TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

---

## Odds Fetcher Logic (Pseudocode)

```javascript
// /api/cron/fetch-odds.js

async function fetchOdds() {
  // 1. Get upcoming matches (next 48 hours)
  const matches = await getUpcomingMatches();
  
  // 2. Fetch from The Odds API
  const oddsData = await fetch(
    `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds` +
    `?apiKey=${API_KEY}&regions=us,uk,eu,au&markets=h2h,spreads,totals` +
    `&oddsFormat=decimal`
  );
  
  // 3. Normalize and store
  for (const match of oddsData) {
    for (const bookmaker of match.bookmakers) {
      for (const market of bookmaker.markets) {
        for (const outcome of market.outcomes) {
          await storeOddsSnapshot({
            match_id: match.id,
            bookmaker: bookmaker.key,
            market: market.key,
            outcome: outcome.name,
            odds: outcome.price,
            implied_prob: 1 / outcome.price
          });
        }
      }
    }
  }
  
  // 4. Check for arbitrage
  await detectArbitrage(matches);
}

async function detectArbitrage(matches) {
  for (const match of matches) {
    // Get best odds per outcome across all bookmakers
    const bestHome = await getBestOdds(match.id, 'h2h', 'home');
    const bestAway = await getBestOdds(match.id, 'h2h', 'away');
    const bestDraw = await getBestOdds(match.id, 'h2h', 'draw');
    
    const totalImplied = (1/bestHome.odds) + (1/bestAway.odds) + (1/bestDraw.odds);
    
    if (totalImplied < 1.0) {
      // ARBITRAGE DETECTED!
      const profitPct = ((1 / totalImplied) - 1) * 100;
      await createArbAlert({
        match_id: match.id,
        market: 'h2h',
        total_implied_prob: totalImplied,
        profit_pct: profitPct,
        // ... stake calculations
      });
    }
  }
}
```

---

## Cron Schedule

| Phase | Frequency | API Calls/Day | Notes |
|-------|-----------|---------------|-------|
| Pre-tournament (now – June 10) | Every 6 hours | ~4 | Outright/group winner odds only |
| Group stage (June 11–26) | Every 15 min for live, hourly otherwise | ~100 | Peak usage |
| Knockouts (June 27 – July 19) | Every 15 min for live, hourly otherwise | ~50 | Fewer matches |
| **Total estimated API calls** | | **~5,000-8,000** | Fits in $79/month tier |

---

## API Cost Estimate

| Service | Tier | Monthly Cost | Notes |
|---------|------|-------------|-------|
| The Odds API | Starter | $79/month | 10,000 requests — sufficient |
| OddsPapi | Free | $0 | Backup/additional bookmakers |
| Supabase | Free | $0 | 500MB DB, 50,000 rows — plenty |
| Vercel | Free/Hobby | $0-20 | Hosting + cron jobs |
| **Total** | | **$79-99/month** | **Only during tournament (2 months)** |

**Pre-tournament:** Use free tiers only ($0) — limited data but enough for launch.
**During tournament:** Upgrade to paid The Odds API ($79/month) for real-time data.
**Post-tournament:** Downgrade back to free.

**Total estimated cost: ~$160-200 for the entire World Cup period.**

---

## Arbitrage Detection Algorithm

```
For each match and market type (h2h, spreads, totals):
  1. Collect latest odds from ALL bookmakers
  2. Find BEST odds for each outcome (home/draw/away)
  3. Calculate total implied probability:
     total = (1/best_home) + (1/best_draw) + (1/best_away)
  4. If total < 1.00:
     → ARBITRAGE EXISTS
     → Profit % = (1/total - 1) × 100
     → Stake on outcome X = (1/odds_X) / total × 100
  5. Flag alert with:
     - Match details
     - Bookmakers involved
     - Exact stake percentages
     - Expected profit %
     - Risk notes (odds movement, limits, rules differences)
  6. Re-check every 5 minutes — mark inactive if odds shift
```

---

## Value Bet Detection

Beyond arbitrage, identify "value bets" where bookmaker odds exceed our AI model's probability:

```
If bookmaker_implied_prob < our_model_prob - 5%:
  → FLAG as value bet
  → Show: "Our model gives Spain 78% to beat Cape Verde. 
           Bet365 implies 71%. Potential value: +7%"
```

This requires the AI prediction model (separate system) to feed probabilities into the odds comparison engine.

---

## Frontend Display

### Odds Comparison Table (per match)
```
Match: Spain vs Cape Verde | June 15, 2026 | Group H

Bookmaker    | Spain Win | Draw  | Cape Verde Win | Best?
-------------|-----------|-------|----------------|------
Bet365       | 1.12      | 8.50  | 26.00          |
FanDuel      | 1.14      | 8.00  | 28.00          | ✅ CV
DraftKings   | 1.11      | 9.00  | 25.00          | ✅ Draw
William Hill | 1.13      | 8.50  | 27.00          |
Betway       | 1.10      | 8.80  | 29.00          | ✅ Spain... wait no
                                                     
Best odds highlighted in green. Affiliate links on bookmaker names.
```

### Arb Alert Card
```
⚡ ARBITRAGE DETECTED — Spain vs Cape Verde (h2h)
Profit: 1.8% guaranteed
├─ Bet365: Spain @ 1.12 → Stake 84.2%
├─ DraftKings: Draw @ 9.00 → Stake 10.5%  
└─ FanDuel: Cape Verde @ 28.00 → Stake 5.3%
Total implied: 98.2% | Detected: 2 min ago
⚠️ Odds may shift — act quickly
```

---

## Implementation Timeline

| Week | Task | Status |
|------|------|--------|
| Now | Architecture doc (this) | ✅ |
| Week 1 | Set up Supabase tables, seed match data | TODO |
| Week 2 | Build odds fetcher API route | TODO |
| Week 3 | Build arbitrage detection logic | TODO |
| Week 4 | Build frontend odds comparison UI | TODO |
| Week 5 | Connect The Odds API (paid) | TODO |
| Week 6 | Testing, arb alerts, value bets | TODO |
| June 11 | GO LIVE 🚀 | TODO |

---

## Notes for Boss Jay
- **Total cost: ~$160-200** for the entire World Cup (API fees only during tournament)
- Everything else is free tier (Supabase, Vercel)
- Affiliate links on bookmaker names = revenue from every click
- Arb alerts are the premium feature — could gate behind email signup for lead gen
- The Odds API key is needed — Boss Jay to sign up at the-odds-api.com
