# KickScan Dev Tickets — Round 2 (Post-Deploy QA)
**Created:** 2026-03-20
**Status:** Logged, awaiting priority approval from Boss Jay

## HIGH
| # | Title | Type | Status |
|---|-------|------|--------|
| 1 | Auth state bug — navbar shows guest after login | Bug | Pending |
| 5 | Nickname uniqueness check — inline error UX | Bug/UX | Pending |
| 6 | Mobile login modal position — off-screen/blocked | Bug (login blocker) | Pending |
| 12 | Prediction lock 5min before kickoff + live match card | Feature | Pending |
| 15 | Livescore page full redesign (readability, score hierarchy, events, filters, KickScan differentiator) | Feature | Pending |

## HIGH/MEDIUM
| # | Title | Type | Status |
|---|-------|------|--------|
| 2 | Missing "Forgot password" flow | Feature | Pending |
| 9a | KickScan AI as visible leaderboard participant | Feature | Pending |
| 9b | Public player profile pages | Feature | Pending |
| 9c | Clickable leaderboard entries → profile | Feature | Pending |
| 9d | Pick visibility rule (hide current, show past) | Feature | Pending |
| 10a | Group admin — kick/remove members | Feature | Pending |
| 10b | Member self-exit from groups | Feature | Pending |
| 10c | Permission model (admin vs member) | Feature | Pending |
| 10d | Removal behavior (access + history) | Feature | Pending |
| 10e | Future: stronger group access controls | Feature (future) | Pending |
| 11 | Past verdict records / history archive | Feature | Pending |

## MEDIUM
| # | Title | Type | Status |
|---|-------|------|--------|
| 3 | Missing "Forgot username" / account recovery guidance | Feature | Pending |
| 4 | Nickname validation — clear rules + error messages | UX | Pending |
| 7 | Homepage feature card — add Private Groups | UX | Pending |
| 8 | Nav labels — clarify World Cup scope (Verdicts → WC AI Verdicts, Matches → WC Fixtures) | UX | Pending |
| 13 | Logout placement — move out of player card into menu | UX | Pending |
| 14 | User avatar / profile image (preset first, upload later) | Feature | Pending |

## HIGH (Added Post-Batch)
| # | Title | Type | Status |
|---|-------|------|--------|
| 16 | User timezone support — auto-detect + manual override + consistent display | Feature | Pending |

## Detail Notes

### 16. User Timezone Support
- Auto-detect browser timezone on first visit (Intl.DateTimeFormat().resolvedOptions().timeZone)
- Save preference in localStorage (Phase 1) and Supabase (Phase 2)
- Manual override in profile/settings
- All match times, countdowns, lock timers use user's timezone
- Fallback: America/New_York
- Show timezone label where helpful ("Times shown in Asia/Singapore")
- Affects: predict page, live scores, fixtures, match pages

### 1. Auth State Bug
- Navbar reads localStorage on mount but /predict page manages its own auth state
- Shared state needed (React context or event-based sync)

### 5. Nickname Uniqueness
- API already returns error on duplicate — need inline display before form submit

### 6. Mobile Login Modal
- Modal likely not vertically centered, header overlap, missing overflow-y handling

### 12. Prediction Lock
- Lock 5min before kickoff
- After kickoff: hide controls, show live card with user's prediction + live score

### 15. Livescore Redesign
- No team name truncation (multi-line wrap)
- Score as main visual focus
- Goal scorers, cards, timeline from API-Football
- Expandable match details
- Filters: Live / Today / Top Leagues / World Cup
- KickScan differentiator: AI verdict + fan vote + odds + user prediction overlay
