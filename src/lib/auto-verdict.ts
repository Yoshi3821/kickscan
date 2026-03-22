import type { LeagueFixture, TeamForm, H2HResult, InjuryInfo, FixtureOdds } from './league-api';

export interface MarketExtras {
  totalLine?: number;
  overOdds?: number;
  underOdds?: number;
  bttsYes?: number;
  bttsNo?: number;
  ahLine?: number;       // Asian Handicap line (negative = home favored)
  ahHomeOdds?: number;
  ahAwayOdds?: number;
  ahDerived?: boolean;   // true if derived from 1X2, false if real spreads data
  // API-Football predictions (external ML model)
  apiPrediction?: {
    homePct: number;
    drawPct: number;
    awayPct: number;
    advice: string;
  };
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

// ── Poisson helpers ──

function poissonPmf(lambda: number, k: number): number {
  let factorial = 1;
  for (let i = 2; i <= k; i++) factorial *= i;
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial;
}

function buildScoreGrid(homeXG: number, awayXG: number, maxGoals = 5): { home: number; away: number; prob: number }[] {
  const grid: { home: number; away: number; prob: number }[] = [];
  for (let h = 0; h <= maxGoals; h++) {
    for (let a = 0; a <= maxGoals; a++) {
      grid.push({ home: h, away: a, prob: poissonPmf(homeXG, h) * poissonPmf(awayXG, a) });
    }
  }
  grid.sort((a, b) => b.prob - a.prob);
  return grid;
}

// ── Team strength fallback ──

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
  // UCL extras
  "PSG": 88, "Benfica": 75, "Porto": 72, "Ajax": 70, "Celtic": 65,
};

function getTeamStrength(teamName: string, leagueId: number): number {
  if (TEAM_STRENGTH[teamName]) return TEAM_STRENGTH[teamName];
  switch (leagueId) {
    case 39: return 60;
    case 140: return 58;
    case 135: return 56;
    case 78: return 55;
    case 2: return 70;
    default: return 50;
  }
}

// ── Form analysis ──

function analyzeForm(form: string): { wins: number; draws: number; losses: number } {
  return {
    wins: (form.match(/W/g) || []).length,
    draws: (form.match(/D/g) || []).length,
    losses: (form.match(/L/g) || []).length,
  };
}

// ── Expected total from O/U market ──

function getExpectedTotal(marketExtras?: MarketExtras): number {
  if (marketExtras?.overOdds && marketExtras?.underOdds) {
    const oRaw = 1 / marketExtras.overOdds;
    const uRaw = 1 / marketExtras.underOdds;
    const overProb = oRaw / (oRaw + uRaw);
    const line = marketExtras.totalLine || 2.5;
    return Math.max(1.4, Math.min(4.0, line + (overProb - 0.5) * 3.0));
  }
  return 2.5; // fallback
}

// ── BTTS probability ──

function getBttsProb(marketExtras?: MarketExtras): number {
  if (marketExtras?.bttsYes && marketExtras?.bttsNo) {
    const yRaw = 1 / marketExtras.bttsYes;
    const nRaw = 1 / marketExtras.bttsNo;
    return yRaw / (yRaw + nRaw);
  }
  return 0.5;
}

// ── Derive market implied probabilities from 1X2 odds ──

function getMarketProbs(odds: FixtureOdds[]): { home: number; draw: number; away: number } | null {
  if (odds.length === 0) return null;
  const avgH = odds.reduce((s, o) => s + o.home, 0) / odds.length;
  const avgD = odds.reduce((s, o) => s + o.draw, 0) / odds.length;
  const avgA = odds.reduce((s, o) => s + o.away, 0) / odds.length;
  const rawH = 1 / avgH, rawD = 1 / avgD, rawA = 1 / avgA;
  const total = rawH + rawD + rawA;
  return { home: rawH / total, draw: rawD / total, away: rawA / total };
}

// ── Reasoning generator ──

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
  pick: string,
  ahLine?: number,
  ahDerived?: boolean,
): string {
  const parts: string[] = [];

  // AH-based insight (most valuable)
  if (ahLine !== undefined) {
    const absLine = Math.abs(ahLine);
    const favored = ahLine < 0 ? fixture.home.name : fixture.away.name;
    if (absLine >= 1.5) {
      parts.push(`Market expects ${favored} to dominate (AH ${ahLine > 0 ? '+' : ''}${ahLine.toFixed(2)}).`);
    } else if (absLine >= 0.75) {
      parts.push(`Market prices ${favored} as clear favorite (AH ${ahLine > 0 ? '+' : ''}${ahLine.toFixed(2)}).`);
    } else if (absLine < 0.3) {
      parts.push(`Tight match — AH line of ${ahLine.toFixed(2)} suggests near-even contest.`);
    }
  }

  // Form
  if (homeForm && awayForm) {
    const hf = analyzeForm(homeForm.form);
    const af = analyzeForm(awayForm.form);
    if (hf.wins >= 4) parts.push(`${fixture.home.name} in flying form (${hf.wins}W in last 5).`);
    else if (hf.wins <= 1) parts.push(`${fixture.home.name} struggling (${hf.wins}W in last 5).`);
    if (af.wins >= 4) parts.push(`${fixture.away.name} in excellent form (${af.wins}W in last 5).`);
    else if (af.wins <= 1) parts.push(`${fixture.away.name} poor recent form (${af.wins}W in 5).`);
  }

  // H2H
  if (h2h.length > 0) {
    const homeH2HWins = h2h.filter(m =>
      (m.home === fixture.home.name && m.homeGoals > m.awayGoals) ||
      (m.away === fixture.home.name && m.awayGoals > m.homeGoals)
    ).length;
    if (homeH2HWins >= 3) parts.push(`${fixture.home.name} won ${homeH2HWins} of last ${h2h.length} H2H meetings.`);
    else if (h2h.length - homeH2HWins >= 3) parts.push(`${fixture.away.name} hold the H2H edge.`);
  }

  // Injuries
  const homeInj = injuries.filter(i => i.team === fixture.home.name);
  const awayInj = injuries.filter(i => i.team === fixture.away.name);
  if (homeInj.length > 2) parts.push(`${fixture.home.name} weakened by ${homeInj.length} injuries.`);
  if (awayInj.length > 2) parts.push(`${fixture.away.name} missing key players.`);

  // Market value
  if (odds.length > 0) {
    const mkt = getMarketProbs(odds);
    if (mkt) {
      const mktPct = pick.includes(fixture.home.name) ? Math.round(mkt.home * 100) :
        pick.includes(fixture.away.name) ? Math.round(mkt.away * 100) : Math.round(mkt.draw * 100);
      const aiPct = pick.includes(fixture.home.name) ? homeWinPct :
        pick.includes(fixture.away.name) ? awayWinPct : drawPct;
      if (aiPct > mktPct + 5) {
        parts.push(`Market at ${mktPct}%, AI sees ${aiPct}% — value edge.`);
      } else if (Math.abs(aiPct - mktPct) <= 3) {
        parts.push(`AI and market agree at ~${mktPct}%.`);
      }
    }
  }

  if (parts.length === 0) {
    parts.push(`Based on available data, ${pick.replace(" Win", "")} represents the most likely outcome.`);
  }

  return parts.slice(0, 3).join(" ");
}

// ══════════════════════════════════════════════════════════════
//  MAIN VERDICT GENERATOR
// ══════════════════════════════════════════════════════════════

export function generateAutoVerdict(
  fixture: LeagueFixture,
  homeForm: TeamForm | null,
  awayForm: TeamForm | null,
  h2h: H2HResult[],
  injuries: InjuryInfo[],
  odds: FixtureOdds[],
  marketExtras?: MarketExtras
): AutoVerdict {
  const hasOdds = odds.length > 0;
  const marketProbs = getMarketProbs(odds);
  const expectedTotal = getExpectedTotal(marketExtras);
  const bttsProb = getBttsProb(marketExtras);
  const ahLine = marketExtras?.ahLine; // negative = home favored
  const ahDerived = marketExtras?.ahDerived ?? true;

  // ── 1. COMPOSITE PROBABILITY MODEL ──
  // Weighted blend: market (40%) + AH-adjusted (20%) + O/U context (15%) + BTTS (10%) + strength (10%) + form (5%)

  const homeStrength = getTeamStrength(fixture.home.name, fixture.league.id);
  const awayStrength = getTeamStrength(fixture.away.name, fixture.league.id);

  // Base from team strength (fallback layer)
  const strengthDiff = homeStrength - awayStrength;
  let strengthHome = 0.40 + (strengthDiff * 0.008);
  let strengthDraw = 0.28 - (Math.abs(strengthDiff) * 0.003);
  let strengthAway = 1 - strengthHome - strengthDraw;
  strengthHome = Math.max(0.15, Math.min(0.70, strengthHome));
  strengthAway = Math.max(0.15, Math.min(0.70, strengthAway));
  strengthDraw = Math.max(0.15, Math.min(0.40, strengthDraw));
  const stTotal = strengthHome + strengthDraw + strengthAway;
  strengthHome /= stTotal; strengthDraw /= stTotal; strengthAway /= stTotal;

  // Form adjustment
  let formHome = 0, formAway = 0;
  if (homeForm && awayForm) {
    formHome = (analyzeForm(homeForm.form).wins * 0.02) - 0.04;
    formAway = (analyzeForm(awayForm.form).wins * 0.02) - 0.04;
  }

  // Calculate composite probabilities
  let homeProb: number, drawProb: number, awayProb: number;

  if (marketProbs) {
    // Market-weighted composite
    const mH = marketProbs.home;
    const mD = marketProbs.draw;
    const mA = marketProbs.away;

    // AH-adjusted probabilities: use AH line to refine the market signal
    let ahH = mH, ahD = mD, ahA = mA;
    if (ahLine !== undefined) {
      const absAH = Math.abs(ahLine);
      // AH confirms/adjusts the favorite strength
      // Large AH line → push probability toward the favorite
      if (ahLine < -0.75) {
        // Strong home favorite: boost home, reduce draw
        const boost = Math.min(0.08, absAH * 0.04);
        ahH = mH + boost;
        ahD = mD - boost * 0.6;
        ahA = mA - boost * 0.4;
      } else if (ahLine > 0.75) {
        // Strong away favorite: boost away, reduce draw
        const boost = Math.min(0.08, absAH * 0.04);
        ahA = mA + boost;
        ahD = mD - boost * 0.6;
        ahH = mH - boost * 0.4;
      } else {
        // Close match: boost draw probability slightly
        const drawBoost = Math.min(0.04, (0.75 - absAH) * 0.06);
        ahD = mD + drawBoost;
        ahH = mH - drawBoost * 0.5;
        ahA = mA - drawBoost * 0.5;
      }
      // Normalize
      const ahTotal = ahH + ahD + ahA;
      ahH /= ahTotal; ahD /= ahTotal; ahA /= ahTotal;
    }

    // O/U context: high totals reduce draw probability
    let ouH = mH, ouD = mD, ouA = mA;
    if (expectedTotal > 2.8) {
      const drawReduce = Math.min(0.04, (expectedTotal - 2.8) * 0.03);
      ouD = mD - drawReduce;
      ouH = mH + drawReduce * 0.5;
      ouA = mA + drawReduce * 0.5;
    } else if (expectedTotal < 2.2) {
      const drawBoost = Math.min(0.04, (2.2 - expectedTotal) * 0.04);
      ouD = mD + drawBoost;
      ouH = mH - drawBoost * 0.5;
      ouA = mA - drawBoost * 0.5;
    }

    // BTTS context: both scoring reduces draw slightly, boosts favorite
    let btH = mH, btD = mD, btA = mA;
    if (bttsProb > 0.6) {
      btD = mD - 0.02;
      btH = mH + 0.01; btA = mA + 0.01;
    } else if (bttsProb < 0.4) {
      // Low BTTS = likely clean sheet for one side → boost favorite
      const fav = mH > mA ? 'home' : 'away';
      if (fav === 'home') { btH = mH + 0.02; btA = mA - 0.02; }
      else { btA = mA + 0.02; btH = mH - 0.02; }
    }

    // API-Football prediction layer (external ML model)
    let predH = mH, predD = mD, predA = mA;
    const apiPred = marketExtras?.apiPrediction;
    if (apiPred && apiPred.homePct + apiPred.drawPct + apiPred.awayPct > 0) {
      predH = apiPred.homePct / 100;
      predD = apiPred.drawPct / 100;
      predA = apiPred.awayPct / 100;
    }

    // Weighted blend
    // Market: 35%, AH: 18%, API-Football Pred: 12%, O/U: 12%, BTTS: 8%, Strength: 10%, Form: 5%
    const hasApiPred = apiPred && apiPred.homePct + apiPred.drawPct + apiPred.awayPct > 0;
    if (hasApiPred) {
      homeProb = mH * 0.35 + ahH * 0.18 + predH * 0.12 + ouH * 0.12 + btH * 0.08 + strengthHome * 0.10 + (strengthHome + formHome) * 0.05;
      drawProb = mD * 0.35 + ahD * 0.18 + predD * 0.12 + ouD * 0.12 + btD * 0.08 + strengthDraw * 0.10 + strengthDraw * 0.05;
      awayProb = mA * 0.35 + ahA * 0.18 + predA * 0.12 + ouA * 0.12 + btA * 0.08 + strengthAway * 0.10 + (strengthAway + formAway) * 0.05;
    } else {
      // No API prediction — redistribute its 12% to market (40%) + AH (20%)
      homeProb = mH * 0.42 + ahH * 0.23 + ouH * 0.12 + btH * 0.08 + strengthHome * 0.10 + (strengthHome + formHome) * 0.05;
      drawProb = mD * 0.42 + ahD * 0.23 + ouD * 0.12 + btD * 0.08 + strengthDraw * 0.10 + strengthDraw * 0.05;
      awayProb = mA * 0.42 + ahA * 0.23 + ouA * 0.12 + btA * 0.08 + strengthAway * 0.10 + (strengthAway + formAway) * 0.05;
    }
  } else {
    // No market data — use API prediction + strength + form
    const apiPred = marketExtras?.apiPrediction;
    if (apiPred && apiPred.homePct + apiPred.drawPct + apiPred.awayPct > 0) {
      const pH = apiPred.homePct / 100, pD = apiPred.drawPct / 100, pA = apiPred.awayPct / 100;
      homeProb = pH * 0.50 + strengthHome * 0.35 + (strengthHome + formHome) * 0.15;
      drawProb = pD * 0.50 + strengthDraw * 0.35 + strengthDraw * 0.15;
      awayProb = pA * 0.50 + strengthAway * 0.35 + (strengthAway + formAway) * 0.15;
    } else {
      homeProb = strengthHome + formHome;
      drawProb = strengthDraw;
      awayProb = strengthAway + formAway;
    }
  }

  // Normalize
  const probTotal = homeProb + drawProb + awayProb;
  homeProb /= probTotal;
  drawProb /= probTotal;
  awayProb /= probTotal;

  // Clamp extremes
  homeProb = Math.max(0.10, Math.min(0.75, homeProb));
  awayProb = Math.max(0.10, Math.min(0.75, awayProb));
  drawProb = Math.max(0.12, Math.min(0.45, drawProb));
  const clampTotal = homeProb + drawProb + awayProb;
  homeProb /= clampTotal; drawProb /= clampTotal; awayProb /= clampTotal;

  const homeWinPct = Math.round(homeProb * 100);
  const drawPct = Math.round(drawProb * 100);
  const awayWinPct = 100 - homeWinPct - drawPct;

  // ── 2. PICK SELECTION ──

  let pick: string;
  let pickType: "home" | "draw" | "away";
  const topProb = Math.max(homeProb, drawProb, awayProb);

  if (homeProb >= drawProb && homeProb >= awayProb) {
    pick = `${fixture.home.name} Win`; pickType = "home";
  } else if (awayProb >= drawProb && awayProb >= homeProb) {
    pick = `${fixture.away.name} Win`; pickType = "away";
  } else {
    pick = "Draw"; pickType = "draw";
  }

  const pickProb = pickType === "home" ? homeProb : pickType === "away" ? awayProb : drawProb;

  // ── 3. CONFIDENCE GATE + SKIP DISCIPLINE ──

  // Calculate value gap vs market
  let valueGap = 0;
  let marketPickProb = 0;
  if (marketProbs) {
    marketPickProb = pickType === "home" ? marketProbs.home : pickType === "away" ? marketProbs.away : marketProbs.draw;
    valueGap = (pickProb - marketPickProb) * 100; // percentage points
  }

  // Data quality score (0-1) — affects confidence
  let dataQuality = 0;
  if (hasOdds) dataQuality += 0.35;
  if (ahLine !== undefined && !ahDerived) dataQuality += 0.15; // real AH data
  else if (ahLine !== undefined) dataQuality += 0.08; // derived AH
  if (marketExtras?.overOdds) dataQuality += 0.08;
  if (marketExtras?.bttsYes) dataQuality += 0.04;
  if (marketExtras?.apiPrediction) dataQuality += 0.10; // API-Football ML
  if (homeForm) dataQuality += 0.10;
  if (awayForm) dataQuality += 0.05;
  if (h2h.length > 0) dataQuality += 0.05;

  // Confidence: blend of pick probability + data quality
  let confidencePct = Math.round(pickProb * 80 + dataQuality * 20);
  confidencePct = Math.min(92, Math.max(30, confidencePct));

  // Market agreement bonus
  if (marketProbs) {
    const marketFav = marketProbs.home > marketProbs.away && marketProbs.home > marketProbs.draw ? "home"
      : marketProbs.away > marketProbs.home && marketProbs.away > marketProbs.draw ? "away" : "draw";
    if (marketFav === pickType) confidencePct = Math.min(92, confidencePct + 5);
  }

  // ── CONFIDENCE GATES (force SKIP on unclear matches) ──
  let forceSkip = false;
  let skipReason = "";

  // Gate 1: Top probability too low — too close to call
  if (topProb < 0.40) {
    forceSkip = true;
    skipReason = "Too close to call — no outcome above 40%.";
  }

  // Gate 2: Home vs away spread too tight with high draw chance
  if (!forceSkip && Math.abs(homeProb - awayProb) < 0.05 && drawProb > 0.28) {
    forceSkip = true;
    skipReason = "Near-equal probabilities — coin flip match.";
  }

  // Gate 3: No odds data — flying blind
  if (!forceSkip && !hasOdds) {
    forceSkip = true;
    skipReason = "No market data available.";
  }

  // ── AH-BASED OVERRIDES (conservative brake) ──
  let ahCap: "BET" | "LEAN" | "SKIP" | null = null;

  if (ahLine !== undefined) {
    const absAH = Math.abs(ahLine);

    // Picking home but AH says it's nearly even → cap at LEAN
    if (pickType === "home" && ahLine > -0.25 && ahLine <= 0) {
      ahCap = "LEAN";
    }
    // Picking away but AH says home is heavy favorite → cap at LEAN
    if (pickType === "away" && ahLine < -1.25) {
      ahCap = "LEAN";
    }
    // Picking draw but AH says clear winner expected → SKIP
    if (pickType === "draw" && absAH > 1.0) {
      forceSkip = true;
      skipReason = "Draw pick conflicts with strong AH line.";
    }

    // AH confirms pick direction?
    const ahConfirmsPick =
      (pickType === "home" && ahLine < -0.5) ||
      (pickType === "away" && ahLine > 0.5) ||
      (pickType === "draw" && absAH < 0.5);

    // If AH disagrees with pick direction, reduce confidence
    if (!ahConfirmsPick && !forceSkip) {
      confidencePct = Math.max(30, confidencePct - 8);
    }
  }

  // ── 4. RECOMMENDATION ──

  let recommendation: AutoVerdict["recommendation"];
  let valueRating: AutoVerdict["valueRating"];
  let riskLevel: AutoVerdict["riskLevel"];

  if (forceSkip) {
    recommendation = "SKIP";
    valueRating = 2;
  } else {
    // AH confirmation check
    const ahConfirms = ahLine !== undefined && (
      (pickType === "home" && ahLine < -0.5) ||
      (pickType === "away" && ahLine > 0.5) ||
      (pickType === "draw" && Math.abs(ahLine) < 0.5)
    );

    // Two paths to BET/LEAN:
    // Path A: Value gap — AI sees meaningful edge over market
    // Path B: High confidence + AH confirms — strong consensus pick even if gap is small
    //         (gap is naturally small because model is ~40% market-weighted)

    if (valueGap > 10 && confidencePct >= 72 && ahConfirms) {
      recommendation = "BET"; valueRating = 5; // Strong value BET
    } else if (valueGap > 7 && confidencePct >= 65 && ahConfirms) {
      recommendation = "BET"; valueRating = 4; // Good value BET
    } else if (confidencePct >= 72 && ahConfirms && pickProb >= 0.55) {
      recommendation = "BET"; valueRating = 4; // High-confidence consensus BET
    } else if (valueGap > 3 && confidencePct >= 58) {
      recommendation = "LEAN"; valueRating = 3;
    } else if (confidencePct >= 60 && pickProb >= 0.45) {
      recommendation = "LEAN"; valueRating = 3; // Moderate-confidence LEAN
    } else if (valueGap < -8) {
      recommendation = "AVOID"; valueRating = 1;
    } else {
      recommendation = "SKIP"; valueRating = 2;
    }

    // Apply AH cap
    if (ahCap) {
      const rankOrder = { "BET": 3, "LEAN": 2, "SKIP": 1, "AVOID": 0 };
      if (rankOrder[recommendation] > rankOrder[ahCap]) {
        recommendation = ahCap;
        valueRating = Math.min(valueRating, 3) as AutoVerdict["valueRating"];
      }
    }
  }

  // ── 5. RISK LEVEL ──

  const strengthGap = Math.abs(homeStrength - awayStrength);
  const majorInjuries = injuries.length;
  const absAHLine = ahLine !== undefined ? Math.abs(ahLine) : 0;

  if (absAHLine > 1.5 && strengthGap > 15 && majorInjuries < 2) {
    riskLevel = "LOW";
  } else if (absAHLine > 0.75 || strengthGap > 10) {
    riskLevel = "MEDIUM";
  } else if (absAHLine > 0.25 || strengthGap > 5) {
    riskLevel = "HIGH";
  } else {
    riskLevel = "VERY HIGH";
  }

  // ── 6. AH-CALIBRATED SCORE PREDICTION ──

  let homeXG: number;
  let awayXG: number;

  if (ahLine !== undefined && expectedTotal > 0) {
    // AH line = expected margin. Combined with O/U total → precise xG split.
    // ahLine is negative when home is favored, so expectedMargin is -ahLine for home advantage
    const expectedMargin = -(ahLine); // positive = home expected to win by this much
    homeXG = (expectedTotal + expectedMargin) / 2;
    awayXG = (expectedTotal - expectedMargin) / 2;
  } else if (hasOdds && marketProbs) {
    // Fallback: derive from market probs (old method but less precise)
    const homeShare = 0.5 + (marketProbs.home - marketProbs.away) * 0.4;
    homeXG = expectedTotal * Math.max(0.3, Math.min(0.7, homeShare));
    awayXG = expectedTotal - homeXG;
  } else {
    // Pure strength fallback
    homeXG = 0.8 + ((homeStrength - 50) / 50) * 1.0;
    awayXG = 0.6 + ((awayStrength - 50) / 50) * 0.8;
  }

  // Form fine-tuning (±0.2 max)
  if (homeForm?.goalsFor) homeXG += Math.min(0.2, Math.max(-0.2, (homeForm.goalsFor / 5 - 1.2) * 0.1));
  if (awayForm?.goalsFor) awayXG += Math.min(0.2, Math.max(-0.2, (awayForm.goalsFor / 5 - 1.0) * 0.1));

  // Clamp to realistic bounds
  homeXG = Math.max(0.3, Math.min(3.5, homeXG));
  awayXG = Math.max(0.2, Math.min(3.0, awayXG));

  // Build Poisson score grid
  const scoreGrid = buildScoreGrid(homeXG, awayXG);

  // Filter scores consistent with pick
  const consistentScores = scoreGrid.filter(s => {
    if (pickType === "home") return s.home > s.away;
    if (pickType === "away") return s.away > s.home;
    return s.home === s.away;
  });

  const primary = consistentScores[0] || { home: pickType === "away" ? 0 : 1, away: pickType === "home" ? 0 : 1, prob: 0 };
  const alternate = consistentScores[1] || null;
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

  // Score explanation
  let scoreExplanation = `Primary ${primary.home}–${primary.away} from ${ahLine !== undefined ? 'AH-calibrated' : 'market-implied'} xG model (H ${homeXG.toFixed(1)} / A ${awayXG.toFixed(1)}).`;
  if (ahLine !== undefined) {
    scoreExplanation += ` AH line ${ahLine > 0 ? '+' : ''}${ahLine.toFixed(2)} → expected margin ${Math.abs(ahLine).toFixed(1)} goals.`;
  }
  if (longshot) {
    scoreExplanation += ` Longshot ${longshot.home}–${longshot.away}: ${bttsProb > 0.55 ? 'BTTS likely' : 'high expected total'}.`;
  }

  // ── 7. REASONING ──

  const reasoning = generateReasoning(
    fixture, homeForm, awayForm, h2h, injuries, odds,
    homeWinPct, awayWinPct, drawPct, pick,
    ahLine, ahDerived,
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
    reasoning: forceSkip ? `SKIP: ${skipReason} ${reasoning}` : reasoning,
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
