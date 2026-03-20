import type { LeagueFixture, TeamForm, H2HResult, InjuryInfo, FixtureOdds } from './league-api';

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
  odds: FixtureOdds[]
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
  
  // Determine recommendation based on value gap and confidence
  const strengthGap = Math.abs(homeStrength - awayStrength);
  
  if (valueGap > 5 && strengthGap > 10) {
    recommendation = "BET";
    valueRating = 5;
    confidencePct = 85;
  } else if (valueGap > 2 && strengthGap > 5) {
    recommendation = "BET";
    valueRating = 4;
    confidencePct = 75;
  } else if (valueGap > 0) {
    recommendation = "LEAN";
    valueRating = 3;
    confidencePct = 65;
  } else if (valueGap > -3) {
    recommendation = "SKIP";
    valueRating = 2;
    confidencePct = 55;
  } else {
    recommendation = "AVOID";
    valueRating = 1;
    confidencePct = 45;
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
  
  // Predicted score based on attack/defense strength
  const homeGoals = Math.min(4, Math.max(0, Math.round((homeStrength - 50) / 20 + (homeForm?.goalsFor || 0) / 10)));
  const awayGoals = Math.min(3, Math.max(0, Math.round((awayStrength - 50) / 20 + (awayForm?.goalsFor || 0) / 10)));
  const predictedScore = `${homeGoals}-${awayGoals}`;
  
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
  };
}