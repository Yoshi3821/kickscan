"use client";
import { useState } from "react";
import Link from "next/link";
import { allMatches } from "@/data/matches";
import { getVerdict } from "@/data/verdicts";
import { getMatchAnalysis } from "@/data/analyses";

/**
 * Past Verdict Archive.
 * Shows AI verdict record for all WC 2026 matches.
 * Since WC hasn't started yet, all show as "Upcoming".
 * Once matches are played, actual results will populate.
 */

const recStyles: Record<string, { emoji: string; text: string; bg: string; border: string }> = {
  BET: { emoji: "✅", text: "text-green-400", bg: "bg-green-500/[0.06]", border: "border-green-500/20" },
  LEAN: { emoji: "⚠️", text: "text-amber-400", bg: "bg-amber-500/[0.06]", border: "border-amber-500/20" },
  SKIP: { emoji: "⏭️", text: "text-gray-400", bg: "bg-gray-500/[0.06]", border: "border-gray-500/20" },
  AVOID: { emoji: "🚫", text: "text-red-400", bg: "bg-red-500/[0.06]", border: "border-red-500/20" },
};

const groups = [...new Set(allMatches.map((m) => m.group))].sort();

export default function VerdictHistoryPage() {
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterRec, setFilterRec] = useState<string>("all");

  const filteredMatches = allMatches.filter((m) => {
    if (filterGroup !== "all" && m.group !== filterGroup) return false;
    const verdict = getVerdict(m.id);
    if (filterRec !== "all" && verdict?.recommendation !== filterRec) return false;
    return true;
  });

  // Stats summary
  const allVerdicts = allMatches.map((m) => getVerdict(m.id)).filter(Boolean);
  const betCount = allVerdicts.filter((v) => v!.recommendation === "BET").length;
  const leanCount = allVerdicts.filter((v) => v!.recommendation === "LEAN").length;
  const skipCount = allVerdicts.filter((v) => v!.recommendation === "SKIP").length;
  const avoidCount = allVerdicts.filter((v) => v!.recommendation === "AVOID").length;

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
              📊 Verdict Archive
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            AI verdict record for all 72 World Cup 2026 group matches
          </p>
          <p className="text-gray-500 text-sm mt-2">
            Results will update as matches are played starting June 11, 2026
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-green-500/[0.06] border border-green-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-400">{betCount}</div>
            <div className="text-xs text-gray-400">✅ BET</div>
          </div>
          <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-amber-400">{leanCount}</div>
            <div className="text-xs text-gray-400">⚠️ LEAN</div>
          </div>
          <div className="bg-gray-500/[0.06] border border-gray-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-gray-400">{skipCount}</div>
            <div className="text-xs text-gray-400">⏭️ SKIP</div>
          </div>
          <div className="bg-red-500/[0.06] border border-red-500/20 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-400">{avoidCount}</div>
            <div className="text-xs text-gray-400">🚫 AVOID</div>
          </div>
        </div>

        {/* Accuracy Tracker — shown once results available */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-center">
          <div className="text-sm text-gray-400">
            🏆 Accuracy tracking activates when matches begin — June 11, 2026
          </div>
          <div className="flex items-center justify-center gap-6 mt-3 text-xs text-gray-500">
            <span>AI Correct: <strong className="text-white">—</strong></span>
            <span>Fan Correct: <strong className="text-white">—</strong></span>
            <span>Odds Correct: <strong className="text-white">—</strong></span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setFilterGroup("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              filterGroup === "all" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10"
            }`}
          >
            All Groups
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterGroup === g ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              Group {g}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {["all", "BET", "LEAN", "SKIP", "AVOID"].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRec(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                filterRec === r ? "bg-white/10 text-white border border-white/20" : "bg-white/5 text-gray-400 hover:bg-white/10"
              }`}
            >
              {r === "all" ? "All Verdicts" : `${recStyles[r]?.emoji || ""} ${r}`}
            </button>
          ))}
        </div>

        {/* Match Verdicts List */}
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const verdict = getVerdict(match.id);
            const analysis = getMatchAnalysis(match.id);
            if (!verdict) return null;
            const style = recStyles[verdict.recommendation] || recStyles.SKIP;

            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className={`block ${style.bg} border ${style.border} rounded-xl p-4 hover:bg-white/[0.05] transition-all`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Match Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-bold">
                        {match.group}
                      </span>
                      <span className="text-xs text-gray-500">{match.date} · {match.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{match.homeFlag}</span>
                      <span className="text-sm font-bold text-white">{match.home}</span>
                      <span className="text-xs text-gray-500">vs</span>
                      <span className="text-sm font-bold text-white">{match.away}</span>
                      <span className="text-lg">{match.awayFlag}</span>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span>{style.emoji}</span>
                      <span className={`text-sm font-bold ${style.text}`}>
                        {verdict.recommendation}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">{verdict.pick}</div>
                    <div className="text-[10px] text-gray-500">{verdict.confidencePct}% confidence</div>
                  </div>

                  {/* Result — upcoming */}
                  <div className="text-center flex-shrink-0 min-w-[70px]">
                    <div className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                      Upcoming
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredMatches.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            No matches match your filters.
          </div>
        )}
      </div>
    </main>
  );
}
