# Match Analysis Intelligence — Prediction Methodology Research

*Research compiled: March 19, 2026*
*Purpose: Improve KickScan.io's AI Verdict engine with deeper, differentiated analysis*

---

## 1. Core Prediction Models

### 1.1 Poisson Distribution Model

**What it does:** Predicts the probability of each possible scoreline based on historical goal-scoring averages.

**How it works:**
1. Calculate Team A's average goals scored per game (attack strength)
2. Calculate Team B's average goals conceded per game (defense weakness)
3. Combine to get expected goals for Team A in this specific match
4. Repeat for Team B
5. Apply the Poisson formula: P(x) = (λ^x × e^-λ) / x!
6. Generate a probability matrix of all scorelines (0-0 through 5-5+)
7. Sum probabilities for Home Win / Draw / Away Win

**Strengths:**
- Simple, transparent, mathematically sound
- Good for predicting total goals and correct scores
- Easy to explain to users

**Weaknesses:**
- Assumes goals are independent events (they're not — game state changes after a goal)
- Doesn't account for in-game tactical shifts
- Historically undercounts draws (correlation between home/away goals)
- Pure historical averages can lag behind current form

**KickScan application:** Use as a baseline model. Show scoreline probability matrices to users. Layer other signals on top.

---

### 1.2 ELO Rating System

**What it does:** Assigns each team a dynamic strength rating that updates after every match based on result and opponent quality.

**How it works:**
1. Each team starts with a base rating (typically 1500)
2. After each match, ratings adjust based on:
   - Actual result vs. expected result
   - Opponent strength (beating a strong team = bigger gain)
   - K-factor (how much each match matters — higher for World Cup than friendlies)
3. Expected score: E = 1 / (1 + 10^((Rb - Ra) / 400))
4. New rating: R_new = R_old + K × (S - E)

**Strengths:**
- Naturally accounts for strength of schedule
- Captures team momentum over time
- Simple to maintain and update
- Good for ranking/comparison purposes

**Weaknesses:**
- Doesn't consider *how* a team won (1-0 scrappy win vs. dominant 1-0)
- Ignores injuries, tactical changes, squad rotation
- Slow to react to sudden changes (new manager, key transfers)
- No in-game granularity

**KickScan application:** Use for team power rankings and as input to ensemble model. Great for "who's stronger" context in match previews.

---

### 1.3 FiveThirtyEight's Soccer Power Index (SPI)

**What it does:** The gold standard composite model. Combines multiple performance metrics into offensive and defensive ratings per team.

**How it works (key innovations):**
1. **Three-metric composite performance:**
   - **Adjusted Goals** — Downweights goals scored when a team is leading after 70th minute, and goals scored with numerical advantage (extra man). Prevents "flattering" scorelines from inflating ratings.
   - **Shot-Based xG** — Expected goals from actual shots taken, adjusted for shooter quality (e.g., Messi converts 1.4x the expected rate)
   - **Non-Shot xG** — Expected goals from non-shooting actions near the goal: passes, interceptions, take-ons, tackles in the box area. Captures danger created even without a shot.

2. **Pre-season calibration:** Uses Transfermarkt market values as a proxy for squad quality before the season starts

3. **Match forecasting:** Converts SPI ratings to expected goals → Poisson distributions → scoreline probability matrix → Win/Draw/Loss probabilities

**Why it matters for KickScan:**
- The "adjusted goals" concept is brilliant — prevents our model from overrating teams that pad stats in dead-rubber time
- Non-shot xG captures sustained pressure that doesn't show up in shot counts
- Player-specific adjustments (shot conversion modifiers) add genuine edge

---

### 1.4 Logistic Regression

**What it does:** Predicts Win/Draw/Loss probabilities using multiple input variables weighted by historical correlation.

**Typical inputs:**
- Team ELO/strength rating
- Home advantage factor
- Recent form (last 5-10 matches)
- Head-to-head record
- Goals scored/conceded ratios
- xG differentials

**Strengths:**
- Flexible — can incorporate any quantifiable factor
- Interpretable — you can see which factors matter most
- Good for identifying which variables actually predict outcomes

**Weaknesses:**
- Requires significant historical data to train properly
- Assumes linear relationships (not always true in football)
- Garbage in, garbage out — variable selection is critical

**KickScan application:** Use to weight different factors in our verdict engine. Helps us know *which* stats actually matter for predictions.

---

### 1.5 Machine Learning / Neural Networks

**What it does:** Learns complex, non-linear patterns from large datasets that simpler models miss.

**Common approaches:**
- **Random Forests** — Multiple decision trees that vote on outcomes. Good at handling many variables without overfitting.
- **Gradient Boosting (XGBoost/LightGBM)** — Iteratively builds trees that correct previous errors. Currently the most popular in competition settings.
- **Neural Networks** — Deep learning for pattern recognition across massive feature sets. Can incorporate unstructured data (text, images).

**What makes ML different:**
- Can detect interaction effects (e.g., "Team A performs badly away AND in hot weather AND against pressing teams" — a combination simple models miss)
- Can incorporate hundreds of features simultaneously
- Adapts as new data arrives

**Weaknesses:**
- Black box — hard to explain *why* a prediction was made
- Requires large training datasets
- Risk of overfitting to historical patterns that don't repeat
- Computationally expensive

**KickScan application:** Use for the AI layer that provides natural-language explanations. ML finds the patterns; AI translates them into insights users can understand.

---

## 2. Advanced Football Metrics (Beyond Basic xG)

These are the data points that can differentiate KickScan from generic prediction sites.

### 2.1 Expected Goals (xG) — Deep Dive
- Assigns each shot a probability (0 to 1) based on: distance, angle, body part, assist type, game state, goalkeeper position
- **npxG (Non-Penalty xG)** — Strips out penalties for cleaner open-play assessment
- **xG per shot (xG/Sh)** — Quality of chances created, not just volume
- **xG difference (xG - Goals)** — Teams consistently outperforming xG may have elite finishers; underperformers may regress

### 2.2 Expected Assists (xA)
- Measures pass quality leading to shots, based on the resulting shot's xG value
- Identifies creative players even when teammates fail to finish
- **Key for World Cup:** Shows which teams create the best chances, regardless of finishing quality

### 2.3 PPDA (Passes Per Defensive Action)
- Measures pressing intensity: how many opponent passes allowed before a defensive action in the attacking 40% of the pitch
- **Low PPDA (6-8)** = intense pressing (Klopp's Liverpool, Nagelsmann's Germany)
- **High PPDA (15+)** = passive/low-block defending (Mourinho-style)
- **Critical insight:** PPDA measures pressing *intent*, not pressing *quality*. Must pair with pressure regains.

### 2.4 Pressure Regains
- Ball recoveries within 5 seconds of applying pressure
- Separates effective pressing from chaotic running
- **World Cup relevance:** Teams with high pressure regains in the opponent's third create more chances from turnovers

### 2.5 Progressive Passes & Carries
- **Progressive passes:** Move the ball significantly closer to goal (30m in own half, 15m crossing halfway, 10m in opponent's half)
- **Progressive carries:** Dribbles that advance the ball by 10+ yards toward goal
- **Why it matters:** Identifies teams/players that break lines vs. those that recycle possession safely

### 2.6 Deep Progressions
- Passes and carries entering the opponent's final third
- Measures territorial advancement, not finishing
- **Pairing with xG:** High deep progressions + low xG = team gets forward but can't create clear chances (potential tactical issue)

### 2.7 Field Tilt
- Percentage of touches in the opponent's final third
- Simple measure of territorial dominance
- **Warning:** High field tilt ≠ winning. Some teams (counter-attacking) win with low field tilt.

### 2.8 Expected Possession Value (EPV)
- Assigns a goal-scoring probability to every point of possession on the pitch
- More advanced than xG because it values *buildup*, not just shots
- **Cutting edge:** Used in Bundesliga analysis (2025 Frontiers paper). EPV models can predict outcomes better than xG alone when combined with ML.

### 2.9 Expected Ball Gain (xBG)
- Predicts the probability of winning the ball back at a given pitch location
- Measures defensive proactiveness and positioning
- **Pairing:** xBG + EPV shows which teams are best at winning the ball in dangerous positions

---

## 3. What Top Prediction Sites Do

### FiveThirtyEight (SPI Model)
- Composite: Adjusted goals + Shot xG + Non-shot xG
- Pre-season: Transfermarkt market values
- Post-match: Full Opta event data
- **Edge:** Non-shot xG (unique to them at launch)

### Forebet
- Poisson-based with proprietary adjustments
- Covers 700+ leagues
- Historical data going back decades
- **Edge:** Volume and coverage

### FotMob
- xG-focused with visual shot maps
- Player-level data and ratings
- **Edge:** UX and mobile-first design

### Opta/Stats Perform
- The raw data provider behind most models
- Tracks every event: passes, tackles, shots, carries, pressures
- **Edge:** They ARE the data

### Betting Markets Themselves
- Bookmaker odds represent the aggregated wisdom of millions of bettors + the bookmaker's own models
- Often the single best predictor of match outcomes
- **Edge:** Massive data set + financial incentive to be accurate

---

## 4. How KickScan's AI Verdict Can Be DIFFERENT

### The Problem with Most Prediction Sites
1. **They're numbers-only** — Show xG, show probabilities, leave interpretation to the user
2. **They ignore context** — A 60% win probability doesn't explain *why*
3. **They're backward-looking** — Based on what happened, not what's about to happen
4. **They can't tell stories** — Football fans want narratives, not spreadsheets

### KickScan's Differentiation Strategy

#### A. Contextual AI Narratives
Don't just say "Team A: 58% win probability." Instead:
> "Germany's high press (PPDA: 7.2) should suffocate Japan's slow buildup, but Japan's counter-attacking speed (2.1 progressive carries per attack) is exactly the weapon that hurt Germany in Qatar 2022. If Japan can survive the first 30 minutes, this gets dangerous."

**This is what AI does that models can't.** It synthesizes data into stories.

#### B. Tactical Matchup Analysis
Go beyond team-level stats to tactical interactions:
- How does Team A's pressing style match up against Team B's buildup pattern?
- Does Team A's width create space for Team B's central runners?
- Are there specific player matchups that could decide the game?

#### C. Situational Modifiers (What Models Miss)
- **Motivation context:** Must-win vs. already-qualified changes everything
- **Travel/climate:** Mexico City altitude, Houston heat, Seattle rain
- **Manager tendencies:** Some managers consistently change shape for big games
- **Tournament psychology:** Teams that historically choke vs. teams that peak
- **Recovery time:** 3 days between matches vs. 4 days matters at World Cup level

#### D. "The Story Behind the Stats"
For every match, provide:
1. **The Data View** — Key metrics, probabilities, model output
2. **The Tactical View** — How styles clash, key matchups, what to watch
3. **The Narrative View** — Why this match matters, historical context, emotional stakes
4. **The Betting View** — Where value exists, which markets are mispriced, what the sharp money says

#### E. Live Adaptation
- Update verdicts with in-game data (xG flow, momentum shifts, red cards)
- Flag when a match is deviating significantly from pre-match expectations
- "The model expected X, but here's what's actually happening"

---

## 5. Data Sources for Implementation

| Data Need | Source | Cost | Notes |
|-----------|--------|------|-------|
| Live odds | The Odds API | Already integrated | Good for value detection |
| Match events (xG, shots) | Opta / Stats Perform | Expensive ($$$) | Gold standard |
| Free xG data | Understat, FBref | Free | Good for historical, delayed for live |
| ELO ratings | clubelo.com, eloratings.net | Free | Updated regularly |
| Player data | Transfermarkt API | Free/scrape | Market values, injuries, transfers |
| Weather | Open-Meteo | Free | Match-day conditions |
| Historical results | Football-Data.co.uk | Free | Decades of results + odds |

### Recommended Priority
1. **Phase 1:** Use free sources (FBref, Understat, ELO) + The Odds API for MVP
2. **Phase 2:** Add Transfermarkt data for squad quality context
3. **Phase 3:** If revenue justifies it, integrate Opta for real-time event data

---

## 6. Key Takeaways for KickScan

1. **Ensemble > Single Model** — Combine Poisson baseline + ELO rankings + xG analysis. Research shows ensembles (averaging multiple models) outperform individual models consistently.

2. **AI is the differentiator** — Every site can show xG. Only KickScan can tell the STORY of why those numbers matter for this specific match.

3. **Context is king** — Motivation, fatigue, travel, climate, manager history, psychological factors. These are what models miss and what AI can synthesize.

4. **Be honest about uncertainty** — Football is inherently unpredictable. Show confidence ranges, not false precision. "We're 55-65% confident" is more honest than "58.3%."

5. **Make it actionable** — Every verdict should answer: "So what should I do?" Whether that's a betting angle, a match to watch, or a player to track.

6. **Speed matters** — In-play insights delivered faster than competitors create genuine value for bettors.

---

## Next Steps

- [ ] Build prototype verdict template incorporating these insights
- [ ] Identify which free data sources to integrate first
- [ ] Design the "4-view" match analysis format (Data / Tactical / Narrative / Betting)
- [ ] Test ensemble model accuracy against bookmaker odds (the benchmark)
- [ ] Create a tactical matchup framework for World Cup 2026 groups
