# KickScan — QA Items March 21
**Logged:** 2026-03-21

## Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 55 | Leaderboard profile link → "Player not found" | HIGH | Pending |
| 56 | Live match should show live score + locked prediction | HIGH | Pending |
| 57 | Live/finished match cards should not disappear | HIGH | Pending |
| 59 | Picks count clickable → open pending picks / allow cancel | HIGH | Pending |
| 60 | AI Verdict page — add Verdict History tab for past results | HIGH | Pending |
| 61 | Post-match settlement delay — points not updated after finish | HIGH | Pending |
| 62 | Profile page — Joined date shows "Invalid Date" | HIGH | Pending |
| 63 | Profile page — Leaderboard link goes to /predict instead of /leaderboard | HIGH | Pending |

---

## Detail

### 55. Leaderboard Profile Link → Player Not Found (HIGH)
- Real user on leaderboard, clicking opens "Player not found"
- Check: username slug, case sensitivity, spacing normalization, profile lookup field

### 56. Live Match — Show Live Score + Locked Prediction (HIGH)
- Live match card should: lock prediction, hide edit controls, show live score/minute/status, show user's submitted pick

### 57. Live/Finished Cards Should Not Disappear (HIGH)
- Keep live cards visible with score + locked pick
- After FT: move to "Finished/Recent Results" section, visible 12h
- Show final score, user pick, predicted score, win/lose, booster

### 58. (skipped)

### 59. Picks Count Clickable → Pending Picks + Cancel (HIGH)
- Stats bar "Picks" count should link to profile/prediction list
- Show pending picks, allow cancel before lock window
- No cancel if locked/live/finished

### 60. AI Verdict — Add Verdict History Tab (HIGH)
- Current page shows upcoming only
- Add "Verdict History" tab: past matches, AI prediction vs actual result, correct/wrong

### 61. Post-Match Settlement Delay (HIGH)
- Points not updating after match finish (~10 min delay)
- Check: settlement trigger (manual/cron/polling), data source, leaderboard recalc

### 62. Profile — "Invalid Date" for Joined Date (HIGH)
- Profile shows "Invalid Date" instead of registration date
- Check: created_at field, API response, frontend date parsing, null handling

### 63. Profile — Leaderboard Link Goes to /predict (HIGH)
- Profile page leaderboard link still points to /predict instead of /leaderboard
- Update all old references
