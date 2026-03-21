import type { LeagueFixture, TeamForm, H2HResult, InjuryInfo, FixtureOdds } from './league-api';

export interface MarketExtras {
  totalLine?: number;
  overOdds?: number;
  underOdds?: number;
  bttsYes?: number;
  bttsNo?: number;
}

export interface AutoVerdict {
  fixtureId: number;
  league: string;
  home: string;
  away: string;
  homeLogo: string;
  awayLogo: string;
  date: string;
  venue: string;
  recommendation: "BET" | "LEAN" | "SKIP" | "AVOID";
  pick: string;
  pickType: "home" | "draw" | "away";
  valueRating: 1 | 2 | 3 | 4 | 5;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";
  confidencePct: number;
  reasoning: string;
  homeForm: string;
  awayForm: string;
  h2h: H2HResult[];
  injuries: InjuryInfo[];
  odds: FixtureOdds[];
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  predictedScore: string;
  scoreExplanation: string;
  alternateScore?: string;
  longshotScore?: string;
}

// Poisson probability: P(X=k) = (λ^k * e^-λ) / k!
function poissonPmf(lambda: number, k: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

// Build a score probability grid (0-0 to maxGoals-maxGoals)
function buildScoreGrid(homeXG: number, awayXG: number, maxGoals = 5): { home: number; away: number; prob: number }[] {
  const grid: { home: number; away: number; prob: number }[] = [];
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      grid.push({ home: h, away: a, prob: poissonPmf(homeXG, h) * poissonPmf(awayXG, a) });
    }
  }
  // Sort by probability descending
  grid.sort((a, b) => b.prob - a.prob);
  return grid;
}

// Team strength ratings for major leagues (simplified)
const TEAM_STRENGTH: Record<string, number> = {
  // Premier League
  "Manchester City": 95, "Arsenal": 90, "Liverpool": 88, "Chelsea": 85, "Manchester United": 82,
  "Tottenham": 78, "Newcastle": 75, "Aston Villa": 72, "West Ham": 68, "Brighton": 65,
  "Crystal Palace": 60, "Fulham": 58, "Wolves": 56, "Everton": 54, "Brentford": 52,
  "Nottingham Forest": 50, "Leicester City": 48, "Southampton": 45, "Ipswich": 42, "Bournemouth": 40,
  
  // La Liga
  "Real Madrid": 94, "Barcelona": 90, "Atletico Madrid": 85, "Real Sociedad": 75, "Athletic Bilbao": 72,
  "Villarreal": 70, "Valencia": 65, "Sevilla": 68, "Real Betis": 62, "Girona": 58,
  
  // Serie A
  "Inter Milan": 88, "Juventus": 85, "AC Milan": 82, "Napoli": 80, "Roma": 75,
  "Atalanta": 78, "Lazio": 72, "Fiorentina": 68, "Bologna": 62, "Torino": 55,
  
  // Bundesliga
  "Bayern Munich": 92, "Borussia Dortmund": 82, "RB Leipzig": 78, "Bayer Leverkusen": 85,
  "Eintracht Frankfurt": 70, "VfL Wolfsburg": 65, "Borussia Monchengladbach": 62, "Union Berlin": 58,
  
  // Champions League (additional top teams)
  "PSG": 88, "Benfica": 75, "Porto": 72, "Ajax": 70, "Celtic": 65,
};

// Get team strength or estimate based on league
function getTeamStrength(teamName: string, leagueId: number): number {
  if (TEAM_STRENGTH[teamName]) {
    return TEAM_STRENGTH[teamName];
  }
  
  // Default estimates by league
  switch (leagueId) {
    case 39: return 60; // Premier League average
    case 140: return 58; // La Liga average
    case 135: return 56; // Serie A average
    case 78: return 55; // Bundesliga average
    case 2: return 70; // Champions League average
    default: return 50;
  }
}

// Analyze team form and return win/draw/loss counts
function analyzeForm(form: string): { wins: number; draws: number; losses: number } {
  const wins = (form.match(/W/g) || []).length;
  const draws = (form.match(/D/g) || []).length;
  const losses = (form.match(/L/g) || []).length;
  return { wins, draws, losses };
}

// Generate reasoning text from data
function generateReasoning(
  fixture: LeagueFixture,
  homeForm: TeamForm | null,
  awayForm: TeamForm | null,
  h2h: H2HResult[],
  injuries: InjuryInfo[],
  odds: FixtureOdds[],
  homeWinPct: number,
  awayWinPct: number,
  drawPct: number,
  pick: string
): string {
  const reasoningParts: string[] = [];
  
  // Form analysis
  if (homeForm && awayForm) {
    const homeAnalysis = analyzeForm(homeForm.form);
    const awayAnalysis = analyzeForm(awayForm.form);
    
    if (homeAnalysis.wins >= 4) {
      reasoningParts.push(`${fixture.home.name} are in flying form with ${homeAnalysis.wins} wins in their last 5 games.`);
    } else if (homeAnalysis.wins <= 1) {
      reasoningParts.push(`${fixture.home.name} have struggled recently with only ${homeAnalysis.wins} win in their last 5.`);
    }
    
    if (awayAnalysis.wins >= 4) {
      reasoningParts.push(`${fixture.away.name} arrive in excellent form with ${awayAnalysis.wins} wins from their last 5 matches.`);
    } else if (awayAnalysis.wins <= 1) {
      reasoningParts.push(`${fixture.away.name}'s poor form (${awayAnalysis.wins} win in 5) suggests they'll struggle here.`);
    }
  }
  
  // H2H analysis
  if (h2h.length > 0) {
    const homeH2HWins = h2h.filter(match => 
      (match.home === fixture.home.name && match.homeGoals > match.awayGoals) ||
      (match.away === fixture.home.name && match.awayGoals > match.homeGoals)
    ).length;
    
    const awayH2HWins = h2h.filter(match => 
      (match.home === fixture.away.name && match.homeGoals > match.awayGoals) ||
      (match.away === fixture.away.name && match.awayGoals > match.homeGoals)
    ).length;
    
    if (homeH2HWins > awayH2HWins && homeH2HWins >= 3) {
      reasoningParts.push(`History favors ${fixture.home.name} — they've won ${homeH2HWins} of the last ${h2h.length} meetings.`);
    } else if (awayH2HWins > homeH2HWins && awayH2HWins >= 3) {
      reasoningParts.push(`${fixture.away.name} hold the edge historically with ${awayH2HWins} wins in the last ${h2h.length} encounters.`);
    }
  }
  
  // Injury analysis
  const homeInjuries = injuries.filter(inj => inj.team === fixture.home.name);
  const awayInjuries = injuries.filter(inj => inj.team === fixture.away.name);
  
  if (homeInjuries.length > 2) {
    reasoningParts.push(`${fixture.home.name} are weakened by key injuries including ${homeInjuries[0].player}.`);
  }
  if (awayInjuries.length > 2) {
    reasoningParts.push(`${fixture.away.name} are missing important players like ${awayInjuries[0].player}.`);
  }
  
  // Odds value analysis
  if (odds.length > 0) {
    const avgHomeOdds = odds.reduce((sum, odd) => sum + odd.home, 0) / odds.length;
    const avgAwayOdds = odds.reduce((sum, odd) => sum + odd.away, 0) / odds.length;
    const avgDrawOdds = odds.reduce((sum, odd) => sum + odd.draw, 0) / odds.length;
    
    const marketHomeProb = Math.round((1 / avgHomeOdds) * 100);
    const marketAwayProb = Math.round((1 / avgAwayOdds) * 100);
    const marketDrawProb = Math.round((1 / avgDrawOdds) * 100);
    
    if (pick.includes("Win") && homeWinPct > marketHomeProb + 5) {
      reasoningParts.push(`The market has ${fixture.home.name} at ${marketHomeProb}% implied probability, but our analysis suggests ${homeWinPct}% — solid value.`);
    } else if (pick.includes(fixture.away.name) && awayWinPct > marketAwayProb + 5) {
      reasoningParts.push(`Market underprices ${fixture.away.name} at ${marketAwayProb}% when they should be closer to ${awayWinPct}%.`);
    }
  }
  
  // Fallback reasoning if no specific factors found
  if (reasoningParts.length === 0) {
    reasoningParts.push(`Based on current form and team strength analysis, ${pick.replace(" Win", "")} represents the most likely outcome.`);
  }
  
  return reasoningParts.slice(0, 3).join(" ");
}

// Main function to generate auto verdict
export function generateAutoVerdict(
  fixture: LeagueFixture,
  homeForm: TeamForm | null,
  awayForm: TeamForm | null,
  h2h: H2HResult[],
  injuries: InjuryInfo[],
  odds: FixtureOdds[],
  marketExtras?: MarketExtras
): AutoVerdict {
  // Calculate team strengths
  const homeStrength = getTeamStrength(fixture.home.name, fixture.league.id);
  const awayStrength = getTeamStrength(fixture.away.name, fixture.league.id);
  const strengthDiff = homeStrength - awayStrength;
  
  // Base probabilities from strength difference
  let homeProb = 0.40 + (strengthDiff * 0.01);
  let drawProb = 0.28 - (Math.abs(strengthDiff) * 0.003);
  let awayProb = 1 - homeProb - drawProb;
  
  // Form adjustments
  if (homeForm && awayForm) {
    const homeFormBonus = (analyzeForm(homeForm.form).wins * 0.02) - 0.04;
    const awayFormBonus = (analyzeForm(awayForm.form).wins * 0.02) - 0.04;
    
    homeProb += homeFormBonus;
    awayProb += awayFormBonus;
    drawProb = 1 - homeProb - awayProb;
  }
  
  // H2H adjustments
  if (h2h.length > 0) {
    const homeH2HWins = h2h.filter(match => 
      (match.home === fixture.home.name && match.homeGoals > match.awayGoals) ||
      (match.away === fixture.home.name && match.awayGoals > match.homeGoals)
    ).length;
    
    const h2hBonus = (homeH2HWins / h2h.length - 0.5) * 0.1;
    homeProb += h2hBonus;
    awayProb -= h2hBonus;
  }
  
  // Normalize probabilities
  homeProb = Math.max(0.15, Math.min(0.70, homeProb));
  awayProb = Math.max(0.15, Math.min(0.70, awayProb));
  drawProb = Math.max(0.15, Math.min(0.45, drawProb));
  
  const total = homeProb + drawProb + awayProb;
  homeProb /= total;
  drawProb /= total;
  awayProb /= total;
  
  const homeWinPct = Math.round(homeProb * 100);
  const drawPct = Math.round(drawProb * 100);
  const awayWinPct = 100 - homeWinPct - drawPct;
  
  // Determine pick and recommendation
  let pick: string;
  let pickType: "home" | "draw" | "away";
  let recommendation: AutoVerdict["recommendation"];
  let valueRating: AutoVerdict["valueRating"];
  let riskLevel: AutoVerdict["riskLevel"];
  let confidencePct: number;
  
  // Find highest probability outcome
  if (homeWinPct >= drawPct && homeWinPct >= awayWinPct) {
    pick = `${fixture.home.name} Win`;
    pickType = "home";
  } else if (awayWinPct >= drawPct && awayWinPct >= homeWinPct) {
    pick = `${fixture.away.name} Win`;
    pickType = "away";
  } else {
    pick = "Draw";
    pickType = "draw";
  }
  
  // Calculate value vs market odds
  let valueGap = 0;
  if (odds.length > 0) {
    const avgOdds = odds.reduce((sum, odd) => {
      return sum + (pickType === "home" ? odd.home : pickType === "away" ? odd.away : odd.draw);
    }, 0) / odds.length;
    
    const marketProb = 1 / avgOdds;
    const aiProb = pickType === "home" ? homeProb : pickType === "away" ? awayProb : drawProb;
    valueGap = (aiProb - marketProb) * 100;
  }
  
  // Determine recommendation — blend odds-derived edge with model confidence
  const strengthGap = Math.abs(homeStrength - awayStrength);
  
  // Base confidence from the pick's probability
  const pickProb = pickType === "home" ? homeProb : pickType === "away" ? awayProb : drawProb;
  const baseConfidence = Math.round(pickProb * 100);

  // Adjust confidence with market agreement (if odds available)
  let marketAgreement = 0;
  if (odds.length > 0) {
    const avgOddsForPick = odds.reduce((s, o) => s + (pickType === "home" ? o.home : pickType === "away" ? o.away : o.draw), 0) / odds.length;
    const marketProb = 1 / avgOddsForPick;
    // If market agrees with our pick (market also sees this as most likely), boost confidence
    const allAvgOdds = odds.reduce((s, o) => ({ h: s.h + o.home, d: s.d + o.draw, a: s.a + o.away }), { h: 0, d: 0, a: 0 });
    const mktFav = Math.min(allAvgOdds.h, allAvgOdds.d, allAvgOdds.a);
    if (Math.abs(avgOddsForPick - mktFav / odds.length) < 0.3) {
      marketAgreement = 8; // Market agrees with AI pick
    }
  }

  confidencePct = Math.min(92, Math.max(38, baseConfidence + marketAgreement));

  if (valueGap > 5 && confidencePct >= 65) {
    recommendation = "BET";
    valueRating = 5;
  } else if (valueGap > 2 && confidencePct >= 55) {
    recommendation = "BET";
    valueRating = 4;
  } else if (valueGap > 0 || confidencePct >= 55) {
    recommendation = "LEAN";
    valueRating = 3;
  } else if (valueGap > -5) {
    recommendation = "SKIP";
    valueRating = 2;
  } else {
    recommendation = "AVOID";
    valueRating = 1;
  }
  
  // Risk level based on league, team strength difference, and injuries
  const majorInjuries = injuries.length;
  if (strengthGap > 15 && majorInjuries < 2) {
    riskLevel = "LOW";
  } else if (strengthGap > 8 || fixture.league.id === 2) { // Champions League is riskier
    riskLevel = "MEDIUM";
  } else if (strengthGap > 3) {
    riskLevel = "HIGH";
  } else {
    riskLevel = "VERY HIGH";
  }
  
  // === PREDICTED SCORE — Poisson model from market-implied xG ===

  let homeXG: number;
  let awayXG: number;
  let expectedTotal: number;
  let bttsProb = 0.5; // default

  if (odds.length > 0) {
    // 1. Derive implied probabilities from 1X2 odds (remove overround)
    const avgHomeOdds = odds.reduce((s, o) => s + o.home, 0) / odds.length;
    const avgDrawOdds = odds.reduce((s, o) => s + o.draw, 0) / odds.length;
    const avgAwayOdds = odds.reduce((s, o) => s + o.away, 0) / odds.length;
    const rawTotal = 1/avgHomeOdds + 1/avgDrawOdds + 1/avgAwayOdds;
    const mktHome = (1/avgHomeOdds) / rawTotal;
    const mktDraw = (1/avgDrawOdds) / rawTotal;
    const mktAway = (1/avgAwayOdds) / rawTotal;

    // 2. Expected total goals from over/under market (most accurate source)
    if (marketExtras?.overOdds && marketExtras?.underOdds) {
      const overRaw = 1 / marketExtras.overOdds;
      const underRaw = 1 / marketExtras.underOdds;
      const ouOverround = overRaw + underRaw;
      const overProb = overRaw / ouOverround;
      const line = marketExtras.totalLine || 2.5;
      // overProb > 0.5 means market expects more goals than the line
      // Map: overProb 0.3 → total ~1.8, overProb 0.5 → total ~2.5, overProb 0.7 → total ~3.2
      expectedTotal = line + (overProb - 0.5) * 3.0;
    } else {
      // Fallback: derive from draw probability
      expectedTotal = Math.max(1.6, Math.min(3.5, 3.8 - (mktDraw * 5.0)));
    }
    expectedTotal = Math.max(1.4, Math.min(4.0, expectedTotal));

    // 3. BTTS probability from market
    if (marketExtras?.bttsYes && marketExtras?.bttsNo) {
      const bttsRaw = 1 / marketExtras.bttsYes;
      const bttsNoRaw = 1 / marketExtras.bttsNo;
      bttsProb = bttsRaw / (bttsRaw + bttsNoRaw);
    }

    // 4. Split expected total between home and away
    // Use 1X2 probabilities as strength proxy
    const homeShare = 0.5 + (mktHome - mktAway) * 0.4; // range ~0.3–0.7
    homeXG = expectedTotal * Math.max(0.3, Math.min(0.7, homeShare));
    awayXG = expectedTotal - homeXG;
  } else {
    // Fallback: team strength model
    homeXG = 0.8 + ((homeStrength - 50) / 50) * 1.0;
    awayXG = 0.6 + ((awayStrength - 50) / 50) * 0.8;
    expectedTotal = homeXG + awayXG;
  }

  // Form fine-tuning (±0.2 max)
  if (homeForm?.goalsFor) homeXG += Math.min(0.2, Math.max(-0.2, (homeForm.goalsFor / 5 - 1.2) * 0.1));
  if (awayForm?.goalsFor) awayXG += Math.min(0.2, Math.max(-0.2, (awayForm.goalsFor / 5 - 1.0) * 0.1));

  // Clamp
  homeXG = Math.max(0.3, Math.min(3.0, homeXG));
  awayXG = Math.max(0.2, Math.min(2.5, awayXG));

  // 5. Build Poisson score probability grid
  const scoreGrid = buildScoreGrid(homeXG, awayXG);

  // 6. Filter scores consistent with pick, then rank by probability
  const consistentScores = scoreGrid.filter(s => {
    if (pickType === "home") return s.home > s.away;
    if (pickType === "away") return s.away > s.home;
    return s.home === s.away; // draw
  });

  // Primary score = highest probability consistent score
  const primary = consistentScores[0] || { home: pickType === "away" ? 0 : 1, away: pickType === "home" ? 0 : 1, prob: 0 };
  // Alternate score = second most likely
  const alternate = consistentScores[1] || null;
  // Longshot = a higher-total consistent score, only if BTTS is likely or totals are high
  const longshot = (bttsProb > 0.55 || expectedTotal > 2.8)
    ? consistentScores.find(s => (s.home + s.away) >= 3 && s.home > 0 && s.away > 0 && s !== primary && s !== alternate) || null
    : null;

  const predictedScore = `${fixture.home.name} ${primary.home}–${primary.away} ${fixture.away.name}`;
  const alternateScore = alternate
    ? `${fixture.home.name} ${alternate.home}–${alternate.away} ${fixture.away.name}`
    : undefined;
  const longshotScore = longshot
    ? `${fixture.home.name} ${longshot.home}–${longshot.away} ${fixture.away.name}`
    : undefined;

  // 7. Generate explanation
  let scoreExplanation = `Primary ${primary.home}–${primary.away} is the highest-probability ${pickType === 'home' ? 'home win' : pickType === 'away' ? 'away win' : 'draw'} scoreline from market-implied goal distribution (${Math.round(primary.prob * 100)}% within category).`;
  if (longshot) {
    scoreExplanation += ` Longshot ${longshot.home}–${longshot.away} included because ${bttsProb > 0.55 ? 'BTTS market suggests both teams likely to score' : 'high expected total increases tail-score probability'}.`;
  }
  
  const reasoning = generateReasoning(
    fixture, homeForm, awayForm, h2h, injuries, odds,
    homeWinPct, awayWinPct, drawPct, pick
  );
  
  return {
    fixtureId: fixture.id,
    league: fixture.league.name,
    home: fixture.home.name,
    away: fixture.away.name,
    homeLogo: fixture.home.logo,
    awayLogo: fixture.away.logo,
    date: fixture.date,
    venue: `${fixture.venue.name}, ${fixture.venue.city}`,
    recommendation,
    pick,
    pickType,
    valueRating,
    riskLevel,
    confidencePct,
    reasoning,
    homeForm: homeForm?.form || "NNNNN",
    awayForm: awayForm?.form || "NNNNN",
    h2h,
    injuries,
    odds,
    homeWinPct,
    drawPct,
    awayWinPct,
    predictedScore,
    scoreExplanation,
    alternateScore,
    longshotScore,
  };
}