"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { allMatches, groups } from "@/data/matches";
import { getAllVerdicts } from "@/data/verdicts";
import type { Verdict } from "@/lib/verdict-engine";

type FilterMode = "ALL" | "BET" | "VALUE" | "GROUP";

const recConfig: Record<string, { emoji: string; bg: string; border: string; text: string }> = {
  BET: { emoji: "✅", bg: "bg-green-500/15", border: "border-green-500/30", text: "text-green-400" },
  LEAN: { emoji: "⚠️", bg: "bg-amber-500/15", border: "border-amber-500/30", text: "text-amber-400" },
  SKIP: { emoji: "⏭️", bg: "bg-gray-500/15", border: "border-gray-500/30", text: "text-gray-400" },
  AVOID: { emoji: "🚫", bg: "bg-red-500/15", border: "border-red-500/30", text: "text-red-400" },
};

const riskColors: Record<string, string> = {
  LOW: "text-green-400",
  MEDIUM: "text-amber-400",
  HIGH: "text-orange-400",
  "VERY HIGH": "text-red-400",
};

export default function VerdictsPage() {
  const [filter, setFilter] = useState<FilterMode>("ALL");
  const [selectedGroup, setSelectedGroup] = useState("A");
  const [sortBy, setSortBy] = useState<"value" | "risk" | "confidence">("value");

  const allVerdictsData = useMemo(() => getAllVerdicts(), []);

  const filtered = useMemo(() => {
    let result = [...allVerdictsData];

    if (filter === "BET") {
      result = result.filter(v => v.recommendation === "BET");
    } else if (filter === "VALUE") {
      result = result.filter(v => v.valueRating >= 3);
    } else if (filter === "GROUP") {
      const groupMatchIds = allMatches.filter(m => m.group === selectedGroup).map(m => m.id);
      result = result.filter(v => groupMatchIds.includes(v.matchId));
    }

    // Sort
    if (sortBy === "value") {
      result.sort((a, b) => b.valueRating - a.valueRating || b.valueGap - a.valueGap);
    } else if (sortBy === "risk") {
      const riskOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, "VERY HIGH": 3 };
      result.sort((a, b) => riskOrder[a.riskLevel] - riskOrder[b.riskLevel]);
    } else {
      result.sort((a, b) => b.confidencePct - a.confidencePct);
    }

    return result;
  }, [allVerdictsData, filter, selectedGroup, sortBy]);

  const betCount = allVerdictsData.filter(v => v.recommendation === "BET").length;
  const leanCount = allVerdictsData.filter(v => v.recommendation === "LEAN").length;
  const skipCount = allVerdictsData.filter(v => v.recommendation === "SKIP").length;
  const avoidCount = allVerdictsData.filter(v => v.recommendation === "AVOID").length;

  return (
    <main className="min-h-screen bg-[#06060f] bg-dot-pattern">
      <div className="max-w-7xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
            🎯 <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">THE VERDICTS</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Every match. One clear call. AI-powered verdicts for all 72 World Cup 2026 group stage matches.
          </p>
        </div>

        {/* Stats bar */}
        <div className="grid grid-cols-4 gap-3 mb-8">
          {[
            { label: "BET", count: betCount, ...recConfig.BET },
            { label: "LEAN", count: leanCount, ...recConfig.LEAN },
            { label: "SKIP", count: skipCount, ...recConfig.SKIP },
            { label: "AVOID", count: avoidCount, ...recConfig.AVOID },
          ].map(s => (
            <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-3 text-center`}>
              <div className={`text-2xl font-black ${s.text}`}>{s.count}</div>
              <div className="text-xs text-gray-500 font-bold uppercase tracking-wider">{s.emoji} {s.label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex gap-2">
            {(["ALL", "BET", "VALUE", "GROUP"] as FilterMode[]).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all border ${
                  filter === f
                    ? "bg-purple-500/20 border-purple-500/40 text-purple-300"
                    : "bg-white/[0.04] border-white/[0.08] text-gray-400 hover:bg-white/[0.08]"
                }`}
              >
                {f === "ALL" ? "All Matches" : f === "BET" ? "✅ BET Only" : f === "VALUE" ? "⭐ Value Picks" : "📋 By Group"}
              </button>
            ))}
          </div>

          {filter === "GROUP" && (
            <select
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm font-bold bg-white/[0.06] border border-white/[0.1] text-white"
            >
              {groups.map(g => <option key={g} value={g}>Group {g}</option>)}
            </select>
          )}

          <div className="ml-auto flex items-center gap-2 text-xs text-gray-500">
            <span>Sort:</span>
            {(["value", "risk", "confidence"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  sortBy === s ? "bg-white/10 text-white font-bold" : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {s === "value" ? "Value ↓" : s === "risk" ? "Risk ↑" : "Confidence ↓"}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="text-sm text-gray-500 mb-4">
          Showing {filtered.length} of {allVerdictsData.length} verdicts
        </div>

        {/* Verdict cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(verdict => {
            const match = allMatches.find(m => m.id === verdict.matchId)!;
            const cfg = recConfig[verdict.recommendation];
            const stars = Array.from({ length: 5 }, (_, i) => i < verdict.valueRating);

            return (
              <Link
                key={verdict.matchId}
                href={`/match/${verdict.matchId}`}
                className={`block ${cfg.bg} border ${cfg.border} rounded-xl p-5 hover:scale-[1.02] transition-all group`}
              >
                {/* Match header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                    Group {match.group} · {match.date}
                  </span>
                  <span className={`text-xs font-black px-2 py-0.5 rounded-full ${cfg.bg} border ${cfg.border} ${cfg.text}`}>
                    {cfg.emoji} {verdict.recommendation}
                  </span>
                </div>

                {/* Teams */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl sm:text-2xl">{match.homeFlag}</span>
                  <span className="text-xs sm:text-sm font-bold text-white flex-1 truncate">{match.home} vs {match.away}</span>
                  <span className="text-xl sm:text-2xl">{match.awayFlag}</span>
                </div>

                {/* Pick */}
                <div className={`text-base font-black ${cfg.text} mb-3`}>
                  {verdict.pick}
                </div>

                {/* Stars + Risk + Confidence */}
                <div className="flex items-center justify-between text-xs mb-3">
                  <div className="flex items-center gap-0.5">
                    {stars.map((filled, i) => (
                      <span key={i} className={`${filled ? "text-amber-400" : "text-gray-700"}`}>★</span>
                    ))}
                    <span className="text-gray-500 ml-1">{verdict.valueLabel}</span>
                  </div>
                  <span className={`font-bold ${riskColors[verdict.riskLevel]}`}>{verdict.riskLevel}</span>
                </div>

                {/* Confidence bar */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${
                        verdict.recommendation === "BET" ? "from-green-500 to-emerald-400" :
                        verdict.recommendation === "LEAN" ? "from-amber-500 to-yellow-400" :
                        verdict.recommendation === "AVOID" ? "from-red-500 to-rose-400" :
                        "from-gray-500 to-gray-400"
                      }`}
                      style={{ width: `${verdict.confidencePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400">{verdict.confidencePct}%</span>
                </div>

                {/* Value gap */}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Gap: <span className={`font-bold ${verdict.valueGap > 0 ? "text-green-400" : "text-red-400"}`}>{verdict.valueGap > 0 ? "+" : ""}{verdict.valueGap}%</span></span>
                  <span className="text-purple-400 font-semibold group-hover:text-purple-300 transition">
                    Check Verdict →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No verdicts match your filters.</p>
            <button onClick={() => setFilter("ALL")} className="mt-4 text-purple-400 hover:text-purple-300 transition text-sm font-semibold">
              Show all verdicts →
            </button>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-10 text-center text-xs text-gray-600 max-w-xl mx-auto">
          All verdicts are generated by AI for informational and entertainment purposes only. 
          Past performance does not guarantee future results. Please gamble responsibly.
        </div>
      </div>
    </main>
  );
}
