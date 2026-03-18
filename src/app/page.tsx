"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import AdBanner from "@/components/AdBanner";

/* ──────────────────────────── DATA ──────────────────────────── */

const groups = [
  { id: "A", teams: ["🇲🇽 Mexico", "🇰🇷 South Korea", "🇿🇦 South Africa", "🏳️ UEFA PO D"] },
  { id: "B", teams: ["🇨🇦 Canada", "🇨🇭 Switzerland", "🇶🇦 Qatar", "🏳️ UEFA PO A"] },
  { id: "C", teams: ["🇧🇷 Brazil", "🇲🇦 Morocco", "🏴󠁧󠁢󠁳󠁣󠁴󠁿 Scotland", "🇭🇹 Haiti"] },
  { id: "D", teams: ["🇺🇸 USA", "🇵🇾 Paraguay", "🇦🇺 Australia", "🏳️ UEFA PO C"] },
  { id: "E", teams: ["🇩🇪 Germany", "🇪🇨 Ecuador", "🇨🇮 Ivory Coast", "🇨🇼 Curacao"] },
  { id: "F", teams: ["🇳🇱 Netherlands", "🇯🇵 Japan", "🇹🇳 Tunisia", "🏳️ UEFA PO B"] },
  { id: "G", teams: ["🇧🇪 Belgium", "🇮🇷 Iran", "🇪🇬 Egypt", "🇳🇿 New Zealand"] },
  { id: "H", teams: ["🇪🇸 Spain", "🇺🇾 Uruguay", "🇸🇦 Saudi Arabia", "🇨🇻 Cape Verde"] },
  { id: "I", teams: ["🇫🇷 France", "🇸🇳 Senegal", "🇳🇴 Norway", "🏳️ ICP 2"] },
  { id: "J", teams: ["🇦🇷 Argentina", "🇦🇹 Austria", "🇩🇿 Algeria", "🇯🇴 Jordan"] },
  { id: "K", teams: ["🇵🇹 Portugal", "🇨🇴 Colombia", "🇺🇿 Uzbekistan", "🏳️ ICP 1"] },
  { id: "L", teams: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", "🇭🇷 Croatia", "🇵🇦 Panama", "🇬🇭 Ghana"] },
];

const features = [
  { icon: "📊", title: "Live Odds Comparison", desc: "Compare odds across 30+ bookmakers in real-time for every World Cup match.", href: "/odds" },
  { icon: "🧠", title: "AI Match Predictions", desc: "Deep analysis for every match — outcome probabilities, score prediction, tactical breakdown.", href: "/predictions" },
  { icon: "⚡", title: "Arbitrage Alerts", desc: "Instant alerts when bookmaker odds create guaranteed profit opportunities.", href: "/arb-alerts" },
  { icon: "📺", title: "Live Scores", desc: "Real-time scores, stats, and match tracking throughout the tournament.", href: "/live-scores" },
];

const stats = [
  { icon: "🏟️", value: "48", label: "Teams" },
  { icon: "📋", value: "12", label: "Groups" },
  { icon: "⚽", value: "104", label: "Matches" },
  { icon: "🏛️", value: "16", label: "Stadiums" },
  { icon: "🌎", value: "3", label: "Host Nations" },
  { icon: "📈", value: "30+", label: "Bookmakers" },
];

const upcomingMatches = [
  { date: "Jun 11", time: "15:00 ET", home: "🇲🇽 Mexico", away: "🇿🇦 South Africa", venue: "Estadio Azteca, Mexico City", odds: { home: "1.65", draw: "3.80", away: "5.50" } },
  { date: "Jun 11", time: "18:00 ET", home: "🇺🇸 USA", away: "🏳️ UEFA PO C", venue: "SoFi Stadium, Los Angeles", odds: { home: "1.50", draw: "4.00", away: "6.50" } },
  { date: "Jun 12", time: "12:00 ET", home: "🇧🇷 Brazil", away: "🇭🇹 Haiti", venue: "MetLife Stadium, New Jersey", odds: { home: "1.12", draw: "8.50", away: "21.00" } },
  { date: "Jun 12", time: "15:00 ET", home: "🇦🇷 Argentina", away: "🇯🇴 Jordan", venue: "Hard Rock Stadium, Miami", odds: { home: "1.18", draw: "7.00", away: "17.00" } },
  { date: "Jun 12", time: "18:00 ET", home: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 England", away: "🇬🇭 Ghana", venue: "BMO Field, Toronto", odds: { home: "1.40", draw: "4.50", away: "7.50" } },
  { date: "Jun 13", time: "12:00 ET", home: "🇩🇪 Germany", away: "🇨🇼 Curacao", venue: "Lincoln Financial Field, Philadelphia", odds: { home: "1.10", draw: "9.00", away: "25.00" } },
];

/* ──────────────────────────── PAGE ──────────────────────────── */

export default function Home() {
  return (
    <div className="bg-dot-pattern relative">
      {/* ===== ANIMATED BACKGROUND BLOBS ===== */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-purple-600/8 blur-[120px] animate-blob1" />
        <div className="absolute top-[30%] right-[-15%] w-[500px] h-[500px] rounded-full bg-cyan-500/6 blur-[100px] animate-blob2" />
        <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full bg-violet-600/5 blur-[140px] animate-blob3" />
        <div className="absolute top-[60%] left-[-5%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[100px] animate-blob2" style={{ animationDelay: "5s" }} />
      </div>

      <div className="relative z-10">
        {/* ═══════════════════════ HERO SECTION ═══════════════════════ */}
        <HeroSection />

        {/* ═══════════════════════ STATS BAR ═══════════════════════ */}
        <section className="relative">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-strong rounded-2xl p-6 md:p-8">
              <div className="grid grid-cols-3 md:grid-cols-6 gap-6 text-center">
                {stats.map((s) => (
                  <div key={s.label} className="space-y-1">
                    <div className="text-2xl mb-1">{s.icon}</div>
                    <div className="text-2xl md:text-3xl font-black text-white">{s.value}</div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════ LIVE DATA BADGE ═══════════════════════ */}
        <section className="py-12 md:py-16">
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-3 glass rounded-full px-6 py-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-400" />
              </span>
              <span className="text-green-400 font-semibold text-sm">Live odds from 30+ bookmakers</span>
            </div>
            <p className="text-gray-600 text-xs">Powered by real-time data</p>
          </div>
        </section>

        {/* ═══════════════════════ FEATURES GRID ═══════════════════════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <Link
                key={f.title}
                href={f.href}
                className="glass hover-gradient-border rounded-2xl p-6 md:p-7 transition-all duration-300 hover:bg-white/[0.07] group"
              >
                <div className="text-4xl mb-5">{f.icon}</div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 group-hover:bg-clip-text group-hover:text-transparent transition-all duration-300">
                  {f.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Ad: Leaderboard between features and groups */}
        <AdBanner size="leaderboard" label="home-mid-1" className="my-8" />

        {/* ═══════════════════════ GROUPS PREVIEW ═══════════════════════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              <span className="text-white">All </span>
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">12 Groups</span>
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              48 teams across 3 countries. Every odd compared. Every match analyzed.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {groups.map((g) => (
              <Link
                key={g.id}
                href="/groups"
                className="glass hover-gradient-border rounded-2xl p-5 transition-all duration-300 hover:bg-white/[0.07] group"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-cyan-500/20 text-sm font-black text-purple-300">
                    {g.id}
                  </span>
                  <span className="text-gray-600 group-hover:text-purple-400 transition text-xs">View Group →</span>
                </div>
                <ul className="space-y-2">
                  {g.teams.map((t) => (
                    <li key={t} className="text-sm text-gray-300 flex items-center gap-1">
                      {t}
                    </li>
                  ))}
                </ul>
              </Link>
            ))}
          </div>
        </section>

        {/* Ad: Large banner between groups and upcoming matches */}
        <AdBanner size="large-banner" label="home-mid-2" className="my-8" />

        {/* ═══════════════════════ UPCOMING MATCHES ═══════════════════════ */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-5xl font-black mb-4">
              <span className="text-white">Opening </span>
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">Matches</span>
            </h2>
            <p className="text-gray-500 max-w-lg mx-auto">
              First matches of the biggest World Cup ever. Odds updated in real-time.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingMatches.map((m, i) => (
              <div
                key={i}
                className="glass rounded-2xl p-5 hover:bg-white/[0.07] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-gray-500 font-medium">{m.date} · {m.time}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-400/10 text-green-400 font-semibold">ODDS LIVE</span>
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-bold text-white">{m.home}</span>
                  <span className="text-xs text-gray-600 font-medium">vs</span>
                  <span className="text-sm font-bold text-white">{m.away}</span>
                </div>
                <p className="text-[11px] text-gray-600 mb-4 truncate">{m.venue}</p>
                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-xs text-gray-500 mb-0.5">1</div>
                    <div className="text-sm font-bold text-purple-300">{m.odds.home}</div>
                  </div>
                  <div className="text-center py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-xs text-gray-500 mb-0.5">X</div>
                    <div className="text-sm font-bold text-gray-300">{m.odds.draw}</div>
                  </div>
                  <div className="text-center py-2 rounded-lg bg-white/[0.04] border border-white/[0.06]">
                    <div className="text-xs text-gray-500 mb-0.5">2</div>
                    <div className="text-sm font-bold text-cyan-300">{m.odds.away}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/odds" className="text-sm text-purple-400 hover:text-purple-300 font-medium transition">
              View All Odds →
            </Link>
          </div>
        </section>

        {/* ═══════════════════════ EMAIL CTA ═══════════════════════ */}
        <section className="relative overflow-hidden py-24">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-cyan-900/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-600/5 to-transparent" />
          <div className="relative max-w-2xl mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-black mb-3">
              <span className="bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                Get Early Access to Arb Alerts
              </span>
            </h2>
            <p className="text-gray-400 mb-8 text-base">
              Be the first to know when our AI spots guaranteed profit opportunities across bookmakers.
            </p>
            <form
              className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="your@email.com"
                className="flex-1 px-5 py-3.5 rounded-xl glass text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition text-sm"
              />
              <button
                type="submit"
                className="btn-glow px-6 py-3.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold rounded-xl transition-all duration-300 text-sm whitespace-nowrap"
              >
                Subscribe →
              </button>
            </form>
            <p className="text-gray-600 text-xs mt-4">
              🔒 Join 1,200+ subscribers · No spam, ever
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
