"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { allMatches, groups, groupNames, getFlag } from "@/data/matches";
import { getAllAnalyses } from "@/data/analyses";

const analyses = getAllAnalyses();

// Power ratings for predicted standings
const power: Record<string, number> = {
  "Brazil": 92, "Argentina": 93, "France": 91, "Spain": 94, "England": 89,
  "Germany": 88, "Portugal": 90, "Netherlands": 87, "Belgium": 85, "Croatia": 84,
  "Uruguay": 83, "Colombia": 82, "USA": 78, "Mexico": 80, "Japan": 81,
  "Morocco": 82, "Senegal": 79, "South Korea": 79, "Switzerland": 83, "Ecuador": 77,
  "Canada": 76, "Australia": 75, "Iran": 74, "Tunisia": 73, "Ivory Coast": 78,
  "Egypt": 76, "Algeria": 75, "Norway": 77, "Austria": 78, "Scotland": 74,
  "Ghana": 73, "Panama": 68, "Qatar": 72, "Saudi Arabia": 72, "New Zealand": 65,
  "Cape Verde": 62, "Haiti": 58, "Jordan": 67, "Curacao": 55, "Uzbekistan": 70,
  "UEFA playoff A": 72, "UEFA playoff B": 72, "UEFA playoff C": 72, "UEFA playoff D": 72,
  "ICP1": 65, "ICP2": 65,
};

// Generate predicted group standings
function getPredictedStandings(groupId: string) {
  const teams = groupNames[groupId] || [];
  return teams
    .map((team) => ({
      team,
      flag: getFlag(team),
      pts: 0, // Pre-tournament, all 0
      mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0,
      power: power[team] || 65,
    }))
    .sort((a, b) => b.power - a.power); // Sort by predicted strength
}

// Projected bracket based on power ratings
const projectedBracket = {
  groupWinners: groups.map((g) => {
    const standings = getPredictedStandings(g);
    return { group: g, team: standings[0].team, flag: standings[0].flag };
  }),
  groupRunners: groups.map((g) => {
    const standings = getPredictedStandings(g);
    return { group: g, team: standings[1].team, flag: standings[1].flag };
  }),
};

export default function MatchesPage() {
  const [selectedGroup, setSelectedGroup] = useState<string>("ALL");
  const [showView, setShowView] = useState<"matches" | "tables" | "bracket">("matches");

  const filteredMatches = useMemo(() => {
    if (selectedGroup === "ALL") return allMatches;
    return allMatches.filter((m) => m.group === selectedGroup);
  }, [selectedGroup]);

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
        <div className="text-center mb-6 animate-fade-in-up">
          <h1 className="text-3xl md:text-4xl font-black text-white mb-2">
            🧠 Match <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">Intelligence</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            AI predictions, fan votes & live odds for all 72 group matches
          </p>
        </div>

        {/* View Tabs */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-fit mx-auto mb-6">
          <button
            onClick={() => setShowView("matches")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showView === "matches" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            ⚽ Matches
          </button>
          <button
            onClick={() => setShowView("tables")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showView === "tables" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            📊 Group Tables
          </button>
          <button
            onClick={() => setShowView("bracket")}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              showView === "bracket" ? "bg-amber-500/20 text-amber-400 border border-amber-500/30" : "text-gray-400 hover:bg-white/10"
            }`}
          >
            🏆 Bracket
          </button>
        </div>

        {/* ===== GROUP TABLES VIEW ===== */}
        {showView === "tables" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {groups.map((g) => {
              const standings = getPredictedStandings(g);
              return (
                <div key={g} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-600/20 to-cyan-600/20 px-4 py-2 border-b border-white/10">
                    <span className="text-sm font-black text-white">Group {g}</span>
                  </div>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-500 border-b border-white/5">
                        <th className="text-left px-3 py-2 font-medium">Team</th>
                        <th className="px-1 py-2 font-medium w-7">MP</th>
                        <th className="px-1 py-2 font-medium w-7">W</th>
                        <th className="px-1 py-2 font-medium w-7">D</th>
                        <th className="px-1 py-2 font-medium w-7">L</th>
                        <th className="px-1 py-2 font-medium w-8">GD</th>
                        <th className="px-1 py-2 font-medium w-8 text-white">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((team, idx) => (
                        <tr
                          key={team.team}
                          className={`border-b border-white/5 ${
                            idx < 2 ? "bg-green-500/[0.04]" : ""
                          }`}
                        >
                          <td className="px-3 py-2 flex items-center gap-1.5">
                            <span className="text-sm">{team.flag}</span>
                            <span className={`truncate ${idx < 2 ? "text-white font-semibold" : "text-gray-400"}`}>
                              {team.team.length > 14 ? team.team.slice(0, 12) + "…" : team.team}
                            </span>
                          </td>
                          <td className="text-center text-gray-500">0</td>
                          <td className="text-center text-gray-500">0</td>
                          <td className="text-center text-gray-500">0</td>
                          <td className="text-center text-gray-500">0</td>
                          <td className="text-center text-gray-500">0</td>
                          <td className="text-center text-white font-bold">0</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="px-3 py-1.5 text-[10px] text-gray-600">
                    Top 2 advance · Sorted by AI power rating
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ===== BRACKET VIEW ===== */}
        {showView === "bracket" && (
          <div className="mb-8">
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm">
                Projected bracket based on AI power ratings · Updates after group stage
              </p>
            </div>

            {/* Round of 32 */}
            <div className="mb-8">
              <h3 className="text-lg font-bold text-white mb-4 text-center">
                <span className="bg-white/5 border border-white/10 rounded-xl px-4 py-1.5 text-sm">Round of 32</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* R32 matchups: 1A vs 2B, 1B vs 2A, 1C vs 2D, etc. */}
                {[
                  ["A", "B"], ["B", "A"], ["C", "D"], ["D", "C"],
                  ["E", "F"], ["F", "E"], ["G", "H"], ["H", "G"],
                  ["I", "J"], ["J", "I"], ["K", "L"], ["L", "K"],
                ].map(([w, r], i) => {
                  const winner = projectedBracket.groupWinners.find((g) => g.group === w);
                  const runner = projectedBracket.groupRunners.find((g) => g.group === r);
                  if (!winner || !runner) return null;
                  return (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <div className="text-[10px] text-gray-600 mb-2">R32 · Match {i + 1}</div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{winner.flag}</span>
                          <span className="text-xs font-bold text-white truncate">{winner.team}</span>
                          <span className="text-[9px] text-green-400 bg-green-500/10 px-1 rounded">1{w}</span>
                        </div>
                        <span className="text-[10px] text-gray-600 mx-1">vs</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-blue-400 bg-blue-500/10 px-1 rounded">2{r}</span>
                          <span className="text-xs font-bold text-white truncate">{runner.team}</span>
                          <span className="text-sm">{runner.flag}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* QF → SF → Final projected path */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-xs text-amber-400 font-bold mb-3 uppercase tracking-wider">Quarter-Finals</div>
                <div className="space-y-2">
                  {["A/B vs C/D", "E/F vs G/H", "I/J vs K/L", "B/A vs D/C"].map((label, i) => (
                    <div key={i} className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">
                      Winner {label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                <div className="text-xs text-orange-400 font-bold mb-3 uppercase tracking-wider">Semi-Finals</div>
                <div className="space-y-2">
                  {["QF1 vs QF2", "QF3 vs QF4"].map((label, i) => (
                    <div key={i} className="text-xs text-gray-400 bg-white/5 rounded-lg px-3 py-2">
                      {label}
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border border-amber-500/20 rounded-xl p-4 text-center">
                <div className="text-xs text-yellow-400 font-bold mb-3 uppercase tracking-wider">🏆 Final</div>
                <div className="text-sm text-gray-400 bg-white/5 rounded-lg px-3 py-3">
                  July 19, 2026 · MetLife Stadium
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  AI Projected Winner: <span className="text-yellow-400 font-bold">Spain 🇪🇸</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== MATCHES VIEW ===== */}
        {showView === "matches" && (
          <>
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

                          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                            <span>{match.date} • {match.time}</span>
                          </div>
                          <div className="text-xs text-gray-600 mb-3 truncate">
                            📍 {match.venue}, {match.city}
                          </div>

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
          </>
        )}
      </div>
    </main>
  );
}
