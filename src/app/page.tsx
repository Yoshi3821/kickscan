"use client";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { allMatches } from "@/data/matches";
import { getMatchAnalysis } from "@/data/analyses";
import { getPlayersByTier, getCountryColor } from "@/data/players";
import { getVerdict } from "@/data/verdicts";
import HeroSection from "@/components/HeroSection";
import { getUserTimezone, formatDateTime } from "@/lib/timezone";
// LeagueVerdicts now fetched client-side via API

/* ═══════════════════════════════════════════════════════════
   DATA PREPARATION
   ═══════════════════════════════════════════════════════════ */

// Featured matches for Section B (first 6)
const featuredMatches = allMatches.slice(0, 6);



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



/* ═══════════════════════════════════════════════════════════
   PAGE COMPONENT
   ═══════════════════════════════════════════════════════════ */

function LeagueMatchesClient() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/league-fixtures")
      .then(r => r.json())
      .then(data => { setMatches(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3].map(i => <div key={i} className="bg-white/5 rounded-2xl p-6 h-48 animate-pulse" />)}</div>;
  if (matches.length === 0) return (
    <div className="text-center py-8">
      <p className="text-gray-400 mb-2">⏸️ International break — league matches resume soon</p>
      <p className="text-xs text-gray-600">Check the Leagues page for the latest schedule</p>
    </div>
  );

  const recColors: Record<string, string> = { BET: "bg-green-500/20 text-green-400 border-green-500/30", LEAN: "bg-amber-500/20 text-amber-400 border-amber-500/30", SKIP: "bg-gray-500/20 text-gray-400 border-gray-500/30", AVOID: "bg-red-500/20 text-red-400 border-red-500/30" };
  const riskColors: Record<string, string> = { LOW: "text-green-400", MEDIUM: "text-yellow-400", HIGH: "text-orange-400", "VERY HIGH": "text-red-400" };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {matches.map((m: any) => (
        <a key={m.id} href={typeof m.id === "number" || /^\d+$/.test(String(m.id)) ? `/leagues/${m.id}` : `/leagues`} className="block bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/[0.08] transition-all">
          <div className="flex items-center gap-2 mb-3">
            <img src={m.leagueLogo} alt="" className="w-4 h-4" />
            <span className="text-[10px] text-gray-400">{m.leagueFlag} {m.leagueName}</span>
            <span className="ml-auto text-[10px] text-gray-500">{formatDateTime(m.date, getUserTimezone())}</span>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {m.homeLogo ? (
                <img src={m.homeLogo} alt="" className="w-7 h-7 rounded" />
              ) : (
                <span className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">{m.homeName?.slice(0,3).toUpperCase()}</span>
              )}
              <span className="text-sm font-bold text-white truncate">{m.homeName}</span>
            </div>
            <span className="text-xs text-gray-500 px-2 font-bold">vs</span>
            <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
              <span className="text-sm font-bold text-white truncate">{m.awayName}</span>
              {m.awayLogo ? (
                <img src={m.awayLogo} alt="" className="w-7 h-7 rounded" />
              ) : (
                <span className="w-7 h-7 rounded bg-white/10 flex items-center justify-center text-[10px] font-bold text-gray-400">{m.awayName?.slice(0,3).toUpperCase()}</span>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${recColors[m.recommendation] || recColors.SKIP}`}>{m.recommendation}: {m.pick}</span>
            <span className={`text-[10px] font-bold ${riskColors[m.riskLevel] || "text-gray-400"}`}>{m.riskLevel}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

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

      {/* ═══════ WHAT IS KICKSCAN? SECTION ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            YOUR AI FOOTBALL INTELLIGENCE PLATFORM
          </h2>
          <p className="text-gray-400 text-lg">Match analysis, live scores, and AI verdicts — free for everyone. Predict & Compete with a free account.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-12">
          {/* Feature Card 1 - AI Verdicts */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-all">
            <div className="text-4xl mb-4">🎯</div>
            <h3 className="text-xl font-bold text-white mb-3">AI Verdicts</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Clear BET or SKIP calls for every match with intelligent reasoning
            </p>
          </div>

          {/* Feature Card 2 - Predict & Compete */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-all">
            <div className="text-4xl mb-4">🎮</div>
            <h3 className="text-xl font-bold text-white mb-3">Predict & Compete</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Predict match results, earn points, and beat the AI
            </p>
          </div>

          {/* Feature Card 3 - Private Groups */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-all">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-white mb-3">Private Groups</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Create private leagues with friends — compete, rank & win together
            </p>
          </div>

          {/* Feature Card 4 - Live Scores */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-all">
            <div className="text-4xl mb-4">📺</div>
            <h3 className="text-xl font-bold text-white mb-3">Live Scores</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Real-time scores with 10-second refresh, goal alerts & match events
            </p>
          </div>

          {/* Feature Card 5 - Match Analysis */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center hover:bg-white/[0.08] transition-all">
            <div className="text-4xl mb-4">🧠</div>
            <h3 className="text-xl font-bold text-white mb-3">Match Analysis</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              Deep AI insights with form, H2H, injuries & intelligent angles
            </p>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/predict"
            className="inline-block px-10 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/25"
          >
            🎮 Start Predicting — Free Account
          </a>
        </div>
      </section>

      {/* ═══════ UPCOMING LEAGUE MATCHES ═══════ */}
      <section className="py-16 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-full px-4 py-1.5 text-sm text-green-400 font-semibold mb-4">
            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span></span>
            MATCHES THIS WEEK
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-3">League Verdicts</h2>
          <p className="text-gray-400 text-lg">AI-powered verdicts for this week's biggest matches</p>
        </div>
        <LeagueMatchesClient />
        <div className="text-center mt-8">
          <a href="/leagues" className="inline-block px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-green-600 to-blue-500 hover:from-green-500 hover:to-blue-400 transition-all shadow-lg shadow-green-500/25">⚽ View All League Matches →</a>
        </div>
      </section>

      {/* ═══════ SECTION B — THE VERDICTS (FEATURED) ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">
            <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
              🎯 Today&apos;s Verdicts
            </span>
          </h2>
          <p className="text-gray-400 text-lg">AI-powered BET or SKIP calls for every match</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredAnalyses.map(({ match }) => {
            const verdict = getVerdict(match.id);
            if (!verdict) return null;

            const recStyles: Record<string, { emoji: string; bg: string; border: string; text: string; barColor: string }> = {
              BET: { emoji: "✅", bg: "bg-green-500/[0.08]", border: "border-green-500/30", text: "text-green-400", barColor: "from-green-500 to-emerald-400" },
              LEAN: { emoji: "⚠️", bg: "bg-amber-500/[0.08]", border: "border-amber-500/30", text: "text-amber-400", barColor: "from-amber-500 to-yellow-400" },
              SKIP: { emoji: "⏭️", bg: "bg-gray-500/[0.08]", border: "border-gray-500/30", text: "text-gray-400", barColor: "from-gray-500 to-gray-400" },
              AVOID: { emoji: "🚫", bg: "bg-red-500/[0.08]", border: "border-red-500/30", text: "text-red-400", barColor: "from-red-500 to-rose-400" },
            };
            const cfg = recStyles[verdict.recommendation];
            const riskColors: Record<string, string> = { LOW: "text-green-400", MEDIUM: "text-amber-400", HIGH: "text-orange-400", "VERY HIGH": "text-red-400" };
            const stars = Array.from({ length: 5 }, (_, i) => i < verdict.valueRating);

            return (
              <Link
                key={match.id}
                href={`/match/${match.id}`}
                className={`block ${cfg.bg} backdrop-blur-xl border ${cfg.border} rounded-2xl p-6 hover:scale-[1.02] transition-all group`}
              >
                {/* Group + Date */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold tracking-wider">
                    GROUP {match.group}
                  </span>
                  <span className="text-xs text-gray-500">{match.date}</span>
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

                {/* Verdict badge */}
                <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-3 mb-4`}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xl">{cfg.emoji}</span>
                    <span className={`text-lg font-black ${cfg.text}`}>{verdict.recommendation}: {verdict.pick}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-0.5">
                      {stars.map((filled, i) => (
                        <span key={i} className={`${filled ? "text-amber-400" : "text-gray-700"}`}>★</span>
                      ))}
                    </div>
                    <span className={`font-bold ${riskColors[verdict.riskLevel]}`}>{verdict.riskLevel} risk</span>
                  </div>
                </div>

                {/* Confidence */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex-1 h-2 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor}`}
                      style={{ width: `${verdict.confidencePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-400">{verdict.confidencePct}%</span>
                </div>

                {/* CTA */}
                <span className="block text-center py-2.5 rounded-xl text-sm font-semibold text-purple-400 bg-purple-500/10 border border-purple-500/20 group-hover:bg-purple-500/20 transition-all">
                  Check Verdict →
                </span>
              </Link>
            );
          })}
        </div>

        {/* View all verdicts */}
        <div className="text-center mt-8">
          <Link
            href="/verdicts"
            className="inline-block px-8 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/25"
          >
            🎯 View All 72 Verdicts →
          </Link>
        </div>
      </section>

      {/* ═══════ PREDICT & COMPETE PROMO (TOP 3 LEADERBOARD) ═══════ */}
      <section className="py-20 px-4 max-w-7xl mx-auto">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3">
                <span className="bg-gradient-to-r from-orange-500 to-purple-500 bg-clip-text text-transparent">
                  🎮 PREDICT & COMPETE — Can You Beat the AI?
                </span>
              </h2>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold text-center mb-6">🏆 LEADERBOARD</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🧠</span>
                    <span className="font-bold text-cyan-400">#1 KickScan AI</span>
                  </div>
                  <span className="text-xl font-bold text-cyan-400">—</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🥇</span>
                    <span className="font-bold text-yellow-400">Can you beat the AI?</span>
                  </div>
                  <span className="text-sm font-bold text-gray-400">Your spot →</span>
                </div>
              </div>
              <div className="text-center mt-4">
                <a href="/leaderboard" className="text-xs text-purple-400 hover:text-purple-300 transition">View Live Leaderboard →</a>
              </div>
            </div>

            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-center text-sm">
                <div>
                  <div className="text-lg mb-1">✅</div>
                  <div className="font-bold">Correct result: 3 pts</div>
                </div>
                <div>
                  <div className="text-lg mb-1">🎯</div>
                  <div className="font-bold">Correct score: +5 bonus</div>
                </div>
                <div>
                  <div className="text-lg mb-1">⚡</div>
                  <div className="font-bold">2 Daily Boosters</div>
                </div>
                <div>
                  <div className="text-lg mb-1">🏆</div>
                  <div className="font-bold">Climb ranks & beat AI</div>
                </div>
              </div>
            </div>

            <div className="text-center">
              <a
                href="/predict"
                className="inline-block px-8 py-4 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 transition-all shadow-lg shadow-orange-500/25"
              >
                Join the Game →
              </a>
              <p className="text-xs text-gray-400 mt-2">Free account required to play</p>
            </div>
          </div>
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








      {/* ═══════ LATEST INTEL ═══════ */}
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

      {/* ═══════ FINAL CTA ═══════ */}
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
