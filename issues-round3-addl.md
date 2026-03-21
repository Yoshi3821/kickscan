# KickScan — Round 3 Additional QA Items
**Logged:** 2026-03-20

## Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 31 | Odds display inconsistent across league matches | HIGH | Pending |
| 32 | Profile prediction history needs real match context + clear pick structure | HIGH | Pending |
| 33 | Show fan vote / AI / market signals in prediction card | HIGH | Pending |
| 34 | Leaderboard structure / scope clarity (global vs WC) | HIGH | Pending |

---

## Detail

### 31. Odds Display Inconsistent Across League Matches (HIGH)
- Some cards show avg odds, others don't (same page)
- Root causes to check: team name mismatch, missing bookmaker coverage, cache issues
- Fix matching logic for team name differences between API-Football and Odds API
- If truly unavailable, handle gracefully

### 32. Profile Prediction History — Real Match Context + Clear Pick (HIGH)
- Currently shows internal IDs like "league_1379271"
- Required: both team names, user's pick, predicted score, final score (post-match), win/loss
- Do NOT block mismatched pick + score combos (user may do intentionally)
- Post-match: show FT result, correct/wrong, exact score hit or not

### 33. Fan Vote / AI / Market Signals in Prediction Card (HIGH)
- Show below avg odds, above predict controls
- Fan vote: Home% / Draw% / Away%
- AI pick (+ confidence if available)
- Market pick / lowest-odds favorite
- Compact, mobile-friendly, hide missing signals gracefully

### 34. Leaderboard Structure / Scope Clarity (HIGH)
- 34a: Global = all competitions combined, make clear in UI
- 34b: Separate WC leaderboard, show registered users at 0pts pre-tournament
- 34c: Expand to Top 20 minimum (currently too small)
- No separate league-only leaderboard for now
