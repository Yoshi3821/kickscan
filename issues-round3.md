# KickScan — Round 3 Issues (Post-Batch-4 QA)
**Logged:** 2026-03-20

## Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 17a | Signup: Allow spaces in display name | HIGH | Pending |
| 17b | Signup: Better avatar selection | MEDIUM | Pending |
| 17c | Signup: Email validation/UX | HIGH | Pending |
| 18 | Private groups support league matches too | MEDIUM-HIGH | Pending |
| 19 | Nav: Public leaderboard link in main menu | MEDIUM | Pending |
| 20 | Profile stats card: Total Groups Joined | MEDIUM | Pending |
| 21 | Prediction card: Show avg market odds | MEDIUM-HIGH | Pending |
| 22 | Private groups: Member self-exit (Leave Group) | HIGH | Pending |
| 23 | Private groups: My Group click → open details | HIGH | Pending |
| 24 | Rename "History" page for clarity | MEDIUM | Pending |
| 25 | My Predictions: Show both team names clearly | HIGH | Pending |
| 26 | Leaderboard maturity / discoverability | MEDIUM-HIGH | Pending |

---

## Detail

### 17a. Display Name Spacing Rule (HIGH)
- Allow spaces in display name / nickname
- Min 3 chars, max 20 chars (spaces count)
- Reject special symbols, trim leading/trailing spaces
- Prevent excessive repeated spaces
- Update helper text to show real rule
- Examples valid: "God of gambler", "Jay Wong", "Sam 88"

### 17b. Avatar Quality / Variety (MEDIUM)
- Current presets feel basic/boring
- Upgrade to more polished icons/art
- Add variety: sports, trophies, mascots, premium/gold, cool/funny
- Boss Jay may provide own avatar pack later

### 17c. Email Validation / UX (HIGH)
- Validate email format in real time or on blur
- Block submit until valid
- Inline error message if invalid
- Normalize to lowercase, trim spaces
- Examples: name@email.com ✅ / name@email ❌ / abc ❌ / @gmail.com ❌

### 18. Private Groups — League Matches Support (MEDIUM-HIGH)
- Phase 1 only: World Cup group OR League Matches group (no mixed mode)
- Creator selects competition type at group creation
- League fairness rules:
  - Only future/unlocked matches can be predicted
  - Started/finished matches locked
  - Late joiners only participate from join point onward
  - No retroactive points

### 19. Public Leaderboard Nav Link (MEDIUM)
- Add "Leaderboard" to main menu/nav
- Points to public/global leaderboard
- Private group leaderboard stays inside groups section

### 20. Profile Stats Card — Total Groups Joined (MEDIUM)
- Add "Total Groups Joined" stat to player profile card
- Uses currently empty/underused space
- Label options: "Groups Joined" / "Total Groups" / "Private Groups Joined"

### 21. Avg Market Odds in Prediction Card (MEDIUM-HIGH)
- Show average market odds below team names in prediction card
- Format: Home / Draw / Away odds
- Highlight market favorite
- Label clearly as "Avg Market Odds"
- Hide gracefully if data unavailable

### 22. Private Groups — Member Self-Exit (HIGH)
- Add "Leave Group" button inside group view
- Confirm dialog before leaving
- After leaving, lose access to group leaderboard/page immediately

### 23. My Group Click → Open Details (HIGH)
- Make group row/card clickable → opens group detail page
- Group detail shows: name, member list, leaderboard, join code/share link
- Admin controls later

### 24. "History" Page Naming Clarity (MEDIUM)
- Current "History" label is confusing (sounds like match results)
- Page is actually a verdict/prediction archive
- Rename to: "Verdict Archive" / "Past Verdicts" / "Prediction Archive"
- Future version could add actual results + correct/wrong tracking

### 25. My Predictions — Show Both Team Names (HIGH)
- Each prediction entry must clearly show Home vs Away team names
- Optionally show match date/time + competition
- Format: "Team A vs Team B"

### 26. Leaderboard Maturity / Discoverability (MEDIUM-HIGH)
- Currently feels like MVP teaser, not core feature
- Needs: main menu access, stronger standalone page, better profile depth
- Should feel like a primary product destination
