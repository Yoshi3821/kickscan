"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { allMatches } from "@/data/matches";
import { getMatchAnalysis } from "@/data/analyses";
import { getPlayersByTier, getCountryColor } from "@/data/players";
import AdBanner from "@/components/AdBanner";
import HeroSection from "@/components/HeroSection";

/* ═══════════════════════════════════════════════════════════
   DATA PREPARATION
   ═══════════════════════════════════════════════════════════ */

// Featured matches for Section B (first 6)
const featuredMatches = allMatches.slice(0, 6);

// Marquee matches for Section C — Mexico vs SA (1), Brazil vs Morocco (13), England vs Croatia (67)
const marqueeIds = [1, 13, 67];
const marqueeMatches = marqueeIds.map((id) => {
  const match = allMatches.find((m) => m.id === id)!;
  const analysis = getMatchAnalysis(id)!;
  return { match, analysis };
});

// Fan sentiment seeded data for Section D
const fanSentiment = [
  { matchId: 1, home: 62, draw: 20, away: 18, votes: 14823 },
  { matchId: 13, home: 55, draw: 22, away: 23, votes: 31204 },
  { matchId: 19, home: 58, draw: 24, away: 18, votes: 22156 },
  { matchId: 67, home: 48, draw: 26, away: 26, votes: 19847 },
];

// Smart View data for Section E
const smartViewMatches = [
  {
    matchId: 13,
    fans: { home: 55, draw: 22, away: 23 },
    insight: "⚡ Fans overvalue Brazil. AI sees more danger from Morocco. Market agrees with AI — Morocco's odds are shorter than fan sentiment suggests.",
  },
  {
    matchId: 67,
    fans: { home: 48, draw: 26, away: 26 },
    insight: "⚡ Fans split on England-Croatia, but AI gives England a clear edge. Market prices England cheaper than fan consensus — value on the Three Lions.",
  },
];

// Market value data for Section F
const valueMatches = [
  { matchId: 1, aiPick: "Mexico Win", aiConf: 58, bestOdds: 1.85, bookmaker: "Pinnacle" },
  { matchId: 13, aiPick: "Brazil Win", aiConf: 52, bestOdds: 2.10, bookmaker: "Bet365" },
  { matchId: 31, aiPick: "Netherlands Win", aiConf: 49, bestOdds: 2.25, bookmaker: "Betfair" },
  { matchId: 55, aiPick: "Argentina Win", aiConf: 72, bestOdds: 1.35, bookmaker: "William Hill" },
];

// Blog posts for Section G
const blogPosts = [
  {
    slug: "opening-match-mexico-vs-south-africa",
    title: "Opening Match Preview: Mexico vs South Africa",
    excerpt: "The FIFA World Cup 2026 kicks off with a blockbuster opener in Mexico City.",
    date: "March 18, 2026",
    category: "Match Intel",
  },
  {
    slug: "group-c-brazil-vs-morocco-preview",
    title: "Brazil vs Morocco — The Quarter-Final Rematch",
    excerpt: "Morocco shocked the world in 2022. Can the Atlas Lions do it again at MetLife Stadium?",
    date: "March 16, 2026",
    category: "Analysis",
  },
  {
    slug: "usa-home-advantage-world-cup-2026",
    title: "Home Advantage: Can the USA Ride the Wave?",
    excerpt: "With 11 of 16 venues on American soil, the USMNT has a massive edge.",
    date: "March 15, 2026",
    category: "Intelligence",
  },
  {
    slug: "top-5-dark-horses-world-cup-2026",
    title: "Top 5 Dark Horses for World Cup 2026",
    excerpt: "Japan, Morocco, Colombia, Croatia, and Norway — our AI model says these teams could go deep.",
    date: "March 14, 2026",
    category: "AI Prediction",
  },
];

/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */

function getCountdown() {
  const target = new Date("2026-06-11T19:00:00Z").getTime();
  const now = Date.now();
  const diff = Math.max(0, target - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

function confidenceToPercent(conf: string): number {
  switch (conf) {
    case "VERY HIGH": return 90;
    case "HIGH": return 75;
    case "MEDIUM": return 60;
    case "LOW": return 40;
    default: return 50;
  }
}

/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

export default function HomePage() {
  const [countdown, setCountdown] = useState(getCountdown());
  const [email, setEmail] = useState("");

  useEffect(() => {
    const timer = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Pre-compute analyses for featured matches
  const featuredAnalyses = featuredMatches.map((m) => ({
    match: m,
    analysis: getMatchAnalysis(m.id),
  }));

  return (
    <main className="min-h-screen bg-[#06060f] text-white overflow-x-hidden">
      {/* ═══════ SECTION A — HERO ═══════ */}
      <HeroSection />

      {/* ═══════ SECTION B — LIVE MATCH INTELLIGENCE ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
              Live Match Intelligence
            </span>
          </h2>
          <p className="text-gray-400 text-lg">AI-powered analysis for every World Cup match</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredAnalyses.map(({ match, analysis }) => {
            const winner = analysis?.predictedResult || "TBD";
            const winnerFlag = winner.includes(match.home) ? match.homeFlag : winner.includes(match.away) ? match.awayFlag : "🤝";
            const homeVote = fanSentiment.find((f) => f.matchId === match.id)?.home || (50 + (match.id * 7) % 25);

            return (
              <div
                key={match.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover-gradient-border transition-all group"
              >
                {/* Group badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold tracking-wider">
                    GROUP {match.group}
                  </span>
                  <span className="text-xs text-gray-500">{match.date} · {match.time}</span>
                </div>

                {/* Teams */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <div className="text-3xl mb-1">{match.homeFlag}</div>
                    <div className="text-sm font-medium text-white truncate">{match.home}</div>
                  </div>
                  <div className="text-xs text-gray-500 font-bold px-3">VS</div>
                  <div className="text-center flex-1">
                    <div className="text-3xl mb-1">{match.awayFlag}</div>
                    <div className="text-sm font-medium text-white truncate">{match.away}</div>
                  </div>
                </div>

                {/* AI prediction */}
                <div className="bg-white/5 rounded-xl p-3 mb-4">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AI Prediction</div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{winnerFlag}</span>
                    <span className="text-sm font-semibold text-white">{winner}</span>
                    <span className="ml-auto text-xs text-gray-400">{analysis?.predictedScore}</span>
                  </div>
                </div>

                {/* Fan vote bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Fan sentiment</span>
                    <span>{homeVote}% {match.home}</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all"
                      style={{ width: `${homeVote}%` }}
                    />
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/match/${match.id}`}
                  className="block text-center py-2.5 rounded-xl text-sm font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
                >
                  Scan Match →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ AD BANNER — LEADERBOARD ═══════ */}
      <AdBanner size="leaderboard" label="between-b-c" className="mb-4" />

      {/* ═══════ SECTION C — FEATURED AI ANALYSIS ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">AI Match Intelligence</h2>
          <p className="text-gray-400 text-lg">Deep analysis for marquee matchups</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {marqueeMatches.map(({ match, analysis }) => {
            const confPct = confidenceToPercent(analysis.confidence);
            const firstSentence = analysis.summary.split(". ")[0] + ".";

            return (
              <div
                key={match.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover-gradient-border transition-all"
              >
                {/* Match title */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">{match.homeFlag}</span>
                  <span className="text-sm font-bold text-white">{match.home} vs {match.away}</span>
                  <span className="text-2xl">{match.awayFlag}</span>
                </div>

                {/* Prediction */}
                <div className="mb-4">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AI Predicted Winner</div>
                  <div className="text-lg font-bold text-white">{analysis.predictedResult}</div>
                  <div className="text-sm text-gray-400">{analysis.predictedScore}</div>
                </div>

                {/* Confidence bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                    <span>Confidence</span>
                    <span>{analysis.confidence} ({confPct}%)</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 rounded-full"
                      style={{ width: `${confPct}%` }}
                    />
                  </div>
                </div>

                {/* Summary */}
                <p className="text-sm text-gray-400 mb-4 line-clamp-3">{firstSentence}</p>

                <Link
                  href={`/match/${match.id}`}
                  className="block text-center py-2.5 rounded-xl text-sm font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
                >
                  View Full Analysis →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ SECTION — STARS TO WATCH ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
              ⭐ Stars to Watch
            </span>
          </h2>
          <p className="text-gray-400 text-lg">The players who will define World Cup 2026</p>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide" style={{ scrollbarWidth: "none" }}>
          {getPlayersByTier(1).map((player) => {
            const color = getCountryColor(player.country);
            return (
              <Link
                key={player.slug}
                href={`/players/${player.slug}`}
                className="group min-w-[280px] flex-shrink-0 snap-start bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all hover:shadow-lg"
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: color,
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{player.flag}</span>
                  <span className="text-sm font-bold text-gray-500">#{player.number}</span>
                </div>

                <h3 className="text-lg font-black text-white tracking-wide uppercase group-hover:text-purple-300 transition mb-1">
                  {player.name}
                </h3>
                <p className="text-xs text-gray-500 mb-3">
                  {player.position} · {player.club}
                </p>

                <p className="text-sm italic bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-medium mb-4">
                  &ldquo;{player.tagline}&rdquo;
                </p>

                <div className="flex items-center gap-3 text-xs text-gray-400 mb-4">
                  {player.wcGoals > 0 && <span>⚽ {player.wcGoals} WC Goals</span>}
                  {player.wcTitles > 0 && <span>🏆 Champion</span>}
                  {player.wcGoals === 0 && player.wcTitles === 0 && <span>🌟 WC Debut</span>}
                </div>

                <span className="text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition">
                  View Profile →
                </span>
              </Link>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <Link
            href="/players"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition-all"
          >
            View All Players →
          </Link>
        </div>
      </section>

      {/* ═══════ SECTION D — FAN SENTIMENT ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">What Fans Think 🗳️</h2>
          <p className="text-gray-400 text-lg">Live fan sentiment across every match</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {fanSentiment.map((fs) => {
            const match = allMatches.find((m) => m.id === fs.matchId)!;
            return (
              <div
                key={fs.matchId}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{match.homeFlag}</span>
                    <span className="text-sm font-bold text-white">{match.home} vs {match.away}</span>
                    <span className="text-xl">{match.awayFlag}</span>
                  </div>
                  <span className="text-xs text-gray-500">{fs.votes.toLocaleString()} votes</span>
                </div>

                {/* Vote bars */}
                <div className="space-y-2">
                  {[
                    { label: match.home, pct: fs.home, color: "from-green-500 to-emerald-400" },
                    { label: "Draw", pct: fs.draw, color: "from-gray-500 to-gray-400" },
                    { label: match.away, pct: fs.away, color: "from-blue-500 to-indigo-400" },
                  ].map((row) => (
                    <div key={row.label}>
                      <div className="flex justify-between text-xs text-gray-400 mb-1">
                        <span>{row.label}</span>
                        <span>{row.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-gradient-to-r ${row.color} rounded-full transition-all`}
                          style={{ width: `${row.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href={`/match/${fs.matchId}`}
                  className="block text-center mt-4 py-2 rounded-xl text-sm font-semibold text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
                >
                  Cast Your Vote →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ SECTION E — THE SMART VIEW™ ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">The Smart View™</h2>
          <p className="text-gray-400 text-lg">See what fans think, what AI predicts, and what the market implies</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {smartViewMatches.map((sv) => {
            const match = allMatches.find((m) => m.id === sv.matchId)!;
            const analysis = getMatchAnalysis(sv.matchId)!;
            // Market implied probabilities (simulated from typical odds)
            const marketHome = Math.round(analysis.homeWinPct * 0.95 + 2);
            const marketAway = Math.round(analysis.awayWinPct * 0.95 + 2);
            const marketDraw = 100 - marketHome - marketAway;

            return (
              <div
                key={sv.matchId}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
              >
                {/* Match header */}
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xl">{match.homeFlag}</span>
                  <span className="text-sm font-bold text-white">{match.home} vs {match.away}</span>
                  <span className="text-xl">{match.awayFlag}</span>
                </div>

                {/* Triple comparison */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { icon: "👥", label: "Fans", data: sv.fans },
                    { icon: "🧠", label: "AI", data: { home: analysis.homeWinPct, draw: analysis.drawPct, away: analysis.awayWinPct } },
                    { icon: "💰", label: "Market", data: { home: marketHome, draw: marketDraw, away: marketAway } },
                  ].map((col) => (
                    <div key={col.label} className="text-center">
                      <div className="text-lg mb-1">{col.icon}</div>
                      <div className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">{col.label}</div>
                      <div className="space-y-2">
                        {[
                          { label: "H", pct: col.data.home, color: "bg-green-500" },
                          { label: "D", pct: col.data.draw, color: "bg-gray-500" },
                          { label: "A", pct: col.data.away, color: "bg-blue-500" },
                        ].map((row) => (
                          <div key={row.label}>
                            <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                              <span>{row.label}</span>
                              <span>{row.pct}%</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${row.color} rounded-full`}
                                style={{ width: `${row.pct}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Smart Insight */}
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <p className="text-sm text-gray-300">{sv.insight}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ AD BANNER — LARGE ═══════ */}
      <AdBanner size="large-banner" label="between-e-f" className="mb-4" />

      {/* ═══════ SECTION F — MARKET VALUE SCANNER ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Market Value Scanner</h2>
          <p className="text-gray-400 text-lg">Where AI disagrees with bookmakers — that&apos;s where value lives</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {valueMatches.map((vm) => {
            const match = allMatches.find((m) => m.id === vm.matchId)!;
            return (
              <div
                key={vm.matchId}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover-gradient-border transition-all"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-lg">{match.homeFlag}</span>
                  <span className="text-xs font-bold text-white truncate">{match.home} vs {match.away}</span>
                  <span className="text-lg">{match.awayFlag}</span>
                </div>

                <div className="mb-3">
                  <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">AI Pick</div>
                  <div className="text-sm font-bold text-green-400">{vm.aiPick}</div>
                </div>

                <div className="flex justify-between mb-3">
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Confidence</div>
                    <div className="text-sm font-bold text-white">{vm.aiConf}%</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">Best Odds</div>
                    <div className="text-sm font-bold text-amber-400">{vm.bestOdds}</div>
                  </div>
                </div>

                <div className="text-[10px] text-gray-500 mb-3">{vm.bookmaker}</div>

                <Link
                  href={`/match/${vm.matchId}`}
                  className="block text-center py-2 rounded-xl text-sm font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 transition-all"
                >
                  Claim Value →
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══════ SECTION G — LATEST INTEL ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">Latest Intel</h2>
            <p className="text-gray-400 text-lg">Analysis and insights from the KickScan intelligence desk</p>
          </div>
          <Link href="/blog" className="hidden sm:block text-sm font-semibold text-purple-400 hover:text-purple-300 transition">
            View All Intel →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover-gradient-border transition-all group block"
            >
              <span className="text-[10px] bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30 font-bold tracking-wider">
                {post.category}
              </span>
              <h3 className="text-sm font-bold text-white mt-3 mb-2 group-hover:text-purple-400 transition line-clamp-2">
                {post.title}
              </h3>
              <p className="text-xs text-gray-400 line-clamp-2 mb-3">{post.excerpt}</p>
              <span className="text-[10px] text-gray-500">{post.date}</span>
            </Link>
          ))}
        </div>

        <Link href="/blog" className="sm:hidden block text-center mt-6 text-sm font-semibold text-purple-400 hover:text-purple-300 transition">
          View All Intel →
        </Link>
      </section>

      {/* ═══════ SECTION H — FINAL CTA ═══════ */}
      <section className="py-24 px-4 bg-gradient-to-b from-[#06060f] via-purple-950/20 to-[#06060f]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4">
            Stop guessing. Start scanning.
          </h2>
          <p className="text-lg text-gray-400 mb-8">
            AI analysis for every World Cup 2026 match
          </p>

          <Link
            href="/matches"
            className="inline-block px-10 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/25 btn-glow mb-10"
          >
            Explore Every Match →
          </Link>

          {/* Email signup */}
          <div className="max-w-md mx-auto">
            <p className="text-sm text-gray-400 mb-3">Get intelligence alerts</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-purple-500/50 transition"
              />
              <button
                className="px-6 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all"
              >
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
