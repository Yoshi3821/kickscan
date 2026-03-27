"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { allMatches, getKickoffISO, getAllMatchesWithOdds } from "@/data/matches";
import { getVerdict } from "@/data/verdicts";
import { getUserTimezone, formatDateTime } from "@/lib/timezone";

/* ═══════════════════════════════════════════════════════════
   DATA — upcoming matches (WC qualifiers + friendlies first, then group stage)
   ═══════════════════════════════════════════════════════════ */
// Filter to only future matches (kickoff > now, checked at render time)
function getUpcomingMatches() {
  const now = Date.now();
  const isUpcoming = (m: typeof allMatches[0]) => {
    const kickoff = new Date(getKickoffISO(m.date, m.time)).getTime();
    return kickoff > now;
  };
  const playoffMatches = allMatches.filter(m => m.group === "WCQ" && isUpcoming(m));
  const friendlyMatches = allMatches.filter(m => m.group === "FRI" && isUpcoming(m));
  const groupMatches = allMatches.filter(m => !["WCQ", "FRI"].includes(m.group) && isUpcoming(m)).slice(0, 4);
  return [...playoffMatches.slice(0, 4), ...friendlyMatches.slice(0, 2), ...groupMatches].slice(0, 6);
}

/* ═══════════════════════════════════════════════════════════
   COUNTDOWN
   ═══════════════════════════════════════════════════════════ */
function Countdown() {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date("2026-06-11T19:00:00Z").getTime();
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTime({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff / 3600000) % 24),
        minutes: Math.floor((diff / 60000) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return <div className="h-16" />;

  return (
    <div className="flex justify-center gap-3">
      {[
        { label: "DAYS", value: time.days },
        { label: "HRS", value: time.hours },
        { label: "MIN", value: time.minutes },
        { label: "SEC", value: time.seconds },
      ].map((u) => (
        <div key={u.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[64px]">
          <div className="text-2xl font-black text-white tabular-nums">{String(u.value).padStart(2, "0")}</div>
          <div className="text-[9px] text-gray-500 tracking-widest mt-1">{u.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════ */
export default function HomePage() {
  const [tz, setTz] = useState("America/New_York");

  useEffect(() => {
    setTz(getUserTimezone());
  }, []);

  return (
    <main className="min-h-screen bg-[#06060f] text-white overflow-x-hidden">

      {/* ═══════ HERO ═══════ */}
      <section className="relative py-20 sm:py-32 px-4 text-center overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#06060f]" />
          <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/wc2026-hero.jpg')" }} />
          <div className="absolute inset-0 bg-gradient-to-b from-[#06060f]/60 via-transparent to-[#06060f]" />
        </div>

        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-gray-400 mb-4">FIFA World Cup 2026</p>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black mb-6 leading-tight">
            <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Predict. Compete. Win.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-300 mb-8 max-w-xl mx-auto">
            Predict World Cup match results, earn points based on odds, and compete against friends and AI on the leaderboard.
          </p>

          <a
            href="/predict"
            className="inline-block px-10 py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/25 mb-8"
          >
            🎮 Start Predicting — It&apos;s Free
          </a>

          <div className="mb-10">
            <p className="text-[10px] tracking-widest uppercase text-gray-500 mb-4">⚽ World Cup Kicks Off In</p>
            <Countdown />
          </div>
        </div>
      </section>

      {/* ═══════ UPCOMING MATCHES ═══════ */}
      <section className="py-12 sm:py-20 px-4 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">🔥 Upcoming Matches</h2>
          <p className="text-gray-400">Pick your winners before kickoff</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {getUpcomingMatches().map((match) => {
            const verdict = getVerdict(match.id);
            const kickoffISO = getKickoffISO(match.date, match.time);
            const isQualifier = match.group === "WCQ";
            const isFriendly = match.group === "FRI";

            const recColors: Record<string, string> = {
              BET: "bg-green-500/20 text-green-400 border-green-500/30",
              LEAN: "bg-amber-500/20 text-amber-400 border-amber-500/30",
              SKIP: "bg-gray-500/20 text-gray-400 border-gray-500/30",
              AVOID: "bg-red-500/20 text-red-400 border-red-500/30",
            };

            return (
              <div
                key={match.id}
                className={`bg-white/[0.03] backdrop-blur-xl border rounded-2xl p-5 ${
                  isQualifier ? "border-yellow-500/20" : isFriendly ? "border-cyan-500/20" : "border-white/10"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] text-gray-400 font-bold">
                    {isQualifier ? "🏆 WC Qualifier" : isFriendly ? "⚽ Friendly" : `Group ${match.group}`}
                  </span>
                  <span className="text-[10px] text-gray-500">{formatDateTime(kickoffISO, tz)}</span>
                </div>

                <div className="flex items-center justify-between mb-4">
                  <div className="text-center flex-1">
                    <div className="text-2xl mb-1">{match.homeFlag}</div>
                    <div className="text-xs font-bold text-white truncate">{match.home}</div>
                  </div>
                  <span className="text-xs text-gray-600 font-bold px-2">VS</span>
                  <div className="text-center flex-1">
                    <div className="text-2xl mb-1">{match.awayFlag}</div>
                    <div className="text-xs font-bold text-white truncate">{match.away}</div>
                  </div>
                </div>

                {verdict && (
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${recColors[verdict.recommendation] || recColors.SKIP}`}>
                      {verdict.recommendation}: {verdict.pick}
                    </span>
                    <span className="text-[10px] text-gray-500">{verdict.confidencePct}% conf</span>
                  </div>
                )}

                <a
                  href="/predict"
                  className="block text-center py-2 rounded-xl text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/20 transition"
                >
                  Predict This Match →
                </a>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-8">
          <a
            href="/predict"
            className="inline-block px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/25"
          >
            View All Matches & Predict →
          </a>
        </div>
      </section>

      {/* ═══════ LEADERBOARD ═══════ */}
      <section className="py-12 sm:py-20 px-4 max-w-4xl mx-auto">
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold mb-2">🏆 Leaderboard</h2>
            <p className="text-gray-400">Can you beat the AI?</p>
          </div>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-between p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-lg">🧠</span>
                <span className="font-bold text-cyan-400">KickScan AI</span>
              </div>
              <span className="text-sm font-bold text-cyan-400">The bot to beat</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-yellow-500/[0.06] border border-yellow-500/20 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-lg">🥇</span>
                <span className="font-bold text-yellow-400">Your name here</span>
              </div>
              <span className="text-sm text-gray-400">Sign up to compete →</span>
            </div>
          </div>

          <div className="text-center">
            <a href="/predict" className="inline-block px-6 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-orange-600 to-purple-600 hover:from-orange-500 hover:to-purple-500 transition-all shadow-lg shadow-orange-500/25">
              Join the Game — Free
            </a>
            <div className="mt-3">
              <a href="/leaderboard" className="text-xs text-purple-400 hover:text-purple-300 transition">View Full Leaderboard →</a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="py-12 sm:py-20 px-4 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">How It Works</h2>
          <p className="text-gray-400">3 steps. 60 seconds. Free.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">1️⃣</div>
            <h3 className="text-lg font-bold mb-2">Pick Results</h3>
            <p className="text-sm text-gray-400">Choose Home, Draw, or Away for upcoming matches. Optional: predict the exact score.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">2️⃣</div>
            <h3 className="text-lg font-bold mb-2">Earn Points</h3>
            <p className="text-sm text-gray-400">Higher odds = more points. Use your daily booster to double your best pick.</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">3️⃣</div>
            <h3 className="text-lg font-bold mb-2">Climb the Board</h3>
            <p className="text-sm text-gray-400">Compete against friends, strangers, and the KickScan AI. Can you reach #1?</p>
          </div>
        </div>

        <div className="text-center">
          <a
            href="/predict"
            className="inline-block px-10 py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/25"
          >
            🎮 Start Predicting Now
          </a>
          <p className="text-xs text-gray-500 mt-3">Free account · No credit card · Takes 30 seconds</p>
        </div>
      </section>
    </main>
  );
}
