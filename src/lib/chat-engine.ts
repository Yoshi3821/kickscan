import type { MatchAnalysis } from "@/lib/ai-engine";

interface ChatContext {
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  group: string;
  date: string;
  time: string;
  venue: string;
  city: string;
  analysis: MatchAnalysis;
  odds?: { key: string; name: string; home: number; draw: number; away: number }[];
}

type Category =
  | "bet"
  | "value"
  | "draw"
  | "score"
  | "safe"
  | "form"
  | "lineup"
  | "general";

function classifyQuestion(question: string): Category {
  const q = question.toLowerCase();

  if (/draw|tie|stalemate|level/.test(q)) return "draw";
  if (/score|goals?|over|under|total|btts|both teams/.test(q)) return "score";
  if (/value|odds|price|overpriced|underpriced|edge|ev\b/.test(q)) return "value";
  if (/safe|risk|secure|reliable|banker|lock/.test(q)) return "safe";
  if (/form|history|h2h|head.to.head|record|previous/.test(q)) return "form";
  if (/lineup|injury|injured|team sheet|squad|player|starting/.test(q)) return "lineup";
  if (/bet|should i|who win|winner|pick|back|wager|punt|tip/.test(q)) return "bet";

  return "general";
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function bestOdds(ctx: ChatContext, outcome: "home" | "draw" | "away"): { odds: number; book: string } | null {
  if (!ctx.odds || ctx.odds.length === 0) return null;
  let best = ctx.odds[0];
  for (const b of ctx.odds) {
    if (b[outcome] > best[outcome]) best = b;
  }
  return best[outcome] > 0 ? { odds: best[outcome], book: best.name } : null;
}

function impliedProb(odds: number): number {
  return Math.round((1 / odds) * 100);
}

function valueIndicator(aiPct: number, marketOdds: number | undefined): string {
  if (!marketOdds || marketOdds <= 0) return "";
  const implied = impliedProb(marketOdds);
  const diff = aiPct - implied;
  if (diff > 8) return "🟢 Strong value — our AI rates this significantly higher than the market.";
  if (diff > 3) return "🟡 Slight value — our model gives this a better chance than bookmakers suggest.";
  if (diff < -8) return "🔴 No value here — the market has this priced too tight.";
  return "⚪ Fair price — roughly in line with what the data suggests.";
}

function getFavorite(ctx: ChatContext): "home" | "draw" | "away" {
  const { homeWinPct, drawPct, awayWinPct } = ctx.analysis;
  if (homeWinPct >= awayWinPct && homeWinPct >= drawPct) return "home";
  if (awayWinPct >= homeWinPct && awayWinPct >= drawPct) return "away";
  return "draw";
}

function generateBetResponse(ctx: ChatContext): string {
  const a = ctx.analysis;
  const fav = getFavorite(ctx);
  const favTeam = fav === "home" ? ctx.home : fav === "away" ? ctx.away : "the draw";
  const favPct = fav === "home" ? a.homeWinPct : fav === "away" ? a.awayWinPct : a.drawPct;
  const bestH = bestOdds(ctx, "home");
  const bestA = bestOdds(ctx, "away");

  const templates = [
    () => `Our AI gives ${ctx.homeFlag} ${ctx.home} a ${a.homeWinPct}% chance and ${ctx.awayFlag} ${ctx.away} at ${a.awayWinPct}%. Data indicates ${favTeam} is the play here at ${favPct}% probability.${bestH && fav === "home" ? ` Best odds: ${bestH.odds.toFixed(2)} at ${bestH.book}.` : ""}${bestA && fav === "away" ? ` Best odds: ${bestA.odds.toFixed(2)} at ${bestA.book}.` : ""} Our predicted score is ${a.predictedScore}. Confidence: ${a.confidence}.`,

    () => `Based on ${a.keyFactors.length} key factors, our model suggests backing ${favTeam}. The numbers: ${ctx.home} ${a.homeWinPct}% / Draw ${a.drawPct}% / ${ctx.away} ${a.awayWinPct}%. ${a.suggestedAngle ? `💡 Suggested angle: ${a.suggestedAngle}` : ""}`,

    () => `Here's what the data says — ${ctx.homeFlag} ${ctx.home} at ${a.homeWinPct}%, ${ctx.awayFlag} ${ctx.away} at ${a.awayWinPct}%, draw at ${a.drawPct}%. The value play is ${favTeam}. We're projecting ${a.predictedScore} with ${a.confidence} confidence.${a.suggestedAngle ? ` Our angle: ${a.suggestedAngle}` : ""}`,

    () => {
      const factor = a.keyFactors.length > 0 ? pick(a.keyFactors) : "";
      return `I'd look at ${favTeam} here. ${favPct}% win probability with a predicted scoreline of ${a.predictedScore}.${factor ? ` Key factor: ${factor.replace(/^[^\w]+/, "")}` : ""} Confidence level: ${a.confidence}.`;
    },
  ];

  return pick(templates)();
}

function generateValueResponse(ctx: ChatContext): string {
  const a = ctx.analysis;
  const bestH = bestOdds(ctx, "home");
  const bestD = bestOdds(ctx, "draw");
  const bestA = bestOdds(ctx, "away");

  if (!bestH && !bestD && !bestA) {
    return `Our AI probabilities: ${ctx.home} ${a.homeWinPct}% / Draw ${a.drawPct}% / ${ctx.away} ${a.awayWinPct}%. Odds data isn't available yet — check back closer to kickoff to compare with bookmaker prices for value spots.`;
  }

  const lines: string[] = [];
  if (bestH) {
    const val = valueIndicator(a.homeWinPct, bestH.odds);
    lines.push(`${ctx.homeFlag} ${ctx.home}: ${bestH.odds.toFixed(2)} at ${bestH.book} (AI: ${a.homeWinPct}%, market implies ~${impliedProb(bestH.odds)}%). ${val}`);
  }
  if (bestD) {
    const val = valueIndicator(a.drawPct, bestD.odds);
    lines.push(`🤝 Draw: ${bestD.odds.toFixed(2)} at ${bestD.book} (AI: ${a.drawPct}%, market implies ~${impliedProb(bestD.odds)}%). ${val}`);
  }
  if (bestA) {
    const val = valueIndicator(a.awayWinPct, bestA.odds);
    lines.push(`${ctx.awayFlag} ${ctx.away}: ${bestA.odds.toFixed(2)} at ${bestA.book} (AI: ${a.awayWinPct}%, market implies ~${impliedProb(bestA.odds)}%). ${val}`);
  }

  const templates = [
    () => `Here's the value breakdown:\n\n${lines.join("\n\n")}\n\nLook for green indicators — that's where the edge is.`,
    () => `Let me break down the odds vs our AI model:\n\n${lines.join("\n\n")}`,
  ];

  return pick(templates)();
}

function generateDrawResponse(ctx: ChatContext): string {
  const a = ctx.analysis;
  const bestD = bestOdds(ctx, "draw");

  const templates = [
    () => `The draw sits at ${a.drawPct}% in our model.${bestD ? ` Best price is ${bestD.odds.toFixed(2)} at ${bestD.book} (implied ~${impliedProb(bestD.odds)}%).` : ""} ${a.drawPct > 28 ? "That's elevated — this could be a tight, cagey affair." : a.drawPct > 22 ? "It's a possibility but not the primary play." : "Our data doesn't strongly support the draw here."} Predicted score: ${a.predictedScore}.`,

    () => `At ${a.drawPct}%, the stalemate is ${a.drawPct >= 30 ? "a genuine contender" : a.drawPct >= 22 ? "worth considering" : "unlikely based on our model"}.${bestD ? ` You can get ${bestD.odds.toFixed(2)} at ${bestD.book}.` : ""} ${a.drawPct >= 25 ? valueIndicator(a.drawPct, bestD?.odds ?? 0) : `The data points toward ${a.homeWinPct > a.awayWinPct ? ctx.home : ctx.away} instead.`}`,

    () => `Draw probability: ${a.drawPct}%.${bestD ? ` Current odds: ${bestD.odds.toFixed(2)} at ${bestD.book}.` : ""} ${a.drawPct >= 28 ? `With two evenly matched sides, the draw is a legitimate angle. ${a.suggestedAngle || ""}` : `Our model favors a decisive result — ${a.homeWinPct > a.awayWinPct ? `${ctx.home} at ${a.homeWinPct}%` : `${ctx.away} at ${a.awayWinPct}%`} looks stronger.`}`,
  ];

  return pick(templates)();
}

function generateScoreResponse(ctx: ChatContext): string {
  const a = ctx.analysis;
  const [homeGoals, awayGoals] = a.predictedScore.split("-").map(s => parseInt(s.trim()));
  const totalGoals = (homeGoals || 0) + (awayGoals || 0);

  const templates = [
    () => `Our model predicts ${a.predictedScore} in this one. ${totalGoals >= 3 ? "Expecting an open, attacking game — Over 2.5 Goals looks solid." : totalGoals <= 1 ? "A tight, defensive contest is expected — Under 2.5 Goals is the call." : "Could go either way on totals, but the scoreline suggests a competitive match."} ${ctx.homeFlag} ${ctx.home} projected for ${homeGoals} goal${homeGoals !== 1 ? "s" : ""}, ${ctx.awayFlag} ${ctx.away} for ${awayGoals}. Confidence: ${a.confidence}.`,

    () => `Predicted score: ${ctx.homeFlag} ${ctx.home} ${a.predictedScore} ${ctx.awayFlag} ${ctx.away}. ${totalGoals >= 3 ? `With ${totalGoals} total goals projected, this should be entertaining. Both attacks look capable of finding the net.` : `A low-scoring affair is on the cards. Defensive solidity from both sides limits the goal threat.`}`,

    () => {
      const btts = homeGoals > 0 && awayGoals > 0;
      return `We're projecting ${a.predictedScore}. ${btts ? "Both teams are expected to score — BTTS Yes is worth a look." : `Only ${homeGoals > 0 ? ctx.home : ctx.away} finding the net in our model.`} Total goals: ${totalGoals}. ${totalGoals >= 3 ? "Over 2.5 is the lean." : "Under 2.5 looks right."} Confidence: ${a.confidence}.`;
    },
  ];

  return pick(templates)();
}

function generateSafeResponse(ctx: ChatContext): string {
  const a = ctx.analysis;
  const fav = getFavorite(ctx);
  const favTeam = fav === "home" ? ctx.home : fav === "away" ? ctx.away : "the draw";
  const favPct = fav === "home" ? a.homeWinPct : fav === "away" ? a.awayWinPct : a.drawPct;

  const templates = [
    () => `The safest play here is ${favTeam} at ${favPct}% probability. ${a.confidence === "VERY HIGH" || a.confidence === "HIGH" ? "Our confidence is strong on this one." : "Though confidence is moderate — consider a smaller stake."} ${a.suggestedAngle ? `💡 Our suggested angle: ${a.suggestedAngle}` : ""}`,

    () => `For a lower-risk approach: ${favTeam} with the highest probability at ${favPct}%. ${a.suggestedAngle ? `The smart angle: ${a.suggestedAngle}` : ""} Remember — no bet is guaranteed, but the data favors this direction.`,

    () => `Risk assessment: ${a.confidence} confidence on ${a.predictedScore}. ${favPct >= 55 ? `${favTeam} at ${favPct}% is as safe as it gets in football.` : `This is a competitive match — Double Chance on ${ctx.home} or Draw might be the risk-managed play.`} ${a.suggestedAngle || ""}`,
  ];

  return pick(templates)();
}

function generateFormResponse(ctx: ChatContext): string {
  const a = ctx.analysis;
  const homeForm = a.formGuide.home.join("");
  const awayForm = a.formGuide.away.join("");
  const homeWins = a.formGuide.home.filter(r => r === "W").length;
  const awayWins = a.formGuide.away.filter(r => r === "W").length;

  const templates = [
    () => `Recent form (last 5):\n\n${ctx.homeFlag} ${ctx.home}: ${homeForm} (${homeWins} wins)\n${ctx.awayFlag} ${ctx.away}: ${awayForm} (${awayWins} wins)\n\n${homeWins > awayWins ? `${ctx.home} come in with stronger form.` : awayWins > homeWins ? `${ctx.away} have the momentum.` : "Both sides are fairly evenly matched on recent results."} Our AI factors this into the ${a.homeWinPct}/${a.drawPct}/${a.awayWinPct} probability split.`,

    () => `${ctx.home}'s last 5: ${a.formGuide.home.map(r => r === "W" ? "✅" : r === "D" ? "🟡" : "❌").join("")}\n${ctx.away}'s last 5: ${a.formGuide.away.map(r => r === "W" ? "✅" : r === "D" ? "🟡" : "❌").join("")}\n\n${homeWins >= 4 ? `${ctx.home} are flying right now.` : awayWins >= 4 ? `${ctx.away} are in excellent form.` : "Form is relatively even — this one could go either way."}`,
  ];

  return pick(templates)();
}

function generateLineupResponse(ctx: ChatContext): string {
  return pick([
    `Lineup data will be available closer to kickoff — typically 1 hour before. For now, our AI analysis of ${ctx.homeFlag} ${ctx.home} vs ${ctx.awayFlag} ${ctx.away} is based on expected starting XIs and squad fitness reports. Any last-minute changes could shift the probabilities.`,
    `Team sheets aren't confirmed yet for this one. Our prediction (${ctx.analysis.predictedScore}) assumes both sides field their strongest available lineups. Check back closer to ${ctx.time} for confirmed XIs — I'll update the analysis accordingly.`,
    `Injury and lineup info will drop closer to game day. Our current model accounts for known squad availability. Key factors to watch: ${ctx.analysis.keyFactors.length > 0 ? ctx.analysis.keyFactors[0].replace(/^[^\w]+/, "") : "squad rotation and fitness levels"}.`,
  ]);
}

function generateGeneralResponse(ctx: ChatContext): string {
  const a = ctx.analysis;

  const templates = [
    () => `Here's the full picture for ${ctx.homeFlag} ${ctx.home} vs ${ctx.awayFlag} ${ctx.away}:\n\n📊 Win probabilities: ${ctx.home} ${a.homeWinPct}% / Draw ${a.drawPct}% / ${ctx.away} ${a.awayWinPct}%\n⚽ Predicted score: ${a.predictedScore}\n🎯 Confidence: ${a.confidence}\n${a.suggestedAngle ? `💡 Angle: ${a.suggestedAngle}` : ""}\n\n${a.summary ? a.summary.slice(0, 200) + "..." : "Ask me about odds, value, score predictions, or who to back!"}`,

    () => `${ctx.homeFlag} ${ctx.home} vs ${ctx.awayFlag} ${ctx.away} at ${ctx.venue}, ${ctx.city}.\n\nOur AI says: ${a.predictedScore} (${a.confidence} confidence). ${a.homeWinPct > a.awayWinPct ? ctx.home : ctx.away} is favored at ${Math.max(a.homeWinPct, a.awayWinPct)}%. Want to know about odds, value bets, or the safest play? Just ask.`,

    () => {
      const factor = a.keyFactors.length > 0 ? pick(a.keyFactors) : "";
      return `Quick breakdown:\n\n🏆 Prediction: ${a.predictedResult} (${a.predictedScore})\n📈 ${ctx.home}: ${a.homeWinPct}% | Draw: ${a.drawPct}% | ${ctx.away}: ${a.awayWinPct}%\n🔥 Confidence: ${a.confidence}\n${factor ? `\nKey insight: ${factor.replace(/^[^\w]+/, "")}` : ""}\n\nAsk me about value bets, the draw, or who to back for more detail.`;
    },
  ];

  return pick(templates)();
}

export function generateChatResponse(question: string, ctx: ChatContext): string {
  // Check for off-topic
  const q = question.toLowerCase();
  const offTopicPatterns = /weather|crypto|bitcoin|stock|movie|food|restaurant|music|politic|news(?! about)/;
  if (offTopicPatterns.test(q) && !/match|game|bet|odds|foot|soccer|team/.test(q)) {
    return `I'm focused on ${ctx.homeFlag} ${ctx.home} vs ${ctx.awayFlag} ${ctx.away} right now. Ask me about odds, predictions, value bets, or tactics — that's where I shine! 🧠`;
  }

  const category = classifyQuestion(question);

  switch (category) {
    case "bet":
      return generateBetResponse(ctx);
    case "value":
      return generateValueResponse(ctx);
    case "draw":
      return generateDrawResponse(ctx);
    case "score":
      return generateScoreResponse(ctx);
    case "safe":
      return generateSafeResponse(ctx);
    case "form":
      return generateFormResponse(ctx);
    case "lineup":
      return generateLineupResponse(ctx);
    default:
      return generateGeneralResponse(ctx);
  }
}
