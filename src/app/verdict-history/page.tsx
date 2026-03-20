"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { allMatches, getKickoffISO } from "@/data/matches";
import { getVerdict } from "@/data/verdicts";

const recStyles: Record<string, { emoji: string; text: string; bg: string; border: string }> = {
  BET: { emoji: "✅", text: "text-green-400", bg: "bg-green-500/[0.06]", border: "border-green-500/20" },
  LEAN: { emoji: "⚠️", text: "text-amber-400", bg: "bg-amber-500/[0.06]", border: "border-amber-500/20" },
  SKIP: { emoji: "⏭️", text: "text-gray-400", bg: "bg-gray-500/[0.06]", border: "border-gray-500/20" },
  AVOID: { emoji: "🚫", text: "text-red-400", bg: "bg-red-500/[0.06]", border: "border-red-500/20" },
};

const wcGroups = [...new Set(allMatches.map((m) => m.group))].sort();

interface LeagueVerdict {
  id: string | number;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  date: string;
  leagueName: string;
  leagueFlag: string;
  recommendation: string;
  pick: string;
  confidencePct: number;
  valueRating: number;
  riskLevel: string;
}

export default function AIVerdictPage() {
  const [activeSection, setActiveSection] = useState<"league" | "wc">("league");
  const [filterGroup, setFilterGroup] = useState<string>("all");
  const [filterRec, setFilterRec] = useState<string>("all");
  const [leagueVerdicts, setLeagueVerdicts] = useState<LeagueVerdict[]>([]);
  const [loadingLeague, setLoadingLeague] = useState(true);

  // Fetch league verdicts
  useEffect(() => {
    fetch("/api/league-fixtures")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setLeagueVerdicts(data);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingLeague(false));
  }, []);

  // WC matches sorted by nearest kickoff first
  const sortedWcMatches = [...allMatches].sort((a, b) => {
    const aTime = new Date(getKickoffISO(a.date, a.time)).getTime();
    const bTime = new Date(getKickoffISO(b.date, b.time)).getTime();
    return aTime - bTime;
  });

  const filteredWcMatches = sortedWcMatches.filter((m) => {
    if (filterGroup !== "all" && m.group !== filterGroup) return false;
    const verdict = getVerdict(m.id);
    if (filterRec !== "all" && verdict?.recommendation !== filterRec) return false;
    return true;
  });

  // Stats summary for WC
  const allVerdicts = allMatches.map((m) => getVerdict(m.id)).filter(Boolean);
  const betCount = allVerdicts.filter((v) => v!.recommendation === "BET").length;
  const leanCount = allVerdicts.filter((v) => v!.recommendation === "LEAN").length;
  const skipCount = allVerdicts.filter((v) => v!.recommendation === "SKIP").length;
  const avoidCount = allVerdicts.filter((v) => v!.recommendation === "AVOID").length;

  // League verdicts sorted by nearest kickoff
  const sortedLeagueVerdicts = [...leagueVerdicts].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
              🧠 AI Verdict
            </span>
          </h1>
          <p className="text-gray-400 text-lg">
            AI-powered BET or SKIP calls for every match
          </p>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 bg-white/5 border border-white/10 rounded-2xl p-2 w-fit mx-auto mb-8">
          <button
            onClick={() => setActiveSection("league")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeSection === "league"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            ⚽ League Verdicts
          </button>
          <button
            onClick={() => setActiveSection("wc")}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeSection === "wc"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "text-gray-300 hover:bg-white/10"
            }`}
          >
            🏆 World Cup 2026
          </button>
        </div>

        {/* LEAGUE VERDICTS SECTION */}
        {activeSection === "league" && (
          <div>
            <div className="text-center mb-6">
              <p className="text-gray-500 text-sm">
                AI verdicts for upcoming league matches — nearest kickoff first
              </p>
            </div>

            {loadingLeague ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white/5 rounded-2xl p-6 h-48 animate-pulse" />
                ))}
              </div>
            ) : sortedLeagueVerdicts.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No upcoming league matches found.
              </div>
            ) : (
              <div className="space-y-3">
                {sortedLeagueVerdicts.map((match) => {
                  const style = recStyles[match.recommendation] || recStyles.SKIP;
                  const matchDate = new Date(match.date).toLocaleString("en-US", {
                    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                    timeZone: "Asia/Seoul"
                  });

                  return (
                    <Link
                      key={match.id}
                      href={`/leagues/${match.id}`}
                      className={`block ${style.bg} border ${style.border} rounded-xl p-4 hover:bg-white/[0.05] transition-all`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-500">{match.leagueFlag} {match.leagueName}</span>
                            <span className="text-xs text-gray-600">· {matchDate}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {match.homeLogo && (
                              <img src={match.homeLogo} alt="" className="w-5 h-5" />
                            )}
                            <span className="text-sm font-bold text-white">{match.homeName}</span>
                            <span className="text-xs text-gray-500">vs</span>
                            <span className="text-sm font-bold text-white">{match.awayName}</span>
                            {match.awayLogo && (
                              <img src={match.awayLogo} alt="" className="w-5 h-5" />
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span>{style.emoji}</span>
                            <span className={`text-sm font-bold ${style.text}`}>
                              {match.recommendation}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">{match.pick}</div>
                          <div className="text-[10px] text-gray-500">{match.confidencePct}% confidence</div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* WORLD CUP VERDICTS SECTION */}
        {activeSection === "wc" && (
          <div>
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

            {/* Accuracy Tracker */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-8 text-center">
              <div className="text-sm text-gray-400">
                🏆 Accuracy tracking activates when matches begin — June 11, 2026
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center justify-center gap-2 mb-6">
              <button
                onClick={() => setFilterGroup("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  filterGroup === "all" ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                All Groups
              </button>
              {wcGroups.map((g) => (
                <button
                  key={g}
                  onClick={() => setFilterGroup(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    filterGroup === g ? "bg-purple-500/20 text-purple-400 border border-purple-500/30" : "bg-white/5 text-gray-400 hover:bg-white/10"
                  }`}
                >
                  {g}
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
                  {r === "all" ? "All" : `${recStyles[r]?.emoji || ""} ${r}`}
                </button>
              ))}
            </div>

            {/* WC Match Verdicts */}
            <div className="space-y-3">
              {filteredWcMatches.map((match) => {
                const verdict = getVerdict(match.id);
                if (!verdict) return null;
                const style = recStyles[verdict.recommendation] || recStyles.SKIP;

                return (
                  <Link
                    key={match.id}
                    href={`/match/${match.id}`}
                    className={`block ${style.bg} border ${style.border} rounded-xl p-4 hover:bg-white/[0.05] transition-all`}
                  >
                    <div className="flex items-center justify-between gap-4">
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

            {filteredWcMatches.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                No matches match your filters.
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
