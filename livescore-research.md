# KickScan Live Score Research — Competitor Analysis

## Top Live Score Sites Studied

### 1. FlashScore (Market Leader)
**What they do well:**
- Fastest live results — real-time, no refresh needed (WebSocket push)
- Covers 100+ football leagues globally
- Detailed match stats: shots on goal, possession, xG, corners, cards, fouls
- Unique player ratings per match
- Average team rating
- Player of the match
- H2H stats within match view
- Lineups with formation visualization
- Live commentary (text-based play-by-play)
- Match report post-game
- Video highlights integration
- Odds comparison built-in
- News and transfer rumors
- 30+ sports beyond football
- Red flash notification for goals (iconic UX)
- "Big chance" indicator

**What makes users stay:** Speed. FlashScore is consistently 1-3 seconds faster than competitors. The red goal flash is iconic — users feel connected to the game.

**What they're missing:**
- No AI predictions or verdicts
- No fan voting/sentiment
- No "what to bet on" guidance
- Pure data display, no intelligence layer
- Design feels dated/cluttered

### 2. SofaScore
**What they do well:**
- Rich visual statistics (heat maps, shot maps, pass maps)
- Detailed event tracking (every touch, pass, tackle)
- Momentum graph showing match flow
- Player ratings with detailed breakdown
- Attack momentum indicator
- Live match center with pitch visualization
- Standings integration
- Injury tracking
- Pre-match form comparison
- Comprehensive player profiles
- 2 seconds faster than FlashScore for live updates (per Reddit users)

**What makes users stay:** Depth of visual statistics. Football nerds love the heat maps and momentum graphs.

**What they're missing:**
- Overwhelming amount of data for casual users
- No AI intelligence layer
- No betting guidance
- Interface can feel heavy

### 3. FotMob
**What they do well:**
- Clean, modern UI — best design of all competitors
- Strong notification system (goal alerts, lineup alerts, match start)
- Almost instant video highlights when goals scored
- Fantasy points integration
- Clean match browsing — easy to scan
- Strong day-to-day usability
- Good balance between data depth and simplicity

**What makes users stay:** Clean design + great notifications. Users who want a pleasant daily experience choose FotMob.

**What they're missing:**
- Less market/betting focused
- No AI predictions
- Less stat depth than SofaScore
- No live score as fast as FlashScore

### 4. NowGoal
**What they do well:**
- Asian Handicap odds focus (popular in Asia)
- Live odds movement tracking
- Corner kick stats (unique!)
- Detailed odds comparison
- Half-time/full-time stats
- Red card tracking prominent
- Yellow card count visible per match
- Sound notifications for goals
- Customizable league filters

**What makes users stay:** Betting-focused users love the odds integration and Asian Handicap focus. Popular in Asian markets.

**What they're missing:**
- Dated design
- Less intuitive UX
- Heavy/cluttered interface
- No AI layer

### 5. LiveScore.com
**What they do well:**
- Simple, clean, fast
- Focus on core live score experience
- Reliable and trusted brand
- Good mobile app

**What they're missing:**
- Less depth than FlashScore/SofaScore
- Fewer features overall
- No unique differentiator

### 6. AiScore
**What they do well:**
- AI-powered predictions
- No ads (clean experience)
- Dark mode
- Widget for embedding
- Goal alerts

**What they're missing:**
- Smaller community
- Less league coverage
- Less trusted brand

---

## Feature Comparison Matrix

| Feature | FlashScore | SofaScore | FotMob | NowGoal | KickScan (Current) |
|---------|-----------|-----------|--------|---------|-------------------|
| Live scores | ✅ WebSocket | ✅ WebSocket | ✅ | ✅ | ✅ 5-sec poll |
| Goal scorers | ✅ | ✅ | ✅ | ✅ | ✅ |
| Cards (Y/R) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Corners | ✅ | ✅ | ❌ | ✅ | ❌ |
| Possession | ✅ | ✅ | ✅ | ❌ | ❌ |
| xG data | ✅ | ✅ | ✅ | ❌ | ❌ |
| Shot map | ❌ | ✅ | ❌ | ❌ | ❌ |
| Heat map | ❌ | ✅ | ❌ | ❌ | ❌ |
| Momentum graph | ❌ | ✅ | ❌ | ❌ | ❌ |
| Player ratings | ✅ | ✅ | ✅ | ❌ | ❌ |
| Lineups | ✅ | ✅ | ✅ | ✅ | ❌ |
| Formation visual | ✅ | ✅ | ✅ | ❌ | ❌ |
| Live commentary | ✅ | ✅ | ❌ | ❌ | ❌ |
| Video highlights | ✅ | ❌ | ✅ | ❌ | ❌ |
| H2H stats | ✅ | ✅ | ✅ | ✅ | ✅ |
| Odds comparison | ✅ | ❌ | ❌ | ✅ | ✅ |
| Goal notifications | ✅ Sound | ✅ | ✅ Push | ✅ Sound | ❌ |
| AI predictions | ❌ | ❌ | ❌ | ❌ | ✅ ← UNIQUE |
| AI verdicts | ❌ | ❌ | ❌ | ❌ | ✅ ← UNIQUE |
| Fan voting | ❌ | ❌ | ❌ | ❌ | ✅ ← UNIQUE |
| Intelligence comparison | ❌ | ❌ | ❌ | ❌ | ✅ ← UNIQUE |

---

## KickScan Improvement Plan (Priority Order)

### HIGH PRIORITY (should add)
1. **Match statistics page** — when clicking into a live match, show: possession, shots, shots on target, corners, fouls, offsides
   - API-Football has this data via `/fixtures/statistics` endpoint
   - Show during/after match
   
2. **Lineups with formation** — show starting XI in formation view
   - API-Football provides lineups via `/fixtures/lineups`
   - Available ~1 hour before kickoff
   
3. **Goal notification/flash** — when a goal is scored, flash the match row green + play subtle animation
   - Already partially implemented (goal-flash CSS)
   - Need to compare previous state with new state on refresh

4. **Expandable match detail** — clicking a match on live scores shows: events timeline, basic stats, lineups
   - Currently links to full match page — add inline expansion too

### MEDIUM PRIORITY (nice to have)
5. **Live commentary** — text-based play-by-play events
   - API-Football has match events — could format as commentary

6. **Standings mini-view** — show current league table context alongside live scores
   - API-Football provides standings

7. **Favorite teams/leagues** — let users pin their favorite teams so those always show on top
   - Use localStorage to store favorites

### LOWER PRIORITY (future)
8. **Momentum graph** — visual match flow indicator (like SofaScore)
   - Would need detailed event data to compute

9. **Push notifications** — goal alerts via browser notifications
   - Requires service worker / PWA setup

10. **Video highlights** — integrate ScoreBat or similar
    - Had this in the old widget, could bring back

---

## Key Insight for KickScan

**We should NOT try to beat FlashScore at being FlashScore.** They have 15+ years of data infrastructure and WebSocket connections.

**Our edge is the INTELLIGENCE LAYER.** No competitor has:
- AI verdicts
- Fan vs AI vs Market comparison
- Value detection
- Prediction game

**Strategy: Good enough live scores + best-in-class intelligence.**

Users come for the live scores, stay for the verdicts. The live score page should be "good enough" to not need FlashScore, but the intelligence features are why they choose us.

**The #1 improvement to make NOW:** Add match statistics (possession, shots, corners) to the expanded match view on live scores. This is the biggest gap between us and FlashScore that's easy to close with API-Football data.
