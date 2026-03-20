import type { MatchAnalysis } from "@/lib/ai-engine";

export interface Verdict {
  matchId: number;
  recommendation: "BET" | "LEAN" | "SKIP" | "AVOID";
  pick: string;
  pickType: "home" | "draw" | "away";
  valueRating: 1 | 2 | 3 | 4 | 5;
  valueLabel: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";
  confidencePct: number;
  reasoning: string;
  keyInsight: string;
  watchOut: string;
  saferAlt: { pick: string; odds: string; aiProb: number };
  riskyPlay: { pick: string; odds: string; aiProb: number };
  bestOdds: { bookmaker: string; odds: number };
  aiProb: number;
  marketProb: number;
  valueGap: number;
}

// Top tier teams for risk assessment
const TIER_1 = ["Spain", "Argentina", "France", "England", "Brazil", "Germany", "Portugal", "Netherlands"];

interface BookmakerOdds {
  name: string;
  home: number;
  draw: number;
  away: number;
}

export function generateVerdict(
  matchId: number,
  analysis: MatchAnalysis,
  bookmakers: BookmakerOdds[],
  home: string,
  away: string
): Verdict {
  // 1. AI probabilities
  const aiHome = analysis.homeWinPct / 100;
  const aiDraw = analysis.drawPct / 100;
  const aiAway = analysis.awayWinPct / 100;

  // 2. Market implied probabilities from best odds
  let bestHomeOdds = 0, bestDrawOdds = 0, bestAwayOdds = 0;
  let bestHomeBookie = "", bestDrawBookie = "", bestAwayBookie = "";

  for (const bm of bookmakers) {
    if (bm.home > bestHomeOdds) { bestHomeOdds = bm.home; bestHomeBookie = bm.name; }
    if (bm.draw > bestDrawOdds) { bestDrawOdds = bm.draw; bestDrawBookie = bm.name; }
    if (bm.away > bestAwayOdds) { bestAwayOdds = bm.away; bestAwayBookie = bm.name; }
  }

  // Implied probabilities normalized to 100%
  const rawHome = bestHomeOdds > 0 ? 1 / bestHomeOdds : 0.33;
  const rawDraw = bestDrawOdds > 0 ? 1 / bestDrawOdds : 0.33;
  const rawAway = bestAwayOdds > 0 ? 1 / bestAwayOdds : 0.33;
  const impliedTotal = rawHome + rawDraw + rawAway;
  const marketHome = rawHome / impliedTotal;
  const marketDraw = rawDraw / impliedTotal;
  const marketAway = rawAway / impliedTotal;

  // 3. Find best value gap across all outcomes
  const gaps = [
    { type: "home" as const, aiProb: aiHome, marketProb: marketHome, gap: aiHome - marketHome, team: home, label: `${home} Win` },
    { type: "draw" as const, aiProb: aiDraw, marketProb: marketDraw, gap: aiDraw - marketDraw, team: "Draw", label: "Draw" },
    { type: "away" as const, aiProb: aiAway, marketProb: marketAway, gap: aiAway - marketAway, team: away, label: `${away} Win` },
  ];

  // Sort by value gap descending
  gaps.sort((a, b) => b.gap - a.gap);
  
  // Pick = outcome with highest AI probability by default
  const aiSorted = [...gaps].sort((a, b) => b.aiProb - a.aiProb);
  let bestPick = aiSorted[0];
  
  // But use the best value gap for the recommendation logic
  const bestValue = gaps[0];
  const valueGapPct = bestValue.gap * 100;

  // Determine recommendation and value rating
  let recommendation: Verdict["recommendation"];
  let valueRating: Verdict["valueRating"];
  let valueLabel: string;

  if (valueGapPct > 8) {
    recommendation = "BET"; valueRating = 5; valueLabel = "Strong Value";
  } else if (valueGapPct > 4) {
    recommendation = "BET"; valueRating = 4; valueLabel = "Good Value";
  } else if (valueGapPct > 1) {
    recommendation = "LEAN"; valueRating = 3; valueLabel = "Fair Price";
  } else if (valueGapPct > -3) {
    recommendation = "SKIP"; valueRating = 2; valueLabel = "Overpriced";
  } else {
    recommendation = "AVOID"; valueRating = 1; valueLabel = "No Value";
  }

  // If BET or LEAN, pick the best value outcome
  if (recommendation === "BET" || recommendation === "LEAN") {
    bestPick = bestValue;
  }
  // If AVOID, flip to value side (the outcome the market underprices)
  if (recommendation === "AVOID") {
    bestPick = bestValue; // best value gap even if negative is least bad
  }

  // 4. Risk level
  const isTopTier = TIER_1.includes(home) || TIER_1.includes(away);
  const pickedTeamTopTier = bestPick.type === "home" ? TIER_1.includes(home) : bestPick.type === "away" ? TIER_1.includes(away) : false;
  
  let riskLevel: Verdict["riskLevel"];
  if (analysis.confidence === "VERY HIGH" && pickedTeamTopTier) {
    riskLevel = "LOW";
  } else if (analysis.confidence === "VERY HIGH" || analysis.confidence === "HIGH") {
    riskLevel = "MEDIUM";
  } else if (analysis.confidence === "MEDIUM") {
    riskLevel = "HIGH";
  } else {
    riskLevel = "VERY HIGH";
  }

  // Confidence percentage
  const confMap: Record<string, number> = { "VERY HIGH": 88, "HIGH": 75, "MEDIUM": 60, "LOW": 42 };
  const confidencePct = confMap[analysis.confidence] || 55;

  // 5. Safer alternative (Double Chance)
  let saferPick: string;
  let saferAiProb: number;
  if (bestPick.type === "home") {
    saferPick = `${home} or Draw`;
    saferAiProb = Math.round((aiHome + aiDraw) * 100);
  } else if (bestPick.type === "away") {
    saferPick = `${away} or Draw`;
    saferAiProb = Math.round((aiAway + aiDraw) * 100);
  } else {
    // Pick is draw — safer alt is double chance of the stronger team
    if (aiHome > aiAway) {
      saferPick = `${home} or Draw`;
      saferAiProb = Math.round((aiHome + aiDraw) * 100);
    } else {
      saferPick = `${away} or Draw`;
      saferAiProb = Math.round((aiAway + aiDraw) * 100);
    }
  }

  // Calculate implied double chance odds
  const dcProb = saferAiProb / 100;
  const dcOdds = Math.round((1 / dcProb) * 100) / 100;

  // 6. Risky play — correct score
  const [hGoals, aGoals] = analysis.predictedScore.split("-").map(Number);
  const correctScoreOdds = hGoals + aGoals === 0 ? 8.5 : 
    hGoals + aGoals === 1 ? 6.5 :
    hGoals + aGoals === 2 ? 7.0 :
    hGoals + aGoals === 3 ? 12.0 : 18.0;
  
  // AI probability of exact score (rough estimate)
  const csProb = Math.round(100 / correctScoreOdds);

  // Best odds for the pick
  let bestOddsValue: number;
  let bestOddsBookie: string;
  if (bestPick.type === "home") {
    bestOddsValue = bestHomeOdds;
    bestOddsBookie = bestHomeBookie;
  } else if (bestPick.type === "away") {
    bestOddsValue = bestAwayOdds;
    bestOddsBookie = bestAwayBookie;
  } else {
    bestOddsValue = bestDrawOdds;
    bestOddsBookie = bestDrawBookie;
  }

  return {
    matchId,
    recommendation,
    pick: bestPick.label,
    pickType: bestPick.type,
    valueRating,
    valueLabel,
    riskLevel,
    confidencePct,
    reasoning: "", // Will be filled by pre-generated data
    keyInsight: "",
    watchOut: "",
    saferAlt: {
      pick: saferPick,
      odds: dcOdds.toFixed(2),
      aiProb: saferAiProb,
    },
    riskyPlay: {
      pick: `Correct Score ${analysis.predictedScore}`,
      odds: correctScoreOdds.toFixed(2),
      aiProb: csProb,
    },
    bestOdds: {
      bookmaker: bestOddsBookie || "Pinnacle",
      odds: bestOddsValue || 1.50,
    },
    aiProb: Math.round(bestPick.aiProb * 100),
    marketProb: Math.round(bestPick.marketProb * 100),
    valueGap: Math.round(bestPick.gap * 100),
  };
}
