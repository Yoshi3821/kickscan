# KickScan — Pre-5C Remaining Items
**Logged:** 2026-03-20

## Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 35 | Profile prediction history still showing raw internal format | HIGH | Pending |
| 36 | Leaderboard nav UX — flash/jump before landing on leaderboard | HIGH | Pending |
| 37 | Predict page UI upgrade — odds + signals box spacing/typography | HIGH | Pending |
| 39 | Verdict page rename + add league verdicts + sort upcoming first | HIGH | Pending |
| 40 | WC page — compact group tables + tournament bracket view | HIGH | Pending |

---

## Detail

### 35. Profile Prediction History Still Raw (HIGH)
- Live site still shows "league_1379270", "Away Win 2-0", "Pending"
- New structured format (Team A vs Team B, Pick, Score, Result) not rendering
- Check: cached build, wrong component rendering, API fields not consumed
- Must verify production is serving updated profile page

### 36. Leaderboard Nav UX — No Flash/Jump (HIGH)
- Clicking "Leaderboard" from nav shows signup/login first, then jumps to leaderboard after 1-2s
- Should land directly on leaderboard section immediately
- Fix: scroll after layout ready, or dedicated section/page, or precompute target
- Must work for both guest and logged-in users

### 37. Predict Page UI — Odds + Signals Box Polish (HIGH)
- 37a: Avg Market Odds — bigger numbers, reduce wasted space, better balance
- 37b: Rename "Match Signals" → "KickScan Prediction"
- 37c: AI prediction — show "AI Predict: Team Win (55%)" + correct score predict (top 2)
- 37d: Market prediction — show "Market Predict: Team Win" + correct score if available
- 37e: Increase font sizes, reduce empty space, mobile readability

### 39. Verdict Page Rename + League Verdicts + Sort (HIGH)
- 39a: Rename "Verdict Archive" → "AI Verdict"
- 39b: Add league AI verdicts (above WC verdicts, since leagues are active now)
- 39c: Sort upcoming matches by nearest kickoff first
- Recommended structure: League AI Verdicts → WC 2026 AI Verdicts

### 40. WC Page — Group Tables + Bracket (HIGH)
- 40a: Compact group tables (A-L) below header text, standard football table (Team/MP/W/D/L/GF/GA/GD/Pts)
- 40b: Tournament bracket / path view (R32/R16/QF/SF/Final)
- 40c: Mobile-friendly, compact, clean design
- MVP order: group tables first, simplified bracket second
