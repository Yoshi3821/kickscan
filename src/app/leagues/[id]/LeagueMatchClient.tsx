"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { AutoVerdict } from "@/lib/auto-verdict";
import type { LeagueFixture, TeamForm, H2HResult, InjuryInfo, FixtureOdds } from "@/lib/league-api";
import { getBookmakerUrl } from "@/config/affiliates";

/* ─── Types ─── */
interface Props {
  fixture: LeagueFixture;
  homeFormData: TeamForm | null;
  awayFormData: TeamForm | null;
  h2hData: H2HResult[];
  injuries: InjuryInfo[];
  odds: FixtureOdds[];
  verdict: AutoVerdict;
}

interface VoteData {
  totals: { home: number; draw: number; away: number };
  total: number;
  percentages: { home: number; draw: number; away: number };
  userVote: string | null;
}

/* ─── Helpers ─── */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const stored = localStorage.getItem("kickscan_vid");
  if (stored) return stored;
  const fingerprint = [
    navigator.userAgent, screen.width, screen.height, screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone, new Date().getTimezoneOffset(),
  ].join("|");
  const vid = "v_" + simpleHash(fingerprint) + "_" + Date.now().toString(36);
  localStorage.setItem("kickscan_vid", vid);
  return vid;
}

function generateSmartInsight(
  fanPcts: { home: number; draw: number; away: number } | null,
  aiPcts: { home: number; draw: number; away: number },
  marketPcts: { home: number; draw: number; away: number },
  home: string,
  away: string
): string {
  const fan = fanPcts || { home: 50, draw: 25, away: 25 };
  
  // Find the favorite from each source
  const fanFav = fan.home > fan.away ? home : fan.away > fan.home ? away : "Draw";
  const aiFav = aiPcts.home > aiPcts.away ? home : aiPcts.away > aiPcts.home ? away : "Draw";
  const marketFav = marketPcts.home > marketPcts.away ? home : marketPcts.away > marketPcts.home ? away : "Draw";

  const allAgree = fanFav === aiFav && aiFav === marketFav;
  const fanAiAgree = fanFav === aiFav && aiFav !== marketFav;
  const aiMarketAgree = aiFav === marketFav && aiFav !== fanFav;

  // Find biggest divergence
  const homeDiff = Math.abs(fan.home - marketPcts.home);
  const drawDiff = Math.abs(fan.draw - marketPcts.draw);

  if (allAgree) {
    return `⚡ All three perspectives align — ${fanFav} is the clear favorite. Fan confidence (${fan.home > fan.away ? fan.home : fan.away}%) matches market expectations.`;
  }
  if (aiMarketAgree) {
    const fav = aiFav;
    return `⚡ AI and market agree on ${fav}, but fans ${fanFav === fav ? "are even more confident" : `lean toward ${fanFav}`}. ${drawDiff > 8 ? `The market sees more draw risk than fans.` : `Watch for value in the gap.`}`;
  }
  if (fanAiAgree) {
    return `⚡ Fans and AI both back ${fanFav}, but the market is more cautious${marketFav !== fanFav ? `, leaning toward ${marketFav}` : ""}. ${homeDiff > 10 ? "Significant divergence suggests potential value." : ""}`;
  }
  // All disagree or complex
  return `⚡ Interesting split: Fans favor ${fanFav}, AI picks ${aiFav}, market leans ${marketFav}. When sources disagree this much, expect the unexpected.`;
}

/* ─── Sub-components ─── */
function GlassPanel({ children, className = "", delay }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <div className={`bg-gray-900/40 backdrop-blur-xl border border-gray-800/50 rounded-2xl overflow-hidden ${className}`} 
         style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const colors = {
    'BET': 'bg-green-500/20 text-green-400 border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.15)]',
    'LEAN': 'bg-blue-500/20 text-blue-400 border-blue-500/30 shadow-[0_0_20px_rgba(59,130,246,0.15)]',
    'SKIP': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30 shadow-[0_0_20px_rgba(245,158,11,0.15)]',
    'AVOID': 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.15)]',
  } as const;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border font-bold text-lg ${colors[recommendation as keyof typeof colors] || colors.SKIP}`}>
      {recommendation === 'BET' && '🎯'}
      {recommendation === 'LEAN' && '👍'}
      {recommendation === 'SKIP' && '⚠️'}
      {recommendation === 'AVOID' && '🚫'}
      {recommendation}
    </div>
  );
}

function ValueStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-lg ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function RiskBadge({ risk }: { risk: string }) {
  const colors = {
    'LOW': 'bg-green-500/20 text-green-400 border-green-500/30',
    'MEDIUM': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'HIGH': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'VERY HIGH': 'bg-red-500/20 text-red-400 border-red-500/30',
  } as const;

  return (
    <span className={`px-3 py-1 text-sm font-bold border rounded-full ${colors[risk as keyof typeof colors] || colors.MEDIUM}`}>
      {risk}
    </span>
  );
}

function FormCircles({ form }: { form: string }) {
  return (
    <div className="flex gap-1">
      {form.split('').map((result, index) => (
        <div
          key={index}
          className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
            result === 'W' ? 'bg-green-500 text-white' :
            result === 'D' ? 'bg-yellow-500 text-black' :
            result === 'L' ? 'bg-red-500 text-white' :
            'bg-gray-600 text-gray-300'
          }`}
        >
          {result}
        </div>
      ))}
    </div>
  );
}

function ComparisonColumn({ icon, title, color, borderColor, bgColor, data, footer }: {
  icon: string; title: string; color: string; borderColor: string; bgColor: string;
  data: { home: number; draw: number; away: number };
  footer: string;
}) {
  return (
    <div className={`${bgColor} border ${borderColor} rounded-xl overflow-hidden`}>
      <div className={`${color} py-3 px-4 text-center`}>
        <span className="text-lg mr-1.5">{icon}</span>
        <span className="text-sm font-black tracking-wider uppercase">{title}</span>
      </div>
      <div className="p-4 space-y-3">
        {(["home", "draw", "away"] as const).map((key) => (
          <div key={key}>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400 capitalize">{key === "home" ? "Home" : key === "draw" ? "Draw" : "Away"}</span>
              <span className={`font-bold ${color.replace("bg-", "text-").replace("/80", "")}`}>{data[key]}%</span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`}
                style={{ width: `${data[key]}%` }}
              />
            </div>
          </div>
        ))}
        <div className="text-center pt-1 text-xs text-gray-500">{footer}</div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function LeagueMatchClient({
  fixture,
  homeFormData,
  awayFormData,
  h2hData,
  injuries,
  odds,
  verdict
}: Props) {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [voting, setVoting] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Use league_ prefix for match ID to avoid collision with WC matches (1-72)
  const matchId = `league_${fixture.id}`;

  const fetchVotes = useCallback(async () => {
    try {
      const vid = getVisitorId();
      const res = await fetch(`/api/vote?matchId=${matchId}&visitorId=${vid}`);
      const data = await res.json();
      setVoteData(data);
    } catch (err) {
      console.error("Failed to fetch votes:", err);
    }
  }, [matchId]);

  useEffect(() => { 
    setMounted(true); 
    fetchVotes(); 
  }, [fetchVotes]);

  const handleVote = async (vote: "home" | "draw" | "away") => {
    if (voting) return;
    setVoting(true);
    try {
      const vid = getVisitorId();
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId, vote, visitorId: vid }),
      });
      const data = await res.json();
      if (data.success) setVoteData(data);
    } catch (err) {
      console.error("Vote failed:", err);
    }
    setVoting(false);
  };

  // Calculate market implied probabilities from best odds
  let marketHome = 0, marketDraw = 0, marketAway = 0;
  if (odds.length > 0) {
    const bestHome = Math.max(...odds.map(b => b.home));
    const bestDraw = Math.max(...odds.map(b => b.draw));
    const bestAway = Math.max(...odds.map(b => b.away));
    
    const rawHome = 1 / bestHome;
    const rawDraw = 1 / bestDraw;
    const rawAway = 1 / bestAway;
    const impliedTotal = rawHome + rawDraw + rawAway;
    
    marketHome = Math.round((rawHome / impliedTotal) * 100);
    marketDraw = Math.round((rawDraw / impliedTotal) * 100);
    marketAway = 100 - marketHome - marketDraw;
  } else {
    marketHome = verdict.homeWinPct;
    marketDraw = verdict.drawPct;
    marketAway = verdict.awayWinPct;
  }

  const marketPcts = { home: marketHome, draw: marketDraw, away: marketAway };
  const aiPcts = { home: verdict.homeWinPct, draw: verdict.drawPct, away: verdict.awayWinPct };
  const fanPcts = voteData ? voteData.percentages : null;

  const smartInsight = generateSmartInsight(fanPcts, aiPcts, marketPcts, fixture.home.name, fixture.away.name);

  // Best odds for predicted winner
  const isHomeWin = verdict.homeWinPct > verdict.awayWinPct;
  const bestOddsForWinner = odds.length > 0 ? 
    Math.max(...odds.map(b => isHomeWin ? b.home : b.away)) : 2.0;
  const bestBookForWinner = odds.find(b => 
    (isHomeWin ? b.home : b.away) === bestOddsForWinner
  );

  // Best/worst odds for table highlighting
  const bestHome = odds.length ? Math.max(...odds.map(b => b.home)) : 0;
  const worstHome = odds.length ? Math.min(...odds.filter(b => b.home > 0).map(b => b.home)) : 0;
  const bestDraw = odds.length ? Math.max(...odds.map(b => b.draw)) : 0;
  const worstDraw = odds.length ? Math.min(...odds.filter(b => b.draw > 0).map(b => b.draw)) : 0;
  const bestAway = odds.length ? Math.max(...odds.map(b => b.away)) : 0;
  const worstAway = odds.length ? Math.min(...odds.filter(b => b.away > 0).map(b => b.away)) : 0;

  const matchDateTime = new Date(fixture.date).toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul'
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* ═══ MATCH HEADER ═══ */}
      <GlassPanel>
        <div className="relative p-6 md:p-10 text-center overflow-hidden">
          {/* League Badge */}
          <div className="relative mb-6">
            <div className="flex items-center justify-center gap-3">
              <img src={fixture.league.logo} alt={fixture.league.name} className="w-8 h-8" />
              <span className="inline-block bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-full px-4 py-1.5 text-sm font-bold text-purple-300 tracking-wider uppercase">
                {fixture.league.name} · {fixture.league.country}
              </span>
            </div>
          </div>

          {/* Teams */}
          <div className="relative flex items-center justify-center gap-6 md:gap-12 mb-8">
            <div className="flex flex-col items-center gap-3 flex-1">
              <img src={fixture.home.logo} alt={fixture.home.name} className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />
              <span className="text-xl md:text-2xl font-black text-white tracking-wide text-center">{fixture.home.name}</span>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                VS
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 flex-1">
              <img src={fixture.away.logo} alt={fixture.away.name} className="w-16 h-16 md:w-20 md:h-20 rounded-lg" />
              <span className="text-xl md:text-2xl font-black text-white tracking-wide text-center">{fixture.away.name}</span>
            </div>
          </div>

          {/* Match Info */}
          <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-4">
            <span>📅 {matchDateTime}</span>
            <span className="text-white/20">·</span>
            <span>🏟️ {fixture.venue.name}</span>
            <span className="text-white/20">·</span>
            <span>📍 {fixture.venue.city}</span>
          </div>
        </div>
      </GlassPanel>

      {/* ═══ FAN VOTE BAR ═══ */}
      <GlassPanel>
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-1">🗳️ Who wins this match?</h2>
          <p className="text-xs text-gray-500 mb-5">Cast your prediction — voting closes at kickoff</p>

          {mounted && (
            <>
              {/* Vote Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {([
                  { key: "home" as const, label: fixture.home.name + " Win" },
                  { key: "draw" as const, label: "Draw" },
                  { key: "away" as const, label: fixture.away.name + " Win" },
                ]).map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleVote(key)}
                    disabled={voting}
                    className={`relative group overflow-hidden rounded-xl p-4 md:p-5 text-center transition-all duration-300 border cursor-pointer w-full ${
                      voteData?.userVote === key
                        ? "bg-purple-500/15 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.08)]"
                    } active:scale-95`}
                  >
                    <span className="text-sm md:text-base font-bold text-white block">{label}</span>
                    {voteData?.userVote === key && (
                      <span className="absolute top-2 right-2 text-purple-400 text-sm font-bold">✓</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Results after voting */}
              {voteData && voteData.total > 0 && (
                <div className="space-y-3 mb-4">
                  {([
                    { key: "home" as const, label: fixture.home.name, color: "bg-purple-500", textColor: "text-purple-400" },
                    { key: "draw" as const, label: "Draw", color: "bg-gray-500", textColor: "text-gray-400" },
                    { key: "away" as const, label: fixture.away.name, color: "bg-cyan-500", textColor: "text-cyan-400" },
                  ]).map(({ key, label, color, textColor }) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">{label}</span>
                        <span className={`font-bold ${textColor}`}>{voteData.percentages[key]}%</span>
                      </div>
                      <div className="h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${color} rounded-full transition-all duration-700 ease-out`}
                          style={{ width: `${voteData.percentages[key]}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1">
                    <span>{voteData.total.toLocaleString()} votes</span>
                    <span>Voting closes at kickoff</span>
                  </div>
                </div>
              )}

              {voteData?.userVote && (
                <div className="text-center text-sm text-gray-400 pt-1">
                  You voted: <span className="text-purple-400 font-bold">
                    {voteData.userVote === "home" ? fixture.home.name + " Win" : 
                     voteData.userVote === "away" ? fixture.away.name + " Win" : "Draw"}
                  </span> ✓
                  <span className="text-gray-600 ml-2 text-xs">· Tap another to change</span>
                </div>
              )}
            </>
          )}
        </div>
      </GlassPanel>

      {/* ═══ INTELLIGENCE COMPARISON ═══ */}
      <GlassPanel>
        <div className="p-1 bg-gradient-to-r from-purple-500/30 via-cyan-500/30 to-amber-500/30" />
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-6 text-center">🔍 Intelligence Comparison</h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <ComparisonColumn
              icon="👥" title="FANS" color="bg-purple-500/80" borderColor="border-purple-500/20"
              bgColor="bg-purple-500/[0.06]"
              data={fanPcts || { home: 0, draw: 0, away: 0 }}
              footer={voteData ? `${voteData.total.toLocaleString()} votes` : "Loading votes..."}
            />
            <ComparisonColumn
              icon="🧠" title="AI" color="bg-cyan-500/80" borderColor="border-cyan-500/20"
              bgColor="bg-cyan-500/[0.06]"
              data={aiPcts}
              footer={`${verdict.confidencePct}% confidence`}
            />
            <ComparisonColumn
              icon="💰" title="MARKET" color="bg-amber-500/80" borderColor="border-amber-500/20"
              bgColor="bg-amber-500/[0.06]"
              data={marketPcts}
              footer={odds.length > 0 ? `${odds.length}+ bookmakers` : "Market pending"}
            />
          </div>

          {/* Smart Insight */}
          <div className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-amber-500/10 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-200 leading-relaxed">{smartInsight}</p>
          </div>
        </div>
      </GlassPanel>

      {/* ═══ AI PREDICTION ═══ */}
      <GlassPanel>
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-6">🧠 AI Prediction</h2>

          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <RecommendationBadge recommendation={verdict.recommendation} />
                <RiskBadge risk={verdict.riskLevel} />
              </div>
              
              <div className="mb-4">
                <div className="text-lg font-bold text-white mb-2">AI Pick: {verdict.pick}</div>
                <div className="text-green-400 font-medium">Predicted Score: {verdict.predictedScore}</div>
              </div>

              <div className="flex items-center gap-4 mb-4">
                <div>
                  <div className="text-sm text-gray-400">Value Rating</div>
                  <ValueStars rating={verdict.valueRating} />
                </div>
                <div>
                  <div className="text-sm text-gray-400">Confidence</div>
                  <div className="text-lg font-bold text-white">{verdict.confidencePct}%</div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-sm text-gray-400 mb-2">AI Reasoning</div>
              <p className="text-gray-300 leading-relaxed mb-4">{verdict.reasoning}</p>
              
              {/* Confidence bar */}
              <div className="w-full">
                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                  <span>LOW</span>
                  <span className="font-bold text-white text-sm">CONFIDENCE</span>
                  <span>VERY HIGH</span>
                </div>
                <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-green-400 to-emerald-500`}
                    style={{ width: `${verdict.confidencePct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Suggested Angles */}
          <div className="mb-8">
            <h3 className="text-lg font-bold text-white mb-4">🎯 Suggested Angles</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/[0.03] border border-white/[0.06] border-l-4 border-l-green-500 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span>🛡️</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Safer Play</span>
                </div>
                <div className="text-white font-bold text-sm mb-1">{verdict.pick}</div>
                <div className="text-xs text-gray-500 leading-relaxed">Main AI recommendation with solid confidence backing</div>
              </div>

              <div className="bg-white/[0.03] border border-white/[0.06] border-l-4 border-l-red-500 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <span>🎲</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Risky Play</span>
                </div>
                <div className="text-white font-bold text-sm mb-1">Correct Score {verdict.predictedScore}</div>
                <div className="text-xs text-gray-500 leading-relaxed">AI's exact predicted scoreline — high reward play</div>
              </div>
            </div>
          </div>
        </div>
      </GlassPanel>

      {/* ═══ FORM & H2H SECTION ═══ */}
      <div className="grid md:grid-cols-2 gap-8">
        <GlassPanel>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <img src={fixture.home.logo} alt={fixture.home.name} className="w-6 h-6 rounded" />
              {fixture.home.name} Form
            </h3>
            {homeFormData ? (
              <div>
                <div className="mb-4">
                  <FormCircles form={verdict.homeForm} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Played:</span>
                    <span className="text-white ml-2">{homeFormData.played}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Wins:</span>
                    <span className="text-green-400 ml-2">{homeFormData.wins}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Draws:</span>
                    <span className="text-yellow-400 ml-2">{homeFormData.draws}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Losses:</span>
                    <span className="text-red-400 ml-2">{homeFormData.losses}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Form data unavailable</p>
            )}
          </div>
        </GlassPanel>

        <GlassPanel>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <img src={fixture.away.logo} alt={fixture.away.name} className="w-6 h-6 rounded" />
              {fixture.away.name} Form
            </h3>
            {awayFormData ? (
              <div>
                <div className="mb-4">
                  <FormCircles form={verdict.awayForm} />
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Played:</span>
                    <span className="text-white ml-2">{awayFormData.played}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Wins:</span>
                    <span className="text-green-400 ml-2">{awayFormData.wins}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Draws:</span>
                    <span className="text-yellow-400 ml-2">{awayFormData.draws}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Losses:</span>
                    <span className="text-red-400 ml-2">{awayFormData.losses}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">Form data unavailable</p>
            )}
          </div>
        </GlassPanel>
      </div>

      {/* ═══ HEAD-TO-HEAD ═══ */}
      {h2hData.length > 0 && (
        <GlassPanel>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">🥊 Head-to-Head (Last 5 Meetings)</h3>
            <div className="space-y-2">
              {h2hData.map((match, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700/30 last:border-b-0">
                  <div className="text-sm text-gray-400">
                    {new Date(match.date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-white">{match.home}</span>
                    <span className="px-2 py-1 bg-gray-800 rounded text-white font-mono">
                      {match.homeGoals}-{match.awayGoals}
                    </span>
                    <span className="text-white">{match.away}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ═══ INJURIES ═══ */}
      {injuries.length > 0 && (
        <GlassPanel>
          <div className="p-6">
            <h3 className="text-lg font-bold text-white mb-4">🏥 Injuries & Suspensions</h3>
            <div className="space-y-2">
              {injuries.map((injury, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-medium">{injury.player}</span>
                    <span className="text-gray-400 text-sm">({injury.team})</span>
                  </div>
                  <span className="text-red-400 text-sm">{injury.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ═══ MARKET VIEW / ODDS TABLE ═══ */}
      {odds.length > 0 && (
        <GlassPanel>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <h2 className="text-xl font-black text-white">💰 Market View</h2>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs font-bold text-amber-400">
                Live from {odds.length}+ bookmakers
              </span>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-3">Bookmaker</th>
                    <th className="text-center py-3 px-3">{fixture.home.name}</th>
                    <th className="text-center py-3 px-3">Draw</th>
                    <th className="text-center py-3 px-3">{fixture.away.name}</th>
                    <th className="text-right py-3 px-3">Visit</th>
                  </tr>
                </thead>
                <tbody>
                  {odds.slice(0, 8).map((odd, index) => (
                    <tr key={index} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                      <td className="py-3 px-3">
                        <a href={getBookmakerUrl(odd.bookmaker)} target="_blank" rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-cyan-400 transition">
                          {odd.bookmaker}
                        </a>
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${
                        odd.home === bestHome ? "text-green-400" : 
                        odd.home === worstHome ? "text-red-400/70" : "text-gray-300"
                      }`}>
                        {odd.home > 0 ? odd.home.toFixed(2) : "—"}
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${
                        odd.draw === bestDraw ? "text-green-400" : 
                        odd.draw === worstDraw ? "text-red-400/70" : "text-gray-300"
                      }`}>
                        {odd.draw > 0 ? odd.draw.toFixed(2) : "—"}
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${
                        odd.away === bestAway ? "text-green-400" : 
                        odd.away === worstAway ? "text-red-400/70" : "text-gray-300"
                      }`}>
                        {odd.away > 0 ? odd.away.toFixed(2) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a href={getBookmakerUrl(odd.bookmaker)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 transition hover:bg-cyan-500/20">
                          Visit →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3">
              <span className="text-xs text-gray-500">
                <span className="text-green-400">●</span> Best odds
                <span className="ml-3 text-red-400">●</span> Worst odds
              </span>
              <span className="text-xs text-gray-400">
                Market implies: <span className="text-white font-semibold">Home {marketHome}%</span> | 
                <span className="text-white font-semibold"> Draw {marketDraw}%</span> | 
                <span className="text-white font-semibold"> Away {marketAway}%</span>
              </span>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ═══ CTA ═══ */}
      {bestBookForWinner && (
        <GlassPanel>
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-cyan-600/20 pointer-events-none" />
            <div className="relative p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">
                Best available odds for <span className="text-white font-bold">{verdict.pick}</span>
              </p>
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
                {bestOddsForWinner.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mb-6">@ {bestBookForWinner.bookmaker}</p>
              <a
                href={getBookmakerUrl(bestBookForWinner.bookmaker)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3.5 px-10 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 text-lg"
              >
                🏆 Claim Best Odds →
              </a>
            </div>
          </div>
        </GlassPanel>
      )}
    </div>
  );
}