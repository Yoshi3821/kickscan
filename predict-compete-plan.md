# Predict & Compete — Tipsters Leaderboard Plan

## Reference: AsianBookie Tipsters Cup (tipsters.asianbookie.net)
- 2,394 tipsters per season
- Season-based (resets every ~2.5 months)
- Virtual currency ($) — start with fixed amount
- Top 100 leaderboard with rank changes
- Individual player pages with bet history
- League-specific rankings (EPL, UCL, etc.)
- BIG BET indicators
- Team formation feature

## KickScan Version — "Predict & Compete"

### User Registration (Simple)
- Username + email (no password for MVP — use magic link or just username)
- Or: connect via social (future)
- Each user gets a profile page

### How It Works
1. User picks any upcoming match
2. Predicts: Match result (Home/Draw/Away) + Score
3. Points system:
   - Correct result (H/D/A): 3 points
   - Correct score: 5 bonus points (8 total)
   - Close score (±1 goal): 1 bonus point (4 total)
4. After match ends, points auto-calculated
5. Leaderboard updates

### Leaderboard
- Global ranking (all users)
- Weekly ranking (this week's best)
- League-specific (EPL only, WC only, etc.)
- "You vs AI" — compare your accuracy to KickScan AI
- Top 100 visible, user can see their own rank

### User Profile Page
- Username, join date
- Total points, rank
- Prediction history (each prediction + result)
- Win rate (%), exact score rate (%)
- Current streak
- Badge system: "🔥 Hot Streak", "🎯 Sniper" (5+ correct scores), "🧠 AI Beater"

### Vote Lock
- Voting/predictions lock at match kickoff
- Cannot change after kickoff
- Results populate automatically from API-Football

### Season System
- World Cup 2026 = Special Season
- Regular seasons = monthly or quarterly
- Prize: bragging rights + badges (future: real prizes)

### Data Storage
- Supabase (free tier) or JSON files for MVP
- Users table: id, username, email, created_at
- Predictions table: user_id, match_id, predicted_result, predicted_score, actual_result, actual_score, points, created_at
- Leaderboard: computed from predictions table

### Priority: Build MVP first
1. Simple username registration (no password)
2. Predict result + score for any match
3. Lock at kickoff
4. Auto-calculate points after match
5. Global leaderboard
6. User profile with history
