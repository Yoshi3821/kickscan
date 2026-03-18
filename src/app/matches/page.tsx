"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { allMatches, groups } from "@/data/matches";
import { getAllAnalyses } from "@/data/analyses";

const analyses = getAllAnalyses();

export default function MatchesPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");

  const filteredMatches = useMemo(() => {
    if (selectedGroup === "ALL") return allMatches;
    return allMatches.filter((m) => m.group === selectedGroup);
  }, [selectedGroup]);

  // Group matches by their group letter
  const groupedMatches = useMemo(() => {
    const grouped: Record<string, typeof allMatches> = {};
    for (const match of filteredMatches) {
      if (!grouped[match.group]) grouped[match.group] = [];
      grouped[match.group].push(match);
    }
    return grouped;
  }, [filteredMatches]);

  return (
    <main className="min-h-screen bg-dot-pattern">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            🧠 Match <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Intelligence</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            AI predictions, fan votes & live odds for all 72 group matches
          </p>
        </div>

        {/* Group Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          <button
            onClick={() => setSelectedGroup("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedGroup === "ALL"
                ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            ALL
          </button>
          {groups.map((g) => (
            <button
              key={g}
              onClick={() => setSelectedGroup(g)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                selectedGroup === g
                  ? "bg-gradient-to-r from-purple-600 to-cyan-600 text-white"
                  : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white border border-white/10"
              }`}
            >
              Group {g}
            </button>
          ))}
        </div>

        {/* Match Cards by Group */}
        <div className="space-y-8">
          {Object.entries(groupedMatches).map(([group, matches]) => (
            <div key={group} className="animate-fade-in-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-cyan-600 rounded-lg px-3 py-1">
                  <span className="text-white font-black text-sm">Group {group}</span>
                </div>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {matches.map((match) => {
                  const analysis = analyses[match.id];
                  const topPct = analysis
                    ? Math.max(analysis.homeWinPct, analysis.awayWinPct, analysis.drawPct)
                    : 0;
                  const topTeam = analysis
                    ? analysis.homeWinPct >= analysis.awayWinPct && analysis.homeWinPct >= analysis.drawPct
                      ? match.home
                      : analysis.awayWinPct >= analysis.homeWinPct && analysis.awayWinPct >= analysis.drawPct
                        ? match.away
                        : "Draw"
                    : "";

                  return (
                    <Link
                      key={match.id}
                      href={`/match/${match.id}`}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 hover:bg-white/8 hover:border-purple-500/30 transition-all duration-300 hover:scale-[1.02] group"
                    >
                      {/* Teams */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-2xl shrink-0">{match.homeFlag}</span>
                          <span className="text-sm font-bold text-white truncate">{match.home}</span>
                        </div>
                        <span className="text-xs text-gray-500 mx-2 shrink-0">vs</span>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="text-sm font-bold text-white truncate text-right">{match.away}</span>
                          <span className="text-2xl shrink-0">{match.awayFlag}</span>
                        </div>
                      </div>

                      {/* Match Info */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{match.date} • {match.time}</span>
                      </div>
                      <div className="text-xs text-gray-600 mb-3 truncate">
                        📍 {match.venue}, {match.city}
                      </div>

                      {/* AI Preview */}
                      {analysis && (
                        <div className="flex items-center justify-between bg-cyan-500/10 border border-cyan-500/20 rounded-lg px-3 py-2">
                          <span className="text-xs text-cyan-400 font-medium">
                            🧠 AI: {topTeam} {topPct}%
                          </span>
                          <span className="text-xs text-gray-500 group-hover:text-cyan-400 transition">
                            View Analysis →
                          </span>
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
