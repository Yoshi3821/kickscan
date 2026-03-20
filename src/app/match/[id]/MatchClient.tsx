"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import type { MatchAnalysis } from "@/lib/ai-engine";
import type { Verdict } from "@/lib/verdict-engine";
import { getBookmakerUrl } from "@/config/affiliates";
import { getPlayersForMatch, getCountryColor } from "@/data/players";
import Link from "next/link";

/* ─── Types ─── */
interface Bookmaker {
  key: string;
  name: string;
  home: number;
  draw: number;
  away: number;
  lastUpdate: string;
}

interface MatchData {
  id: number;
  group: string;
  date: string;
  time: string;
  home: string;
  away: string;
  venue: string;
  city: string;
  homeFlag: string;
  awayFlag: string;
}

interface Props {
  match: MatchData;
  analysis: MatchAnalysis;
  bookmakers: Bookmaker[];
  verdict: Verdict | null;
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
    return `⚡ All three perspectives align — ${fanFav} is the clear favorite. Fan confidence (${fan.home > fan.away ? fan.home : fan.away}%) ${fan.home > fan.away ? "leads" : "leads"} the way.`;
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

function generateAlternativeScores(predictedScore: string): { score: string; pct: number }[] {
  const [h, a] = predictedScore.split("-").map(Number);
  const alts: { score: string; pct: number }[] = [];
  // Lower-scoring variant
  if (h > 0) alts.push({ score: `${h - 1}-${a}`, pct: 28 });
  else alts.push({ score: `${h}-${a + 1}`, pct: 22 });
  // Higher-scoring variant
  alts.push({ score: `${h + 1}-${a + 1}`, pct: 18 });
  // Draw variant
  const minGoals = Math.min(h, a);
  alts.push({ score: `${minGoals}-${minGoals}`, pct: 14 });
  return alts.slice(0, 3);
}

function generateAngles(analysis: MatchAnalysis, home: string, away: string) {
  const [h, a] = analysis.predictedScore.split("-").map(Number);
  const totalGoals = h + a;
  const isHighConf = analysis.confidence === "HIGH" || analysis.confidence === "VERY HIGH";
  const winner = analysis.homeWinPct > analysis.awayWinPct ? home : away;
  const isHomeWin = analysis.homeWinPct > analysis.awayWinPct;

  const safer = isHighConf
    ? { label: winner + " Win", desc: `Strong conviction pick backed by ${analysis.confidence.toLowerCase()} AI confidence` }
    : { label: `Double Chance: ${winner} or Draw`, desc: "Lower confidence warrants protection against a draw" };

  const balanced = h > a && h - a >= 2
    ? { label: `${winner} -1 Handicap`, desc: `AI predicts a ${analysis.predictedScore} scoreline — margin to spare` }
    : { label: `${winner} Win & Over 1.5 Goals`, desc: "Combine the result with goal action for better odds" };

  const risky = {
    label: `Correct Score ${analysis.predictedScore}`,
    desc: `AI's exact predicted scoreline — high reward play`,
  };

  const goals = totalGoals <= 2
    ? { label: "Under 2.5 Goals", desc: `Predicted total of ${totalGoals} goals. Tight, tactical contest expected` }
    : { label: "Over 2.5 Goals", desc: `Predicted total of ${totalGoals} goals. Open, attacking match expected` };

  return { safer, balanced, risky, goals };
}

/* ─── Scroll fade-in hook ─── */
function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  return { ref, className: "" };
}

/* ─── Sub-components ─── */
function GlassPanel({ children, className = "", delay }: { children: React.ReactNode; className?: string; delay?: number }) {
  const fade = useFadeIn();
  return (
    <div ref={fade.ref} className={`${fade.className} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden">
        {children}
      </div>
    </div>
  );
}

function ConfidenceMeter({ level }: { level: string }) {
  const levels: Record<string, number> = { "LOW": 25, "MEDIUM": 50, "HIGH": 75, "VERY HIGH": 95 };
  const pct = levels[level] || 50;
  return (
    <div className="w-full">
      <div className="flex justify-between text-xs text-gray-500 mb-1.5">
        <span>LOW</span>
        <span className="font-bold text-white text-sm">{level}</span>
        <span>VERY HIGH</span>
      </div>
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ease-out ${
            pct < 35 ? "bg-gradient-to-r from-red-500 to-orange-500" :
            pct < 60 ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
            pct < 80 ? "bg-gradient-to-r from-yellow-500 to-green-500" :
            "bg-gradient-to-r from-green-400 to-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HorizBar({ pct, color, label, showInside = true }: { pct: number; color: string; label: string; showInside?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-400 w-20 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-6 bg-white/5 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out flex items-center justify-end pr-2.5`}
          style={{ width: `${Math.max(pct, 5)}%` }}
        >
          {showInside && pct > 12 && <span className="text-xs font-bold text-white drop-shadow">{pct}%</span>}
        </div>
      </div>
      {(!showInside || pct <= 12) && <span className="text-sm font-bold text-gray-400 w-10">{pct}%</span>}
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
      <div className={`${color} py-2.5 px-4 text-center`}>
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

const factorEmojis: Record<string, string> = {
  "home": "🏟️", "venue": "🏟️", "stadium": "🏟️", "host": "🏟️",
  "form": "📊", "recent": "📊", "momentum": "📊",
  "rival": "⚔️", "history": "⚔️", "head": "⚔️",
  "injur": "🏥", "squad": "🏥", "fitness": "🏥",
  "tactic": "🧩", "style": "🧩", "system": "🧩",
  "defen": "🛡️", "attack": "⚡", "goal": "⚽",
  "key player": "⭐", "star": "⭐", "talent": "⭐",
  "coach": "📋", "manager": "📋",
  "weather": "🌤️", "climate": "🌤️", "altitude": "🏔️",
};

function getFactorEmoji(factor: string): string {
  const lower = factor.toLowerCase();
  for (const [keyword, emoji] of Object.entries(factorEmojis)) {
    if (lower.includes(keyword)) return emoji;
  }
  return "📌";
}

/* ─── Verdict Panel Component ─── */
function VerdictPanel({ verdict }: { verdict: Verdict }) {
  const recConfig = {
    BET: {
      emoji: "✅",
      bg: "bg-green-500/[0.08]",
      border: "border-green-500/30",
      text: "text-green-400",
      glow: "shadow-[0_0_30px_rgba(34,197,94,0.12)]",
      barColor: "from-green-500 to-emerald-400",
      topBar: "from-green-500 via-emerald-400 to-green-500",
    },
    LEAN: {
      emoji: "⚠️",
      bg: "bg-amber-500/[0.08]",
      border: "border-amber-500/30",
      text: "text-amber-400",
      glow: "shadow-[0_0_30px_rgba(245,158,11,0.12)]",
      barColor: "from-amber-500 to-yellow-400",
      topBar: "from-amber-500 via-yellow-400 to-amber-500",
    },
    SKIP: {
      emoji: "⏭️",
      bg: "bg-gray-500/[0.08]",
      border: "border-gray-500/30",
      text: "text-gray-400",
      glow: "shadow-[0_0_30px_rgba(107,114,128,0.12)]",
      barColor: "from-gray-500 to-gray-400",
      topBar: "from-gray-500 via-gray-400 to-gray-500",
    },
    AVOID: {
      emoji: "🚫",
      bg: "bg-red-500/[0.08]",
      border: "border-red-500/30",
      text: "text-red-400",
      glow: "shadow-[0_0_30px_rgba(239,68,68,0.12)]",
      barColor: "from-red-500 to-rose-400",
      topBar: "from-red-500 via-rose-400 to-red-500",
    },
  };
  
  const riskConfig = {
    LOW: { color: "bg-green-500/20 text-green-400 border-green-500/30", dot: "bg-green-400" },
    MEDIUM: { color: "bg-amber-500/20 text-amber-400 border-amber-500/30", dot: "bg-amber-400" },
    HIGH: { color: "bg-orange-500/20 text-orange-400 border-orange-500/30", dot: "bg-orange-400" },
    "VERY HIGH": { color: "bg-red-500/20 text-red-400 border-red-500/30", dot: "bg-red-400" },
  };

  const cfg = recConfig[verdict.recommendation];
  const risk = riskConfig[verdict.riskLevel];

  const stars = Array.from({ length: 5 }, (_, i) => i < verdict.valueRating);

  return (
    <div className={`${cfg.glow} rounded-2xl overflow-hidden`}>
      {/* Gradient top bar — thicker (4px) */}
      <div className={`h-1 bg-gradient-to-r ${cfg.topBar}`} />
      
      <div className={`${cfg.bg} backdrop-blur-xl border ${cfg.border} border-t-0 rounded-b-2xl`}>
        <div className="p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
              <span className="text-2xl">🎯</span> THE VERDICT
            </h2>
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${cfg.border} ${cfg.bg} ${cfg.text}`}>
              AI Analysis
            </span>
          </div>

          {/* Main recommendation card */}
          <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-5 md:p-6 mb-6`}>
            {/* Big pick */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{cfg.emoji}</span>
              <div>
                <div className={`text-2xl md:text-3xl font-black ${cfg.text}`}>
                  {verdict.recommendation}: {verdict.pick}
                </div>
              </div>
            </div>

            {/* Value + Risk + Confidence row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Value stars */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Value</div>
                <div className="flex items-center gap-1">
                  {stars.map((filled, i) => (
                    <span key={i} className={`text-lg ${filled ? "text-amber-400" : "text-gray-600"}`}>
                      ★
                    </span>
                  ))}
                  <span className="text-sm text-gray-300 ml-2 font-medium">{verdict.valueLabel}</span>
                </div>
              </div>

              {/* Risk level */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Risk</div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${risk.color}`}>
                  <span className={`w-2 h-2 rounded-full ${risk.dot}`} />
                  {verdict.riskLevel}
                </span>
              </div>

              {/* Confidence bar */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-1.5">Confidence</div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-3 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor} transition-all duration-1000`}
                      style={{ width: `${verdict.confidencePct}%` }}
                    />
                  </div>
                  <span className={`text-sm font-bold ${cfg.text}`}>{verdict.confidencePct}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* WHY section */}
          {verdict.reasoning && (
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-black text-white uppercase tracking-wider">WHY</span>
              </div>
              <p className="text-gray-300 text-sm md:text-base leading-relaxed italic">
                &ldquo;{verdict.reasoning}&rdquo;
              </p>
            </div>
          )}

          {/* Key Insight */}
          {verdict.keyInsight && (
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4 mb-5">
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">💡</span>
                <p className="text-sm text-gray-200 font-medium">{verdict.keyInsight}</p>
              </div>
            </div>
          )}

          {/* WATCH OUT */}
          {verdict.watchOut && (
            <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <span className="text-lg shrink-0">⚠️</span>
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Watch Out</span>
                  <p className="text-sm text-gray-300 mt-1">{verdict.watchOut}</p>
                </div>
              </div>
            </div>
          )}

          {/* Safer / Risky plays side by side */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {/* Safer Play */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span>🛡️</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Safer Play</span>
              </div>
              <div className="text-sm font-bold text-white mb-1">{verdict.saferAlt.pick}</div>
              <div className="text-xs text-gray-400">@ {verdict.saferAlt.odds}</div>
              <div className="text-xs text-green-400 mt-1 font-medium">AI: {verdict.saferAlt.aiProb}%</div>
            </div>

            {/* Risky Play */}
            <div className="bg-white/[0.04] border border-white/[0.08] rounded-xl p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <span>🎲</span>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Risky Play</span>
              </div>
              <div className="text-sm font-bold text-white mb-1">{verdict.riskyPlay.pick}</div>
              <div className="text-xs text-gray-400">@ {verdict.riskyPlay.odds}</div>
              <div className="text-xs text-amber-400 mt-1 font-medium">AI: {verdict.riskyPlay.aiProb}%</div>
            </div>
          </div>

          {/* AI vs Market probabilities */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
            <span>AI probability: <span className="text-white font-bold">{verdict.aiProb}%</span></span>
            <span>Market implied: <span className="text-white font-bold">{verdict.marketProb}%</span></span>
            <span>Value gap: <span className={`font-bold ${verdict.valueGap > 0 ? "text-green-400" : "text-red-400"}`}>{verdict.valueGap > 0 ? "+" : ""}{verdict.valueGap}%</span></span>
          </div>

          {/* Best Odds CTA */}
          <div className="bg-gradient-to-r from-purple-600/10 via-pink-600/5 to-cyan-600/10 border border-white/[0.08] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-center sm:text-left">
              <span className="text-sm text-gray-400">💰 Best odds: </span>
              <span className="text-white font-bold">{verdict.pick} @ {verdict.bestOdds.odds.toFixed(2)}</span>
              <span className="text-gray-500 text-sm"> via {verdict.bestOdds.bookmaker}</span>
            </div>
            <a
              href={getBookmakerUrl(verdict.bestOdds.bookmaker)}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 ${cfg.bg} border ${cfg.border} ${cfg.text} font-bold py-2.5 px-6 rounded-xl transition-all duration-300 hover:scale-105 text-sm whitespace-nowrap`}
            >
              🏆 Claim Odds →
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─── */
export default function MatchClient({ match, analysis, bookmakers, verdict }: Props) {
  const [voteData, setVoteData] = useState<VoteData | null>(null);
  const [voting, setVoting] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<any>(null);

  const fetchVotes = useCallback(async () => {
    try {
      const vid = getVisitorId();
      const res = await fetch(`/api/vote?matchId=${match.id}&visitorId=${vid}`);
      const data = await res.json();
      setVoteData(data);
    } catch (err) {
      console.error("Failed to fetch votes:", err);
    }
  }, [match.id]);

  useEffect(() => { 
    setMounted(true); 
    fetchVotes();
    
    // Check for logged in user
    const savedUser = localStorage.getItem("kickscan_user");
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
      } catch (err) {
        // Invalid user data
      }
    }
  }, [fetchVotes]);

  const handleVote = async (vote: "home" | "draw" | "away") => {
    if (voting) return;
    setVoting(true);
    try {
      const vid = getVisitorId();
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId: match.id, vote, visitorId: vid }),
      });
      const data = await res.json();
      if (data.success) setVoteData(data);
    } catch (err) {
      console.error("Vote failed:", err);
    }
    setVoting(false);
  };

  // Best/worst odds
  const bestHome = bookmakers.length ? Math.max(...bookmakers.map(b => b.home)) : 0;
  const worstHome = bookmakers.length ? Math.min(...bookmakers.filter(b => b.home > 0).map(b => b.home)) : 0;
  const bestDraw = bookmakers.length ? Math.max(...bookmakers.map(b => b.draw)) : 0;
  const worstDraw = bookmakers.length ? Math.min(...bookmakers.filter(b => b.draw > 0).map(b => b.draw)) : 0;
  const bestAway = bookmakers.length ? Math.max(...bookmakers.map(b => b.away)) : 0;
  const worstAway = bookmakers.length ? Math.min(...bookmakers.filter(b => b.away > 0).map(b => b.away)) : 0;

  // Market implied probabilities from best odds
  let marketHome = 0, marketDraw = 0, marketAway = 0;
  if (bookmakers.length) {
    const rawHome = 1 / bestHome;
    const rawDraw = 1 / bestDraw;
    const rawAway = 1 / bestAway;
    const impliedTotal = rawHome + rawDraw + rawAway;
    marketHome = Math.round((rawHome / impliedTotal) * 100);
    marketDraw = Math.round((rawDraw / impliedTotal) * 100);
    marketAway = 100 - marketHome - marketDraw;
  } else {
    marketHome = analysis.homeWinPct;
    marketDraw = analysis.drawPct;
    marketAway = analysis.awayWinPct;
  }
  const marketPcts = { home: marketHome, draw: marketDraw, away: marketAway };
  const aiPcts = { home: analysis.homeWinPct, draw: analysis.drawPct, away: analysis.awayWinPct };
  const fanPcts = voteData ? voteData.percentages : null;

  // CTA best odds for predicted winner
  const isHomeWin = analysis.homeWinPct > analysis.awayWinPct;
  const bestOddsForWinner = isHomeWin ? bestHome : bestAway;
  const bestBookForWinner = bookmakers.find(b => (isHomeWin ? b.home : b.away) === bestOddsForWinner);
  const predictedWinner = isHomeWin ? match.home : match.away;
  const predictedWinnerFlag = isHomeWin ? match.homeFlag : match.awayFlag;

  const angles = generateAngles(analysis, match.home, match.away);
  const altScores = generateAlternativeScores(analysis.predictedScore);
  const smartInsight = generateSmartInsight(fanPcts, aiPcts, marketPcts, match.home, match.away);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      {/* ═══ PANEL A — MATCH HEADER ═══ */}
      <GlassPanel>
        <div className="relative p-6 md:p-10 text-center overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 via-transparent to-cyan-500/5 pointer-events-none" />

          {/* Competition Badge */}
          <div className="relative mb-6">
            <span className="inline-block bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border border-purple-500/30 rounded-full px-4 py-1.5 text-xs font-bold text-purple-300 tracking-wider uppercase">
              FIFA World Cup 2026 · Group {match.group}
            </span>
          </div>

          {/* Teams */}
          <div className="relative flex items-center justify-center gap-6 md:gap-12 mb-8">
            <div className="flex flex-col items-center gap-3 flex-1">
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl drop-shadow-lg">{match.homeFlag}</span>
              <span className="text-xl md:text-3xl font-black text-white tracking-wide">{match.home.toUpperCase()}</span>
            </div>

            <div className="flex flex-col items-center shrink-0">
              <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                VS
              </span>
            </div>

            <div className="flex flex-col items-center gap-3 flex-1">
              <span className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl drop-shadow-lg">{match.awayFlag}</span>
              <span className="text-xl md:text-3xl font-black text-white tracking-wide">{match.away.toUpperCase()}</span>
            </div>
          </div>

          {/* Match Info */}
          <div className="relative flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-gray-400 mb-4">
            <span>📅 {match.date}</span>
            <span className="text-white/20">·</span>
            <span>⏰ {match.time}</span>
            <span className="text-white/20">·</span>
            <span>🏟️ {match.venue}</span>
            <span className="text-white/20">·</span>
            <span>📍 {match.city}</span>
          </div>

          {/* Status Badge */}
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 bg-emerald-500/15 border border-emerald-500/30 rounded-full px-3 py-1 text-xs font-bold text-emerald-400 tracking-wider uppercase">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              Upcoming
            </span>
          </div>

          {/* Gradient line */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        </div>
      </GlassPanel>

      {/* ═══ THE VERDICT — FIRST AND MOST IMPORTANT ═══ */}
      {verdict && <VerdictPanel verdict={verdict} />}

      {/* ═══ SIGNUP PROMPT FOR NON-LOGGED IN USERS ═══ */}
      {!user && (
        <GlassPanel delay={25}>
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-cyan-600/20 pointer-events-none" />
            <div className="relative p-8 text-center">
              <h3 className="text-2xl font-bold text-white mb-3">🎮 Think you know the result?</h3>
              <p className="text-gray-400 mb-6">
                Predict this match and compete on the global leaderboard!
              </p>
              <a
                href="/predict"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-bold py-3.5 px-8 rounded-xl transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                Create Account — It's Free →
              </a>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ═══ PANEL B — FAN VOTE ═══ */}
      <GlassPanel delay={50}>
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-1">🗳️ Who wins this match?</h2>
          <p className="text-xs text-gray-500 mb-5">Cast your prediction — voting closes at kickoff</p>

          {mounted && (
            <>
              {/* Vote Buttons */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                {([
                  { key: "home" as const, flag: match.homeFlag, label: match.home + " Win" },
                  { key: "draw" as const, flag: "🤝", label: "Draw" },
                  { key: "away" as const, flag: match.awayFlag, label: match.away + " Win" },
                ]).map(({ key, flag, label }) => (
                  <button
                    key={key}
                    onClick={() => handleVote(key)}
                    disabled={voting}
                    className={`relative group overflow-hidden rounded-xl p-4 md:p-5 text-center transition-all duration-300 border cursor-pointer ${
                      voteData?.userVote === key
                        ? "bg-purple-500/15 border-purple-500/50 shadow-[0_0_20px_rgba(168,85,247,0.15)] scale-[1.02]"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.07] hover:border-white/20 hover:shadow-[0_0_15px_rgba(168,85,247,0.08)]"
                    } active:scale-95`}
                  >
                    <span className="text-4xl md:text-5xl block mb-2">{flag}</span>
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
                    { key: "home" as const, label: match.home, color: "bg-purple-500", textColor: "text-purple-400" },
                    { key: "draw" as const, label: "Draw", color: "bg-gray-500", textColor: "text-gray-400" },
                    { key: "away" as const, label: match.away, color: "bg-cyan-500", textColor: "text-cyan-400" },
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
                    {voteData.userVote === "home" ? match.home + " Win" : voteData.userVote === "away" ? match.away + " Win" : "Draw"}
                  </span> ✓
                  <span className="text-gray-600 ml-2 text-xs">· Tap another to change</span>
                </div>
              )}
            </>
          )}
        </div>
      </GlassPanel>

      {/* ═══ PANEL C — INTELLIGENCE COMPARISON (SIGNATURE) ═══ */}
      <GlassPanel delay={100}>
        <div className="p-1 bg-gradient-to-r from-purple-500/30 via-cyan-500/30 to-amber-500/30" />
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-6 text-center">🔍 Intelligence Comparison</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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
              footer={`${analysis.confidence} confidence`}
            />
            <ComparisonColumn
              icon="💰" title="MARKET" color="bg-amber-500/80" borderColor="border-amber-500/20"
              bgColor="bg-amber-500/[0.06]"
              data={marketPcts}
              footer={bookmakers.length > 0 ? `${bookmakers.length}+ bookmakers` : "Market pending"}
            />
          </div>

          {/* Smart Insight */}
          <div className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-amber-500/10 border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-200 leading-relaxed">{smartInsight}</p>
          </div>
        </div>
      </GlassPanel>

      {/* ═══ PANEL D — AI PREDICTION ═══ */}
      <GlassPanel delay={150}>
        <div className="p-6">
          <h2 className="text-xl font-black text-white mb-6">🧠 AI Prediction</h2>

          <div className="flex flex-col md:flex-row items-center gap-8 mb-8">
            {/* Predicted winner */}
            <div className="text-center md:text-left flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Predicted Result</div>
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <span className="text-4xl">{predictedWinnerFlag}</span>
                <span className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
                  {analysis.predictedResult.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Predicted score */}
            <div className="text-center flex-1">
              <div className="text-xs text-gray-500 uppercase tracking-widest mb-2">Predicted Score</div>
              <div className="text-3xl sm:text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
                {analysis.predictedScore.replace("-", " — ")}
              </div>
            </div>
          </div>

          {/* Confidence */}
          <div className="mb-8">
            <ConfidenceMeter level={analysis.confidence} />
          </div>

          {/* Probability bars */}
          <div className="space-y-3 mb-6">
            <HorizBar label="Home Win" pct={analysis.homeWinPct} color="bg-gradient-to-r from-purple-600 to-purple-400" />
            <HorizBar label="Draw" pct={analysis.drawPct} color="bg-gradient-to-r from-gray-600 to-gray-400" />
            <HorizBar label="Away Win" pct={analysis.awayWinPct} color="bg-gradient-to-r from-cyan-600 to-cyan-400" />
          </div>

          {/* Alternative scores */}
          <div className="text-center text-sm text-gray-400">
            <span className="text-gray-500">Other likely scores: </span>
            {altScores.map((s, i) => (
              <span key={i}>
                <span className="text-white font-semibold">{s.score}</span>
                <span className="text-gray-500"> ({s.pct}%)</span>
                {i < altScores.length - 1 && <span className="text-gray-600"> · </span>}
              </span>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* ═══ PANEL E — AI ANALYSIS ═══ */}
      {analysis.summary && (
        <GlassPanel delay={200}>
          <div className="p-6">
            <h2 className="text-xl font-black text-white mb-5">📝 Match Analysis</h2>

            {/* Summary */}
            <p className="text-gray-300 text-base md:text-lg leading-relaxed mb-8" style={{ lineHeight: "1.8" }}>
              {analysis.summary}
            </p>

            {/* Key Factors */}
            {analysis.keyFactors.length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Key Factors</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {analysis.keyFactors.map((factor, i) => {
                    const emoji = getFactorEmoji(factor);
                    const text = factor.replace(/^[^\w\s]{1,2}\s*/, ""); // strip leading emoji if present
                    return (
                      <div key={i} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 flex items-start gap-3">
                        <span className="text-xl shrink-0">{emoji}</span>
                        <span className="text-sm text-gray-300 leading-relaxed">{text}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Form Guide */}
            {analysis.formGuide.home.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Recent Form</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {([
                    { team: match.home, flag: match.homeFlag, form: analysis.formGuide.home },
                    { team: match.away, flag: match.awayFlag, form: analysis.formGuide.away },
                  ]).map(({ team, flag, form }) => (
                    <div key={team} className="flex items-center gap-3">
                      <span className="text-2xl">{flag}</span>
                      <span className="text-sm font-bold text-white w-24 shrink-0">{team}</span>
                      <div className="flex gap-1.5">
                        {form.map((r, i) => (
                          <span
                            key={i}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                              r === "W" ? "bg-green-500/20 text-green-400 border border-green-500/30" :
                              r === "D" ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" :
                              "bg-red-500/20 text-red-400 border border-red-500/30"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </GlassPanel>
      )}


      {/* ═══ KEY PLAYER SPOTLIGHT ═══ */}
      {(() => {
        const spotlightPlayers = getPlayersForMatch(match.home, match.away);
        if (spotlightPlayers.length === 0) return null;
        return (
          <GlassPanel delay={225}>
            <div className="p-6">
              <h2 className="text-xl font-black text-white mb-5">⭐ Key Player Spotlight</h2>
              <div className={`grid grid-cols-1 ${spotlightPlayers.length > 1 ? "md:grid-cols-2" : ""} gap-4`}>
                {spotlightPlayers.map((sp) => {
                  const spColor = getCountryColor(sp.country);
                  return (
                    <div
                      key={sp.slug}
                      className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5"
                      style={{ borderLeftWidth: "3px", borderLeftColor: spColor }}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-3xl">{sp.flag}</span>
                        <div>
                          <div className="text-base font-black text-white">{sp.name}</div>
                          <div className="text-xs text-gray-500">#{sp.number} · {sp.position}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-gray-400 mb-3">
                        {sp.wcGoals > 0 && <span>⚽ {sp.wcGoals} WC goals</span>}
                        {sp.wcApps > 0 && <span>📊 {sp.wcApps} appearances</span>}
                        {sp.wcGoals === 0 && sp.wcApps === 0 && <span>🌟 WC Debut</span>}
                      </div>

                      <p className="text-sm text-gray-300 mb-3 line-clamp-3">
                        {sp.storyline.split("\n\n")[0]?.substring(0, 200)}...
                      </p>

                      {sp.goldenBootOdds !== "N/A" && (
                        <div className="text-xs text-amber-400 font-semibold mb-3">
                          Golden Boot: {sp.goldenBootOdds}
                        </div>
                      )}

                      <Link
                        href={`/players/${sp.slug}`}
                        className="inline-block text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
                      >
                        Full Player Profile →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>
          </GlassPanel>
        );
      })()}

      {/* ═══ PANEL F — SUGGESTED ANGLES ═══ */}
      <GlassPanel delay={250}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-xl font-black text-white">🎯 Intelligent Angles</h2>
          </div>
          <p className="text-[11px] text-gray-600 mb-6">Analysis for informational purposes only. Please gamble responsibly.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              { emoji: "🟢", title: "Safer Pick", ...angles.safer, border: "border-l-green-500" },
              { emoji: "🟡", title: "Balanced", ...angles.balanced, border: "border-l-yellow-500" },
              { emoji: "🔴", title: "Higher Risk", ...angles.risky, border: "border-l-red-500" },
              { emoji: "⚽", title: "Goals Lean", ...angles.goals, border: "border-l-blue-500" },
            ]).map((angle) => (
              <div key={angle.title} className={`bg-white/[0.03] border border-white/[0.06] border-l-4 ${angle.border} rounded-xl p-4`}>
                <div className="flex items-center gap-2 mb-1.5">
                  <span>{angle.emoji}</span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{angle.title}</span>
                </div>
                <div className="text-white font-bold text-sm mb-1">{angle.label}</div>
                <div className="text-xs text-gray-500 leading-relaxed">{angle.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </GlassPanel>

      {/* ═══ PANEL G — MARKET / ODDS ═══ */}
      {bookmakers.length > 0 && (
        <GlassPanel delay={300}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
              <h2 className="text-xl font-black text-white">💰 Market View</h2>
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full px-3 py-1 text-xs font-bold text-amber-400">
                Live from {bookmakers.length}+ bookmakers
              </span>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase tracking-wider">
                    <th className="text-left py-3 px-3">Bookmaker</th>
                    <th className="text-center py-3 px-3">{match.home}</th>
                    <th className="text-center py-3 px-3">Draw</th>
                    <th className="text-center py-3 px-3">{match.away}</th>
                    <th className="text-right py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookmakers.slice(0, 8).map((bm) => (
                    <tr key={bm.key} className="border-t border-white/5 hover:bg-white/[0.03] transition">
                      <td className="py-3 px-3">
                        <a href={getBookmakerUrl(bm.name)} target="_blank" rel="noopener noreferrer"
                          className="font-semibold text-white hover:text-cyan-400 transition">
                          {bm.name}
                        </a>
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${bm.home === bestHome ? "text-green-400" : bm.home === worstHome ? "text-red-400/70" : "text-gray-300"}`}>
                        {bm.home > 0 ? bm.home.toFixed(2) : "—"}
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${bm.draw === bestDraw ? "text-green-400" : bm.draw === worstDraw ? "text-red-400/70" : "text-gray-300"}`}>
                        {bm.draw > 0 ? bm.draw.toFixed(2) : "—"}
                      </td>
                      <td className={`py-3 px-3 text-center font-bold ${bm.away === bestAway ? "text-green-400" : bm.away === worstAway ? "text-red-400/70" : "text-gray-300"}`}>
                        {bm.away > 0 ? bm.away.toFixed(2) : "—"}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <a href={getBookmakerUrl(bm.name)} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-3 py-1 transition hover:bg-cyan-500/20">
                          Visit →
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Legend + implied probs */}
            <div className="mt-4 pt-4 border-t border-white/5 flex flex-col md:flex-row justify-between gap-3">
              <span className="text-xs text-gray-500">
                <span className="text-green-400">●</span> Best odds
                <span className="ml-3 text-red-400">●</span> Worst odds
              </span>
              <span className="text-xs text-gray-400">
                Market implies: <span className="text-white font-semibold">Home {marketHome}%</span> | <span className="text-white font-semibold">Draw {marketDraw}%</span> | <span className="text-white font-semibold">Away {marketAway}%</span>
              </span>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* ═══ PANEL H — CTA ═══ */}
      {bestBookForWinner && (
        <GlassPanel delay={350}>
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/10 to-cyan-600/20 pointer-events-none" />
            <div className="relative p-8 text-center">
              <p className="text-sm text-gray-400 mb-3">
                Best available odds for <span className="text-white font-bold">{predictedWinner}</span>
              </p>
              <div className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 mb-2">
                {bestOddsForWinner.toFixed(2)}
              </div>
              <p className="text-sm text-gray-500 mb-6">@ {bestBookForWinner.name}</p>
              <a
                href={getBookmakerUrl(bestBookForWinner.name)}
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
