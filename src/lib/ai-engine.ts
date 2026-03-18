export interface MatchAnalysis {
  homeWinPct: number;
  drawPct: number;
  awayWinPct: number;
  predictedScore: string;
  confidence: "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";
  predictedResult: string;
  summary: string;
  keyFactors: string[];
  formGuide: { home: string[]; away: string[] };
  suggestedAngle: string;
  generatedAt: string;
}

// Team strength tiers
const TIER_1 = ["Spain", "Argentina", "France", "England", "Brazil", "Germany", "Portugal", "Netherlands"];
const TIER_2 = ["Belgium", "Croatia", "Uruguay", "Colombia", "Japan", "Morocco", "USA", "Switzerland"];
const TIER_3 = ["South Korea", "Mexico", "Ecuador", "Senegal", "Austria", "Australia", "Iran", "Egypt", "Norway", "Ivory Coast", "Scotland"];
const TIER_4 = ["South Africa", "Algeria", "Tunisia", "Ghana", "Panama", "Qatar", "Saudi Arabia", "New Zealand", "Cape Verde", "Haiti", "Jordan", "Curacao", "Uzbekistan", "UEFA playoff A", "UEFA playoff B", "UEFA playoff C", "UEFA playoff D", "ICP1", "ICP2"];

const HOST_NATIONS = ["USA", "Mexico", "Canada"];

// Power ratings
const POWER: Record<string, number> = {
  "Spain": 94, "Argentina": 93, "Brazil": 92, "France": 91, "Portugal": 90,
  "England": 89, "Germany": 88, "Netherlands": 87, "Belgium": 85, "Croatia": 84,
  "Uruguay": 83, "Colombia": 82, "Switzerland": 83, "Morocco": 82, "Japan": 81,
  "Mexico": 80, "Senegal": 79, "South Korea": 79, "USA": 78, "Austria": 78,
  "Ivory Coast": 78, "Ecuador": 77, "Norway": 77, "Canada": 76, "Egypt": 76,
  "Algeria": 75, "Australia": 75, "Scotland": 74, "Iran": 74, "Tunisia": 73,
  "Ghana": 73, "Saudi Arabia": 72, "Qatar": 72, "South Africa": 71,
  "Uzbekistan": 70, "Panama": 68, "Jordan": 67, "New Zealand": 65,
  "Cape Verde": 62, "Haiti": 58, "Curacao": 55,
  "UEFA playoff A": 72, "UEFA playoff B": 72, "UEFA playoff C": 72, "UEFA playoff D": 72,
  "ICP1": 65, "ICP2": 65,
};

function getTier(team: string): number {
  if (TIER_1.includes(team)) return 1;
  if (TIER_2.includes(team)) return 2;
  if (TIER_3.includes(team)) return 3;
  return 4;
}

export function generatePrediction(home: string, away: string, venue: string, city: string): MatchAnalysis {
  const hp = POWER[home] || 70;
  const ap = POWER[away] || 70;
  const diff = hp - ap;

  // Base probabilities from power ratings
  let homeProb = 0.40 + diff * 0.012;
  let drawProb = 0.28 - Math.abs(diff) * 0.005;
  let awayProb = 1 - homeProb - drawProb;

  // Host nation advantage
  const isInMexico = city.includes("Mexico") || city.includes("Guadalajara") || city.includes("Monterrey");
  const isInUSA = !isInMexico && !city.includes("Toronto") && !city.includes("Vancouver");
  const isInCanada = city.includes("Toronto") || city.includes("Vancouver");

  if (home === "Mexico" && isInMexico) homeProb += 0.05;
  else if (home === "USA" && isInUSA) homeProb += 0.04;
  else if (home === "Canada" && isInCanada) homeProb += 0.04;
  if (away === "Mexico" && isInMexico) awayProb += 0.03;
  else if (away === "USA" && isInUSA) awayProb += 0.03;
  else if (away === "Canada" && isInCanada) awayProb += 0.03;

  // Tier adjustment
  const homeTier = getTier(home);
  const awayTier = getTier(away);
  const tierDiff = awayTier - homeTier;
  homeProb += tierDiff * 0.03;
  awayProb -= tierDiff * 0.03;

  // Normalize
  homeProb = Math.max(0.08, Math.min(0.82, homeProb));
  drawProb = Math.max(0.12, Math.min(0.32, drawProb));
  awayProb = Math.max(0.08, Math.min(0.82, awayProb));
  const total = homeProb + drawProb + awayProb;
  homeProb = homeProb / total;
  drawProb = drawProb / total;
  awayProb = awayProb / total;

  const homeWinPct = Math.round(homeProb * 100);
  const awayWinPct = Math.round(awayProb * 100);
  const drawPct = 100 - homeWinPct - awayWinPct;

  // Predicted score
  const homeGoals = diff > 15 ? 3 : diff > 8 ? 2 : diff > 0 ? 1 : diff > -5 ? 1 : 0;
  const awayGoals = diff < -15 ? 3 : diff < -8 ? 2 : diff < 0 ? 1 : diff < 5 ? 1 : 0;
  const predictedScore = `${homeGoals}-${awayGoals}`;

  // Confidence
  const absDiff = Math.abs(diff);
  let confidence: MatchAnalysis["confidence"] = "MEDIUM";
  if (absDiff >= 20) confidence = "VERY HIGH";
  else if (absDiff >= 12) confidence = "HIGH";
  else if (absDiff >= 5) confidence = "MEDIUM";
  else confidence = "LOW";

  // Predicted result
  let predictedResult: string;
  if (homeWinPct > awayWinPct && homeWinPct > drawPct) {
    predictedResult = `${home} Win`;
  } else if (awayWinPct > homeWinPct && awayWinPct > drawPct) {
    predictedResult = `${away} Win`;
  } else {
    predictedResult = "Draw";
  }

  return {
    homeWinPct,
    drawPct,
    awayWinPct,
    predictedScore,
    confidence,
    predictedResult,
    summary: "",
    keyFactors: [],
    formGuide: { home: [], away: [] },
    suggestedAngle: "",
    generatedAt: "2026-03-18",
  };
}
