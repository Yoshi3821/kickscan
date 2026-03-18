"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

/* ──────────────────────── COUNTDOWN ──────────────────────── */
function HeroCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const target = new Date("2026-06-11T19:00:00Z").getTime();
    const update = () => {
      const diff = Math.max(0, target - Date.now());
      setTimeLeft({
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

  if (!mounted) return <div className="h-24" />;

  const units = [
    { label: "DAYS", value: timeLeft.days },
    { label: "HRS", value: timeLeft.hours },
    { label: "MIN", value: timeLeft.minutes },
    { label: "SEC", value: timeLeft.seconds },
  ];

  return (
    <div className="flex justify-center gap-3 sm:gap-4">
      {units.map((u) => (
        <div key={u.label} className="hero-countdown-block rounded-xl px-4 sm:px-6 py-3 sm:py-4 text-center min-w-[68px] sm:min-w-[88px]">
          <div className="text-2xl sm:text-4xl font-black tabular-nums leading-none tracking-tight text-white">
            {String(u.value).padStart(2, "0")}
          </div>
          <div className="text-[9px] sm:text-[10px] font-semibold text-white/40 mt-1.5 tracking-[0.2em] uppercase">
            {u.label}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ──────────────────────── VIEWERS COUNTER ──────────────────────── */
function ViewersCounter() {
  const [count, setCount] = useState(2341);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const id = setInterval(() => {
      setCount((c) => {
        const next = c + Math.floor(Math.random() * 7) - 3;
        return Math.max(2100, Math.min(2600, next));
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  if (!mounted) return <span className="font-bold text-white/80">—</span>;
  return <span className="font-bold text-white/80">{count.toLocaleString()}</span>;
}

/* ──────────────────────── HERO SECTION ──────────────────────── */
export default function HeroSection() {
  return (
    <section className="hero-section relative min-h-[100vh] flex items-center justify-center overflow-hidden">
      {/* ═══ BACKGROUND LAYERS ═══ */}

      {/* Stadium background — subtle */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[#06060f]" />
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25"
          style={{ backgroundImage: "url('/wc2026-hero.jpg')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#06060f]/70 via-[#06060f]/50 to-[#06060f]/95" />
      </div>

      {/* Dynamic color glow orbs — red, green, blue */}
      <div className="absolute inset-0 z-[1] overflow-hidden pointer-events-none">
        <div className="hero-glow-orb hero-glow-orb--red absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full" />
        <div className="hero-glow-orb hero-glow-orb--blue absolute top-[-8%] right-[-8%] w-[650px] h-[650px] rounded-full" />
        <div className="hero-glow-orb hero-glow-orb--green absolute bottom-[-15%] left-[30%] w-[500px] h-[500px] rounded-full" />
        <div className="hero-glow-orb hero-glow-orb--gold absolute top-[18%] left-[48%] w-[300px] h-[300px] rounded-full" />
      </div>

      {/* Gradient overlays for depth */}
      <div className="absolute inset-0 z-[2] bg-gradient-to-b from-[#06060f]/40 via-transparent to-[#06060f]/90 pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 z-[2] bg-gradient-to-t from-[#06060f] to-transparent pointer-events-none" />

      {/* ═══ PLAYER ACTION POSES ═══ */}
      {/* Desktop: positioned at bottom edges */}
      <div className="absolute inset-0 z-[3] hidden sm:flex justify-between items-end pointer-events-none">
        <div className="relative w-[35%] max-w-[520px] h-[92%] flex items-end pl-0">
          <img
            src="/players/messi.png"
            alt="Messi"
            className="w-full h-auto max-h-full object-contain object-bottom drop-shadow-[0_0_50px_rgba(0,102,255,0.4)] drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="relative w-[35%] max-w-[520px] h-[92%] flex items-end justify-end pr-0">
          <img
            src="/players/ronaldo.png"
            alt="Ronaldo"
            className="w-full h-auto max-h-full object-contain object-bottom drop-shadow-[0_0_50px_rgba(255,45,85,0.4)] drop-shadow-[0_0_20px_rgba(0,0,0,0.9)]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      </div>

      {/* Mobile: players + trophy in a row at the TOP */}
      <div className="absolute top-[60px] left-0 right-0 z-[3] flex sm:hidden items-end justify-center gap-0 pointer-events-none px-2">
        <div className="w-[35%] flex items-end">
          <img
            src="/players/messi.png"
            alt="Messi"
            className="w-full h-auto max-h-[220px] object-contain object-bottom drop-shadow-[0_0_30px_rgba(0,102,255,0.4)]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="w-[22%] flex items-end justify-center -mx-2">
          <img
            src="/trophy.png"
            alt="FIFA World Cup Trophy"
            className="w-full h-auto max-h-[160px] object-contain object-bottom hero-trophy-float drop-shadow-[0_0_20px_rgba(255,215,0,0.5)]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
        <div className="w-[35%] flex items-end justify-end">
          <img
            src="/players/ronaldo.png"
            alt="Ronaldo"
            className="w-full h-auto max-h-[220px] object-contain object-bottom drop-shadow-[0_0_30px_rgba(255,45,85,0.4)]"
            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
          />
        </div>
      </div>

      {/* ═══ TROPHY — CENTER TOP (desktop only) ═══ */}
      <div className="absolute top-[6%] sm:top-[8%] left-1/2 -translate-x-1/2 z-[4] pointer-events-none hidden sm:block">
        <img
          src="/trophy.png"
          alt="FIFA World Cup Trophy"
          className="w-[80px] sm:w-[110px] h-auto hero-trophy-float drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]"
          onError={(e) => {
            // Fallback: show emoji if image missing
            const el = e.target as HTMLImageElement;
            el.style.display = "none";
            const span = document.createElement("span");
            span.className = "text-6xl sm:text-8xl hero-trophy-float";
            span.textContent = "🏆";
            el.parentElement?.appendChild(span);
          }}
        />
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 text-center">
        {/* Live badge */}
        <div className="hero-live-badge inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold uppercase tracking-wider mb-6 animate-fade-in-up">
          <span className="hero-live-dot" />
          <span className="text-red-400">Live matches now — 3 games today</span>
        </div>

        {/* Tagline */}
        <p className="animate-fade-in-up text-xs sm:text-sm font-semibold tracking-[0.3em] uppercase text-white/40 mb-3" style={{ animationDelay: "0.05s" }}>
          FIFA World Cup 2026
        </p>

        {/* Main title */}
        <h1 className="animate-fade-in-up hero-title-gradient text-[2.4rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[1.05] font-black mb-4" style={{ animationDelay: "0.1s", fontFamily: "'Inter', sans-serif" }}>
          AI PREDICTS<br />THE WINNER
        </h1>

        {/* Subtitle */}
        <p className="animate-fade-in-up text-base sm:text-lg md:text-xl text-white/60 mb-8 leading-relaxed" style={{ animationDelay: "0.2s" }}>
          Don&apos;t bet blind. <span className="text-white font-semibold">Use data to win.</span><br className="hidden sm:block" />
          <span className="text-sm sm:text-base text-white/40">Real-time odds comparison · AI predictions · Arbitrage alerts</span>
        </p>

        {/* CTA */}
        <div className="animate-fade-in-up mb-4" style={{ animationDelay: "0.3s" }}>
          <Link
            href="/odds"
            className="hero-cta-btn inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 text-sm sm:text-base font-bold uppercase tracking-wider rounded-xl transition-all duration-300"
          >
            GET TODAY&apos;S BEST ODDS
            <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <p className="animate-fade-in-up text-xs text-white/30 mb-10" style={{ animationDelay: "0.35s" }}>
          Free forever · No signup required
        </p>

        {/* Trust badges */}
        <div className="animate-fade-in-up flex flex-wrap justify-center gap-5 sm:gap-8 mb-10" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: "🛡️", text: "48 Teams Covered" },
            { icon: "🌐", text: "6 Sportsbooks" },
            { icon: "🤖", text: "AI-Powered" },
          ].map((b) => (
            <span key={b.text} className="flex items-center gap-1.5 text-xs text-white/35">
              <span>{b.icon}</span> {b.text}
            </span>
          ))}
        </div>

        {/* Countdown */}
        <div className="animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
          <p className="text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-white/30 mb-4">
            ⚽ World Cup Kicks Off In
          </p>
          <HeroCountdown />
        </div>
      </div>

      {/* ═══ BOTTOM STATS BAR ═══ */}
      <div className="absolute bottom-0 left-0 right-0 z-10 hero-bottom-bar">
        <div className="flex flex-wrap justify-center items-center gap-4 sm:gap-8 px-4 py-3 sm:py-4 text-xs text-white/45">
          <span className="flex items-center gap-1.5">
            <span className="text-green-400">●</span>
            <span className="font-bold text-white/70">3</span> live matches
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            📊 <span className="font-bold text-white/70">12,847</span> odds tracked today
          </span>
          <span className="flex items-center gap-1.5">
            <span className="hero-live-dot-sm" />
            <ViewersCounter /> viewing now
          </span>
          <span className="hidden sm:flex items-center gap-1.5">
            🎯 AI accuracy: <span className="font-bold text-white/70">78.4%</span>
          </span>
        </div>
      </div>
    </section>
  );
}
