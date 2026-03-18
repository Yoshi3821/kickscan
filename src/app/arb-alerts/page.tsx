"use client";
import { useState } from "react";

export default function ArbAlertsPage() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
        setName("");
      } else {
        const data = await res.json();
        setStatus("error");
        setErrorMsg(data.error || "Something went wrong.");
      }
    } catch {
      setStatus("error");
      setErrorMsg("Network error. Please try again.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl md:text-5xl font-black">
          Arbitrage <span className="text-green-400">Alerts</span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          Our AI scans bookmaker odds 24/7 to find guaranteed profit opportunities
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-8 mb-10">
        <h2 className="text-2xl font-bold mb-6 text-center">How Arbitrage Betting Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: "🔍", title: "1. We Scan", desc: "Our AI monitors odds across 10+ bookmakers every minute, looking for price gaps." },
            { icon: "⚡", title: "2. We Alert", desc: "When combined implied probability drops below 100%, we send you an instant alert." },
            { icon: "💰", title: "3. You Profit", desc: "Place the calculated stakes on each side. Guaranteed profit regardless of outcome." },
          ].map(s => (
            <div key={s.title} className="text-center">
              <div className="text-4xl mb-3">{s.icon}</div>
              <h3 className="font-bold text-white mb-2">{s.title}</h3>
              <p className="text-gray-400 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Sample Alert */}
      <div className="bg-gray-900/50 border border-green-400/20 rounded-xl overflow-hidden mb-10">
        <div className="px-6 py-3 bg-green-400/5 border-b border-green-400/20 flex items-center gap-2">
          <span className="text-green-400 font-bold text-sm">⚡ SAMPLE ALERT</span>
          <span className="text-gray-600 text-xs">— Live alerts coming during World Cup</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block text-xs">Match</span>
              <span className="text-white font-bold">Brazil vs Morocco</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Market</span>
              <span className="text-white">3-way (1X2)</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">Combined Probability</span>
              <span className="text-green-400 font-bold">97.8%</span>
            </div>
            <div>
              <span className="text-gray-500 block text-xs">ROI</span>
              <span className="text-green-400 font-bold">2.2%</span>
            </div>
          </div>
          <div className="border-t border-gray-800/50 pt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs">
                  <th className="text-left py-2">Bet</th>
                  <th className="text-left py-2">Bookmaker</th>
                  <th className="text-center py-2">Odds</th>
                  <th className="text-center py-2">Stake ($100)</th>
                  <th className="text-center py-2">Payout</th>
                </tr>
              </thead>
              <tbody className="text-gray-300 text-xs">
                <tr><td className="py-2">Brazil Win</td><td>Pinnacle</td><td className="text-center text-green-400 font-bold">2.18</td><td className="text-center">$46.88</td><td className="text-center">$102.20</td></tr>
                <tr><td className="py-2">Draw</td><td>Betway</td><td className="text-center text-green-400 font-bold">3.25</td><td className="text-center">$31.44</td><td className="text-center">$102.18</td></tr>
                <tr><td className="py-2">Morocco Win</td><td>Bet365</td><td className="text-center text-green-400 font-bold">3.60</td><td className="text-center">$21.68</td><td className="text-center">$102.15</td></tr>
              </tbody>
            </table>
          </div>
          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-3 text-sm">
            <span className="text-green-400 font-bold">Guaranteed Profit:</span>
            <span className="text-white ml-2">~$2.18 on $100 total stake (2.2% ROI)</span>
          </div>
        </div>
      </div>

      {/* Subscription Form */}
      <div className="bg-gradient-to-br from-green-900/20 via-gray-900 to-blue-900/20 border border-gray-800/50 rounded-xl p-8 md:p-10">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-black mb-2">🔔 Get Arb Alerts</h2>
          <p className="text-gray-400 mb-2">
            Sign up now and be the first to receive real-time arbitrage alerts when the tournament begins.
          </p>
          <p className="text-xs text-green-400 mb-6">Join 1,200+ subscribers</p>

          <form onSubmit={handleSubscribe} className="space-y-3">
            <input
              type="text"
              placeholder="Your name (optional)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-400 text-sm"
            />
            <input
              type="email"
              placeholder="Enter your email *"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-green-400 text-sm"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-400 hover:from-green-400 hover:to-green-300 text-black font-bold rounded-xl transition shadow-lg shadow-green-500/20 disabled:opacity-50"
            >
              {status === "loading" ? "Subscribing..." : "Subscribe to Alerts →"}
            </button>
          </form>

          {status === "success" && (
            <div className="mt-4 bg-green-400/10 border border-green-400/30 rounded-lg p-3 text-green-400 text-sm">
              ✅ You&apos;re subscribed! We&apos;ll send you alerts when opportunities arise.
            </div>
          )}
          {status === "error" && (
            <div className="mt-4 bg-red-400/10 border border-red-400/30 rounded-lg p-3 text-red-400 text-sm">
              ❌ {errorMsg}
            </div>
          )}

          <p className="text-[10px] text-gray-600 mt-4">
            We respect your privacy. Unsubscribe anytime. No spam, ever.
          </p>
        </div>
      </div>
    </div>
  );
}
