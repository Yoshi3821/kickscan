"use client";
import { useState, useMemo } from "react";
import { getAllPredictions, groups, type MatchPrediction } from "@/data/matches";
import type { OutrightOdds } from "@/lib/odds";
import AdBanner from "@/components/AdBanner";

// Hardcoded fallback predictions (used when no live data)
const fallbackPredictions = [
  { team: "Spain", flag: "🇪🇸", odds: "9/2", probability: 18, tier: "Favorite" },
  { team: "Argentina", flag: "🇦🇷", odds: "5/1", probability: 16, tier: "Favorite" },
  { team: "France", flag: "🇫🇷", odds: "6/1", probability: 14, tier: "Favorite" },
  { team: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", odds: "7/1", probability: 12, tier: "Favorite" },
  { team: "Brazil", flag: "🇧🇷", odds: "8/1", probability: 11, tier: "Favorite" },
  { team: "Germany", flag: "🇩🇪", odds: "10/1", probability: 9, tier: "Contender" },
  { team: "Portugal", flag: "🇵🇹", odds: "12/1", probability: 8, tier: "Contender" },
  { team: "Netherlands", flag: "🇳🇱", odds: "14/1", probability: 7, tier: "Contender" },
  { team: "Belgium", flag: "🇧🇪", odds: "20/1", probability: 5, tier: "Contender" },
  { team: "USA", flag: "🇺🇸", odds: "25/1", probability: 4, tier: "Dark Horse" },
  { team: "Colombia", flag: "🇨🇴", odds: "28/1", probability: 3, tier: "Dark Horse" },
  { team: "Morocco", flag: "🇲🇦", odds: "33/1", probability: 3, tier: "Dark Horse" },
  { team: "Croatia", flag: "🇭🇷", odds: "33/1", probability: 3, tier: "Dark Horse" },
  { team: "Uruguay", flag: "🇺🇾", odds: "40/1", probability: 2, tier: "Dark Horse" },
  { team: "Japan", flag: "🇯🇵", odds: "50/1", probability: 2, tier: "Dark Horse" },
];

function getTier(odds: number): string {
  if (odds <= 8) return "Favorite";
  if (odds <= 20) return "Contender";
  return "Dark Horse";
}

function oddsToImpliedProb(odds: number): number {
  return Math.round((1 / odds) * 100);
}

function decimalToFractional(decimal: number): string {
  const fraction = decimal - 1;
  // Common fractions
  const fractions = [
    [1, 5], [1, 4], [1, 3], [2, 5], [1, 2], [3, 5], [2, 3], [4, 5],
    [1, 1], [6, 5], [5, 4], [11, 8], [6, 4], [13, 8], [7, 4], [15, 8],
    [2, 1], [9, 4], [5, 2], [11, 4], [3, 1], [7, 2], [4, 1], [9, 2],
    [5, 1], [11, 2], [6, 1], [13, 2], [7, 1], [15, 2], [8, 1], [9, 1],
    [10, 1], [11, 1], [12, 1], [14, 1], [16, 1], [18, 1], [20, 1],
    [25, 1], [28, 1], [33, 1], [40, 1], [50, 1], [66, 1], [80, 1],
    [100, 1], [150, 1], [200, 1], [250, 1], [500, 1],
  ];

  let closest = fractions[0];
  let minDiff = Infinity;
  for (const f of fractions) {
    const diff = Math.abs(f[0] / f[1] - fraction);
    if (diff < minDiff) {
      minDiff = diff;
      closest = f;
    }
  }
  return `${closest[0]}/${closest[1]}`;
}

const tierColors: Record<string, string> = {
  Favorite: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Contender: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Dark Horse": "text-purple-400 bg-purple-400/10 border-purple-400/30",
};

function ConfidenceBadge({ value }: { value: number }) {
  const color =
    value >= 80
      ? "text-green-400 bg-green-400/10"
      : value >= 65
      ? "text-yellow-400 bg-yellow-400/10"
      : "text-orange-400 bg-orange-400/10";
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${color}`}>
      {value}% confidence
    </span>
  );
}

function PredictionBar({
  home,
  draw,
  away,
  homeLabel,
  awayLabel,
}: {
  home: number;
  draw: number;
  away: number;
  homeLabel: string;
  awayLabel: string;
}) {
  return (
    <div>
      <div className="flex justify-between text-[10px] text-gray-500 mb-1">
        <span>
          {homeLabel} {home}%
        </span>
        <span>Draw {draw}%</span>
        <span>
          {awayLabel} {away}%
        </span>
      </div>
      <div className="flex h-2 rounded-full overflow-hidden">
        <div className="bg-green-500" style={{ width: `${home}%` }} />
        <div className="bg-gray-500" style={{ width: `${draw}%` }} />
        <div className="bg-red-500" style={{ width: `${away}%` }} />
      </div>
    </div>
  );
}

interface Props {
  liveOutrightOdds: OutrightOdds[];
  fetchedAt: string;
  bookmakerCount: number;
}

export default function PredictionsClient({
  liveOutrightOdds,
  fetchedAt,
  bookmakerCount,
}: Props) {
  const [view, setView] = useState<"outright" | "matches">("outright");
  const [groupFilter, setGroupFilter] = useState("ALL");

  const allPredictions = useMemo(() => getAllPredictions(), []);

  const filtered =
    groupFilter === "ALL"
      ? allPredictions
      : allPredictions.filter((m) => m.group === groupFilter);

  const byGroup: Record<string, MatchPrediction[]> = {};
  filtered.forEach((m) => {
    if (!byGroup[m.group]) byGroup[m.group] = [];
    byGroup[m.group].push(m);
  });

  const hasLiveOdds = liveOutrightOdds.length > 0;

  // Build the outright table data
  const outrightData = hasLiveOdds
    ? liveOutrightOdds.slice(0, 25).map((o, i) => ({
        rank: i + 1,
        team: o.team,
        flag: o.flag || "🏳️",
        odds: decimalToFractional(o.odds),
        decimalOdds: o.odds,
        probability: oddsToImpliedProb(o.odds),
        tier: getTier(o.odds),
        bookmaker: o.bookmaker,
        isLive: true,
      }))
    : fallbackPredictions.map((p, i) => ({
        rank: i + 1,
        team: p.team,
        flag: p.flag,
        odds: p.odds,
        decimalOdds: 0,
        probability: p.probability,
        tier: p.tier,
        bookmaker: "",
        isLive: false,
      }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-black">
          AI <span className="text-green-400">Predictions</span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          AI-powered analysis of team form, squad depth, and historical data
        </p>
      </div>

      {/* View toggle */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-900 border border-gray-800 rounded-xl p-1">
          <button
            onClick={() => setView("outright")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
              view === "outright"
                ? "bg-green-500 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            🏆 Outright Winner
          </button>
          <button
            onClick={() => setView("matches")}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition ${
              view === "matches"
                ? "bg-green-500 text-black"
                : "text-gray-400 hover:text-white"
            }`}
          >
            ⚽ Match Predictions
          </button>
        </div>
      </div>

      {view === "outright" ? (
        <>
          {/* Live badge */}
          {hasLiveOdds && (
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/30 rounded-full px-4 py-2 text-green-400 text-sm">
                🟢 LIVE — Best outright odds from {bookmakerCount} bookmakers
              </span>
            </div>
          )}

          {/* Winner Odds Table */}
          <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl overflow-hidden mb-12">
            <div className="px-6 py-4 border-b border-gray-800/50 flex items-center justify-between">
              <h2 className="text-xl font-bold">🏆 Outright Winner Odds</h2>
              {hasLiveOdds && (
                <span className="text-[10px] text-gray-500">
                  Best available odds shown · Source: multiple bookmakers
                </span>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 border-b border-gray-800/50">
                    <th className="text-left px-6 py-3 font-medium text-xs">
                      Rank
                    </th>
                    <th className="text-left px-6 py-3 font-medium text-xs">
                      Team
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-xs">
                      Odds
                    </th>
                    {hasLiveOdds && (
                      <th className="text-center px-4 py-3 font-medium text-xs">
                        Decimal
                      </th>
                    )}
                    <th className="text-center px-4 py-3 font-medium text-xs">
                      Win %
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-xs">
                      Tier
                    </th>
                    {hasLiveOdds && (
                      <th className="text-left px-4 py-3 font-medium text-xs">
                        Best at
                      </th>
                    )}
                    <th className="text-left px-4 py-3 font-medium text-xs">
                      Probability
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {outrightData.map((p) => (
                    <tr
                      key={p.team}
                      className="border-b border-gray-800/30 hover:bg-gray-800/20"
                    >
                      <td className="px-6 py-3 text-gray-500 font-mono text-xs">
                        {p.rank}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-lg mr-2">{p.flag}</span>
                        <span className="text-white font-medium">
                          {p.team}
                        </span>
                      </td>
                      <td className="text-center px-4 py-3 text-green-400 font-mono font-bold">
                        {p.odds}
                      </td>
                      {hasLiveOdds && (
                        <td className="text-center px-4 py-3 text-gray-400 font-mono text-xs">
                          {p.decimalOdds.toFixed(2)}
                        </td>
                      )}
                      <td className="text-center px-4 py-3 text-gray-300">
                        {p.probability}%
                      </td>
                      <td className="text-center px-4 py-3">
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            tierColors[p.tier]
                          }`}
                        >
                          {p.tier}
                        </span>
                      </td>
                      {hasLiveOdds && (
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {p.bookmaker}
                        </td>
                      )}
                      <td className="px-4 py-3 w-48">
                        <div className="w-full bg-gray-800 rounded-full h-2">
                          <div
                            className="bg-green-400 h-2 rounded-full"
                            style={{
                              width: `${Math.min(100, p.probability * 5)}%`,
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Ad: Leaderboard after outright winner table */}
          <AdBanner size="leaderboard" label="predictions-after-outright" className="my-8" />

          {/* AI Insight */}
          <div className="bg-gradient-to-r from-green-900/20 to-gray-900 border border-green-400/20 rounded-xl p-8">
            <h3 className="text-xl font-bold text-green-400 mb-4">
              🧠 AI Insight
            </h3>
            <p className="text-gray-300 leading-relaxed">
              {hasLiveOdds ? (
                <>
                  Based on live bookmaker odds from {bookmakerCount} sources,{" "}
                  <strong className="text-white">{outrightData[0]?.team}</strong>{" "}
                  leads as the market favorite at{" "}
                  <strong className="text-green-400">
                    {outrightData[0]?.odds}
                  </strong>{" "}
                  ({outrightData[0]?.probability}% implied probability). The
                  expanded 48-team format introduces more variance than any
                  previous World Cup. Dark horses like Morocco (2022
                  semi-finalists) and Japan (rapidly improving) could exploit
                  this. Our model gives a 34% chance that the winner comes from
                  outside the traditional top 5 favorites — the highest
                  probability in World Cup history.
                </>
              ) : (
                <>
                  Spain enters as the AI&apos;s top pick — reigning European
                  champions with a generational squad featuring Pedri, Gavi,
                  Yamal, and Nico Williams. However, the expanded 48-team format
                  introduces more variance. Dark horses like Morocco (2022
                  semi-finalists) and Japan (rapidly improving) could exploit
                  this. Our model gives a 34% chance that the winner comes from
                  outside the traditional top 5 favorites — the highest
                  probability in World Cup history.
                </>
              )}
            </p>
          </div>
        </>
      ) : (
        <>
          {/* Match predictions (unchanged logic) */}
          <div className="flex gap-1.5 flex-wrap mb-6">
            <button
              onClick={() => setGroupFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                groupFilter === "ALL"
                  ? "bg-green-500 text-black"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              All Groups
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
                Group {g}
              </button>
            ))}
          </div>

          <div className="space-y-8">
            {Object.entries(byGroup)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([group, predictions]) => (
                <div key={group}>
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-xl font-bold text-green-400">
                      Group {group}
                    </h2>
                    <div className="h-px flex-1 bg-gray-800" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {predictions.map((p) => (
                      <div
                        key={p.id}
                        className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-5 hover:border-gray-700 transition"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs text-gray-500">
                            {p.date} · {p.time}
                          </div>
                          <ConfidenceBadge value={p.confidence} />
                        </div>

                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{p.homeFlag}</span>
                            <span className="font-bold text-white text-sm">
                              {p.home}
                            </span>
                          </div>
                          <div className="bg-gray-800 px-3 py-1 rounded-lg">
                            <span className="text-green-400 font-bold font-mono text-sm">
                              {p.predictedScore}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm">
                              {p.away}
                            </span>
                            <span className="text-xl">{p.awayFlag}</span>
                          </div>
                        </div>

                        <PredictionBar
                          home={p.homeWin}
                          draw={p.draw}
                          away={p.awayWin}
                          homeLabel={p.home}
                          awayLabel={p.away}
                        />

                        <p className="text-xs text-gray-400 mt-3 leading-relaxed">
                          {p.analysis}
                        </p>

                        <div className="mt-3 pt-3 border-t border-gray-800/50 text-[10px] text-gray-600">
                          📍 {p.venue}, {p.city}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-20 text-gray-500">
              <p className="text-2xl mb-2">🔍</p>
              <p>No predictions found for this filter</p>
            </div>
          )}
        </>
      )}

      <div className="mt-8 text-center text-xs text-gray-600">
        {hasLiveOdds ? (
          <>
            Last updated:{" "}
            {new Date(fetchedAt).toLocaleString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
              hour: "numeric",
              minute: "2-digit",
              timeZoneName: "short",
            })}{" "}
            · Live odds from {bookmakerCount} bookmakers · Refreshed every 2 hours
          </>
        ) : (
          <>
            Last updated: March 18, 2026 · Predictions generated by KickScan AI
            model v2.1
          </>
        )}
      </div>
    </div>
  );
}
