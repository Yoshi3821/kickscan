"use client";
import { useState, useMemo } from "react";
import { groups } from "@/data/matches";
import { getBookmakerUrl, isAffiliate } from "@/config/affiliates";
import AdBanner from "@/components/AdBanner";

interface Bookmaker {
  key: string;
  name: string;
  home: number;
  draw: number;
  away: number;
  lastUpdate: string;
}

interface MatchWithLiveOdds {
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
  liveOdds: {
    bookmakers: Bookmaker[];
    lastUpdated: string;
  } | null;
}

interface Props {
  matches: MatchWithLiveOdds[];
  fetchedAt: string;
  liveMatchCount: number;
  bookmakerCount: number;
}

function getBestWorstOdds(bookmakers: Bookmaker[]) {
  const homes = bookmakers.map((b) => b.home).filter((v) => v > 0);
  const draws = bookmakers.map((b) => b.draw).filter((v) => v > 0);
  const aways = bookmakers.map((b) => b.away).filter((v) => v > 0);
  return {
    bestHome: homes.length ? Math.max(...homes) : 0,
    bestDraw: draws.length ? Math.max(...draws) : 0,
    bestAway: aways.length ? Math.max(...aways) : 0,
    worstHome: homes.length ? Math.min(...homes) : 0,
    worstDraw: draws.length ? Math.min(...draws) : 0,
    worstAway: aways.length ? Math.min(...aways) : 0,
  };
}

function timeAgo(isoDate: string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const allDates = [
  "June 11", "June 12", "June 13", "June 14", "June 15",
  "June 16", "June 17", "June 18", "June 19", "June 20",
  "June 21", "June 22", "June 23", "June 24", "June 25",
  "June 26", "June 27",
];

export default function OddsClient({
  matches,
  fetchedAt,
  liveMatchCount,
  bookmakerCount,
}: Props) {
  const [groupFilter, setGroupFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [teamSearch, setTeamSearch] = useState("");
  const [expandedMatch, setExpandedMatch] = useState<number | null>(null);

  const filtered = useMemo(() => {
    return matches.filter((m) => {
      if (groupFilter !== "ALL" && m.group !== groupFilter) return false;
      if (dateFilter !== "ALL" && m.date !== dateFilter) return false;
      if (teamSearch) {
        const s = teamSearch.toLowerCase();
        if (
          !m.home.toLowerCase().includes(s) &&
          !m.away.toLowerCase().includes(s)
        )
          return false;
      }
      return true;
    });
  }, [matches, groupFilter, dateFilter, teamSearch]);

  const byGroup: Record<string, typeof filtered> = {};
  filtered.forEach((m) => {
    if (!byGroup[m.group]) byGroup[m.group] = [];
    byGroup[m.group].push(m);
  });

  const liveFiltered = filtered.filter((m) => m.liveOdds !== null).length;

  function oddsColorClass(
    value: number,
    best: number,
    worst: number,
    bookmakerCount: number
  ): string {
    if (value <= 0) return "text-gray-600";
    // Only highlight if there are at least 2 bookmakers (otherwise everything is both best and worst)
    if (bookmakerCount < 2) return "text-gray-300 font-mono";
    if (value === best && value === worst) return "text-gray-300 font-mono";
    if (value === best) return "text-green-400 font-bold font-mono";
    if (value === worst) return "text-red-400 font-bold font-mono";
    return "text-gray-400 font-mono";
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-black">
          Odds <span className="text-green-400">Comparison</span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Compare bookmaker odds side-by-side for all 72 group stage matches
        </p>

        {liveMatchCount > 0 ? (
          <div className="mt-4 inline-flex items-center gap-2 bg-green-400/10 border border-green-400/30 rounded-full px-4 py-2 text-green-400 text-sm">
            🟢 LIVE — {liveMatchCount} matches with real odds from{" "}
            {bookmakerCount} bookmakers
          </div>
        ) : (
          <div className="mt-4 inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 text-yellow-400 text-sm">
            ⏳ No live odds available yet — check back closer to the tournament
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-6 mb-6 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />
          Best odds (bet here)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />
          Worst odds (avoid)
        </span>
      </div>

      {/* Filters */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-4 mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1.5 block">
              Filter by Group
            </label>
            <div className="flex gap-1.5 flex-wrap">
              <button
                onClick={() => setGroupFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  groupFilter === "ALL"
                    ? "bg-green-500 text-black"
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                }`}
              >
                All
              </button>
              {groups.map((g) => (
                <button
                  key={g}
                  onClick={() => setGroupFilter(g)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    groupFilter === g
                      ? "bg-green-500 text-black"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1.5 block">
              Filter by Date
            </label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white w-full md:w-auto"
            >
              <option value="ALL">All Dates</option>
              {allDates.map((d) => (
                <option key={d} value={d}>
                  {d}, 2026
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1">
            <label className="text-xs text-gray-500 mb-1.5 block">
              Search Team
            </label>
            <input
              type="text"
              placeholder="e.g. Brazil, Argentina..."
              value={teamSearch}
              onChange={(e) => setTeamSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 w-full md:w-auto focus:outline-none focus:border-green-400"
            />
          </div>
        </div>

        <div className="text-xs text-gray-500">
          Showing {filtered.length} of 72 matches
          {liveFiltered > 0 && (
            <span className="text-green-400 ml-2">
              · {liveFiltered} with live odds
            </span>
          )}
        </div>
      </div>

      {/* Ad: Leaderboard after header */}
      <AdBanner size="leaderboard" label="odds-top" className="my-8" />

      {/* Matches by group */}
      <div className="space-y-8">
        {Object.entries(byGroup)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([group, groupMatches]) => (
            <div key={group}>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-xl font-bold text-green-400">
                  Group {group}
                </h2>
                <div className="h-px flex-1 bg-gray-800" />
                <span className="text-xs text-gray-500">
                  {groupMatches.length} matches
                </span>
              </div>
              <div className="space-y-3">
                {groupMatches.map((match, matchIndex) => {
                  const isLive = match.liveOdds !== null;
                  const bookmakers = match.liveOdds?.bookmakers || [];
                  const bw = getBestWorstOdds(bookmakers);
                  const isExpanded = expandedMatch === match.id;

                  return (
                    <div key={match.id}>
                    {matchIndex > 0 && matchIndex % 4 === 0 && (
                      <AdBanner size="medium-rect" label={`odds-mid-${matchIndex}`} className="my-6" />
                    )}
                    <div
                      className={`bg-gray-900/50 border rounded-xl overflow-hidden transition ${
                        isLive
                          ? "border-green-400/20 hover:border-green-400/40"
                          : "border-gray-800/50 hover:border-gray-700"
                      }`}
                    >
                      {/* Match header */}
                      <button
                        onClick={() =>
                          isLive &&
                          setExpandedMatch(isExpanded ? null : match.id)
                        }
                        className={`w-full px-4 md:px-6 py-4 flex items-center justify-between gap-4 text-left ${
                          isLive ? "cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-xs text-gray-500 min-w-[85px]">
                            <div>{match.date}</div>
                            <div className="text-green-400 font-mono">
                              {match.time.replace(" ET", "")}
                            </div>
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm md:text-base font-bold text-white truncate">
                              {match.homeFlag} {match.home} vs {match.away}{" "}
                              {match.awayFlag}
                            </h3>
                            <span className="text-[11px] text-gray-600">
                              {match.venue}, {match.city}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {isLive ? (
                            <>
                              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full font-bold">
                                🟢 LIVE
                              </span>
                              <div className="hidden sm:flex gap-2 text-xs">
                                <span className="bg-green-400/10 text-green-400 px-2 py-1 rounded font-mono font-bold">
                                  {bw.bestHome.toFixed(2)}
                                </span>
                                <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded font-mono">
                                  {bw.bestDraw.toFixed(2)}
                                </span>
                                <span className="bg-gray-800 text-gray-400 px-2 py-1 rounded font-mono">
                                  {bw.bestAway.toFixed(2)}
                                </span>
                              </div>
                              <span
                                className={`text-gray-500 transition ${
                                  isExpanded ? "rotate-180" : ""
                                }`}
                              >
                                ▾
                              </span>
                            </>
                          ) : (
                            <span className="text-xs text-gray-600 italic">
                              Odds coming soon
                            </span>
                          )}
                        </div>
                      </button>

                      {/* Expanded odds table */}
                      {isExpanded && isLive && (
                        <div className="border-t border-gray-800/50">
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="text-gray-500 border-b border-gray-800/50">
                                  <th className="text-left px-6 py-3 font-medium text-xs">
                                    Bookmaker
                                  </th>
                                  <th className="text-center px-4 py-3 font-medium text-xs">
                                    {match.home}
                                  </th>
                                  <th className="text-center px-4 py-3 font-medium text-xs">
                                    Draw
                                  </th>
                                  <th className="text-center px-4 py-3 font-medium text-xs">
                                    {match.away}
                                  </th>
                                  <th className="text-center px-4 py-3 font-medium text-xs">
                                    
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {bookmakers.map((bm) => (
                                  <tr
                                    key={bm.key}
                                    className="border-b border-gray-800/30"
                                  >
                                    <td className="px-6 py-2.5 text-xs">
                                      <a
                                        href={getBookmakerUrl(bm.name)}
                                        target="_blank"
                                        rel="nofollow sponsored noopener"
                                        className="text-gray-300 font-medium hover:underline inline-flex items-center gap-1"
                                      >
                                        {bm.name}
                                        <span className="text-gray-600 text-[10px]">↗</span>
                                        {isAffiliate(bm.name) && (
                                          <span className="text-[9px] px-1 py-0.5 rounded bg-yellow-400/10 text-yellow-500 font-bold ml-1">AD</span>
                                        )}
                                      </a>
                                    </td>
                                    <td
                                      className={`text-center px-4 py-2.5 text-xs ${oddsColorClass(
                                        bm.home,
                                        bw.bestHome,
                                        bw.worstHome,
                                        bookmakers.length
                                      )}`}
                                    >
                                      {bm.home > 0 ? bm.home.toFixed(2) : "—"}
                                    </td>
                                    <td
                                      className={`text-center px-4 py-2.5 text-xs ${oddsColorClass(
                                        bm.draw,
                                        bw.bestDraw,
                                        bw.worstDraw,
                                        bookmakers.length
                                      )}`}
                                    >
                                      {bm.draw > 0 ? bm.draw.toFixed(2) : "—"}
                                    </td>
                                    <td
                                      className={`text-center px-4 py-2.5 text-xs ${oddsColorClass(
                                        bm.away,
                                        bw.bestAway,
                                        bw.worstAway,
                                        bookmakers.length
                                      )}`}
                                    >
                                      {bm.away > 0 ? bm.away.toFixed(2) : "—"}
                                    </td>
                                    <td className="text-center px-4 py-2.5">
                                      <a
                                        href={getBookmakerUrl(bm.name)}
                                        target="_blank"
                                        rel="nofollow sponsored noopener"
                                        className="bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 text-xs px-3 py-1 rounded-full inline-block transition whitespace-nowrap"
                                      >
                                        Visit Site →
                                      </a>
                                    </td>
                                  </tr>
                                ))}
                                {/* Best odds row */}
                                <tr className="bg-green-400/5">
                                  <td className="px-6 py-2.5 text-green-400 font-bold text-xs">
                                    🟢 Best Odds
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-green-400 font-bold font-mono text-xs">
                                    {bw.bestHome.toFixed(2)}
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-green-400 font-bold font-mono text-xs">
                                    {bw.bestDraw.toFixed(2)}
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-green-400 font-bold font-mono text-xs">
                                    {bw.bestAway.toFixed(2)}
                                  </td>
                                  <td></td>
                                </tr>
                                {/* Worst odds row */}
                                <tr className="bg-red-400/5">
                                  <td className="px-6 py-2.5 text-red-400 font-bold text-xs">
                                    🔴 Worst Odds
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-red-400 font-bold font-mono text-xs">
                                    {bw.worstHome.toFixed(2)}
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-red-400 font-bold font-mono text-xs">
                                    {bw.worstDraw.toFixed(2)}
                                  </td>
                                  <td className="text-center px-4 py-2.5 text-red-400 font-bold font-mono text-xs">
                                    {bw.worstAway.toFixed(2)}
                                  </td>
                                  <td></td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          {/* Last updated for this match */}
                          <div className="px-6 py-2 text-[10px] text-gray-600 border-t border-gray-800/30">
                            Last updated: {timeAgo(match.liveOdds!.lastUpdated)}
                          </div>
                        </div>
                      )}
                    </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
      </div>

      {/* Ad: Leaderboard at bottom */}
      <AdBanner size="leaderboard" label="odds-bottom" className="my-8" />

      {filtered.length === 0 && (
        <div className="text-center py-20 text-gray-500">
          <p className="text-2xl mb-2">🔍</p>
          <p>No matches found — try adjusting your filters</p>
        </div>
      )}

      {/* Last updated */}
      <div className="mt-8 text-center text-xs text-gray-600">
        Last updated: {new Date(fetchedAt).toLocaleString("en-US", {
          month: "long",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        })}{" "}
        · Live odds powered by The Odds API · Refreshed every 2 hours
      </div>
    </div>
  );
}
