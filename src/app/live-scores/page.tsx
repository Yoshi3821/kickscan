"use client";
import { useState } from "react";
import AdBanner from "@/components/AdBanner";

const wcMatches = [
  { date: "Jun 11", time: "3:00 PM ET", home: "🇲🇽 Mexico", away: "🇿🇦 South Africa", venue: "Estadio Azteca, Mexico City" },
  { date: "Jun 11", time: "10:00 PM ET", home: "🇰🇷 South Korea", away: "🏳️ UEFA PO D", venue: "Estadio Akron, Guadalajara" },
  { date: "Jun 12", time: "3:00 PM ET", home: "🇨🇦 Canada", away: "🏳️ UEFA PO A", venue: "BMO Field, Toronto" },
  { date: "Jun 12", time: "9:00 PM ET", home: "🇺🇸 USA", away: "🇵🇾 Paraguay", venue: "SoFi Stadium, Los Angeles" },
  { date: "Jun 13", time: "3:00 PM ET", home: "🇶🇦 Qatar", away: "🇨🇭 Switzerland", venue: "Levi's Stadium, San Francisco" },
  { date: "Jun 13", time: "6:00 PM ET", home: "🇧🇷 Brazil", away: "🇲🇦 Morocco", venue: "MetLife Stadium, New York" },
];

export default function LiveScoresPage() {
  const [activeTab, setActiveTab] = useState<"matches" | "highlights">("matches");
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO HEADER */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-green-400 text-sm font-medium mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          LIVE
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Live Scores
          </span>
        </h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
          Real-time football scores from around the world
        </p>

        {/* TAB SWITCHER */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "matches"
                ? "bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg shadow-purple-500/10"
                : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            ⚽ Today&apos;s Matches
          </button>
          <button
            onClick={() => setActiveTab("highlights")}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
              activeTab === "highlights"
                ? "bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg shadow-purple-500/10"
                : "bg-white/5 border border-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            🎬 Video Highlights
          </button>
        </div>
      </div>

      {/* WIDGET SECTION */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden mb-4">
        {activeTab === "matches" ? (
          <iframe
            src="https://livescore.soccersapi.com/?theme=dark&font=Roboto&fontColor=%23ffffff&backgroundColor=%230a0a1a&matchBackgroundColor=%23111128&leagueColor=%23a78bfa&matchHoverBackgroundColor=%231a1a3e&oddBackgroundColor=%23161632&oddBorderColor=%232a2a4a&hideOdds=false"
            style={{ width: "100%", height: "800px", border: "none" }}
            title="Live Football Scores"
            loading="lazy"
          />
        ) : (
          <iframe
            src="https://www.scorebat.com/embed/livescore/?token=MjI4MDJfMTczMDc4NzIwMF9lZWI0OTQwZGI3YjNiOWNlNWI2ZGRjM2Q1YzI0MDg2MjZlNDBjYmRi"
            style={{ width: "100%", height: "760px", border: "none" }}
            title="Video Highlights"
            loading="lazy"
          />
        )}
      </div>

      {activeTab === "matches" && (
        <p className="text-center text-gray-500 text-sm mb-6">
          Live scores auto-refresh every 30 seconds
        </p>
      )}
      {activeTab === "highlights" && (
        <p className="text-center text-gray-500 text-sm mb-6">
          Latest match highlights and video replays
        </p>
      )}

      {/* Ad: Medium rectangle below widget */}
      <AdBanner size="medium-rect" label="live-scores-sidebar" className="my-8" />

      {/* PHASE 2 PLACEHOLDER — WORLD CUP 2026 */}
      <div className="mt-8 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🏟️ World Cup 2026 Live Scores
          </h2>
          <p className="text-gray-400">
            Custom live score tracking activates{" "}
            <span className="text-cyan-400 font-semibold">June 11, 2026</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wcMatches.map((match, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/[0.08] transition-all duration-300"
            >
              {/* Status badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500 font-medium">
                  {match.date} · {match.time}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  UPCOMING
                </span>
              </div>

              {/* Teams */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">{match.home}</span>
                <span className="text-gray-600 text-xs font-bold px-3">VS</span>
                <span className="text-white font-semibold text-sm">{match.away}</span>
              </div>

              {/* Venue */}
              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{match.venue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA SECTION */}
      <div className="bg-gradient-to-r from-purple-500/10 via-cyan-500/10 to-purple-500/10 border border-white/10 rounded-2xl p-8 md:p-12 text-center">
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
          🔔 Get notified when World Cup matches go live
        </h3>
        <p className="text-gray-400 mb-6 text-sm">
          Be the first to know when live scores, odds, and AI predictions activate for the 2026 World Cup.
        </p>

        {subscribed ? (
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-3 text-green-400 font-medium">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            You&apos;re on the list! We&apos;ll notify you.
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full sm:flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
            />
            <button
              type="submit"
              className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-500 hover:to-cyan-500 text-white font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-purple-500/20"
            >
              Notify Me
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
