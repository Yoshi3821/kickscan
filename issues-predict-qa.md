# KickScan — Predict Page QA Items
**Logged:** 2026-03-20

## Summary

| # | Issue | Priority | Status |
|---|-------|----------|--------|
| 41 | Auth flash — logged-in user sees guest UI for ~1s | HIGH | Pending |
| 42 | Timezone change not reactive — times only update after refresh | HIGH | Pending |
| 43 | Rename "Leagues" tab → "Major League Matches" | MEDIUM | Pending |
| 45 | Mobile UI — cleaner/more premium layout | HIGH | Pending |
| 46 | User input area needs clearer "Your Prediction" design | HIGH | Pending |
| 47 | Add direct link from AI predict to full verdict/analysis page | HIGH | Pending |

---

## Detail

### 41. Auth Flash — Guest UI Before Predict Loads (HIGH)
- Logged-in user briefly sees signup/login/public leaderboard before auth resolves
- Fix: show skeleton/loading state until auth state known, not guest UI

### 42. Timezone Change Not Reactive (HIGH)
- Changing timezone updates label but match card times don't update until refresh
- Fix: wire timezone state reactively into all match card time rendering

### 43. Rename "Leagues" → "Major League Matches" (MEDIUM)
- Current "Leagues" tab label too broad
- Change to "Major League Matches" for clarity

### 45. Mobile UI — Cleaner Premium Layout (HIGH)
- 45a: Stats card — better spacing/alignment, structured not scattered
- 45b: Section hierarchy — timezone row, competition toggle, spacing
- 45c: Premium design — cleaner proportions, typography, alignment
- 45d: Match cards — readable without oversized, elegant spacing

### 46. User Input "Your Prediction" Section (HIGH)
- 46a: Dedicated action card for Predict Result / Score / Booster / Submit
- 46b: Home/Draw/Away as unified control group
- 46c: Score inputs tied to team names, clear alignment
- 46d: Booster inside same action section
- 46e: Submit button belongs to same grouped form

### 47. AI Predict → Full Verdict Link (HIGH)
- Add clickable icon/link beside AI prediction in match card
- Tapping opens full AI verdict/match analysis page for that match
- Suggested: "AI Predict: Napoli Win (55%) [→]"
