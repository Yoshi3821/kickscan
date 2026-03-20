"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalPoints: number;
  predictions: number;
  winRate: number;
  streak: number;
  isAI: boolean;
}

export default function LeaderboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"league" | "wc2026">("league");
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("kickscan_user");
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setCurrentUser(data.username || null);
      } catch {}
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?competition=${activeTab}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.leaderboard) setLeaderboard(data.leaderboard);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [activeTab]);

  const goToProfile = (username: string, isAI: boolean) => {
    router.push(`/profile/${isAI ? "kickscan_ai" : encodeURIComponent(username)}`);
  };

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">🏆 Leaderboard</h1>
          <p className="text-gray-400">Top players across KickScan</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 bg-white/5 border border-white/10 rounded-xl p-1.5 w-fit mx-auto mb-8">
          <button
            onClick={() => setActiveTab("league")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "league"
                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            🌐 Global
          </button>
          <button
            onClick={() => setActiveTab("wc2026")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              activeTab === "wc2026"
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "text-gray-400 hover:bg-white/10"
            }`}
          >
            🏆 World Cup 2026
          </button>
        </div>

        {/* Subtitle */}
        <p className="text-center text-xs text-gray-500 mb-6">
          {activeTab === "league"
            ? "All competitions combined"
            : "Tournament starts June 11 — register now to secure your spot"}
        </p>

        {/* Leaderboard */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Top 3 — highlighted */}
            {leaderboard.slice(0, 3).map((entry) => (
              <div
                key={entry.username}
                onClick={() => goToProfile(entry.username, entry.isAI)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all hover:scale-[1.01] ${
                  entry.isAI
                    ? "bg-cyan-500/10 border-cyan-500/30"
                    : entry.rank === 1
                    ? "bg-gradient-to-r from-yellow-500/15 to-amber-500/10 border-yellow-500/30"
                    : entry.rank === 2
                    ? "bg-gradient-to-r from-gray-300/10 to-gray-400/5 border-gray-400/30"
                    : "bg-gradient-to-r from-orange-500/10 to-amber-600/5 border-orange-500/30"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 text-center">
                    {entry.rank === 1 && <span className="text-2xl">🥇</span>}
                    {entry.rank === 2 && <span className="text-2xl">🥈</span>}
                    {entry.rank === 3 && <span className="text-2xl">🥉</span>}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      {entry.isAI && <span className="text-lg">🧠</span>}
                      <span className={`font-bold ${
                        entry.isAI ? "text-cyan-400" :
                        currentUser === entry.username ? "text-purple-400" : "text-white"
                      }`}>
                        {entry.username}
                        {currentUser === entry.username && (
                          <span className="ml-2 text-xs text-purple-400/70">← you</span>
                        )}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {entry.predictions} picks · {entry.winRate}% win rate
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-green-400">{entry.totalPoints}</div>
                  <div className="text-xs text-gray-500">
                    {entry.streak > 0 && <span className="text-orange-400">🔥{entry.streak}</span>}
                  </div>
                </div>
              </div>
            ))}

            {/* Divider */}
            {leaderboard.length > 3 && (
              <div className="border-t border-white/5 my-2" />
            )}

            {/* Rest of leaderboard */}
            {leaderboard.slice(3).map((entry) => (
              <div
                key={entry.username}
                onClick={() => goToProfile(entry.username, entry.isAI)}
                className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all hover:bg-white/[0.06] ${
                  entry.isAI
                    ? "bg-cyan-500/[0.06] border-cyan-500/20"
                    : currentUser === entry.username
                    ? "bg-purple-500/[0.06] border-purple-500/20"
                    : "bg-white/[0.03] border-white/[0.06]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 text-center text-sm font-bold text-gray-500">
                    #{entry.rank}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      {entry.isAI && <span>🧠</span>}
                      <span className={`text-sm font-bold ${
                        entry.isAI ? "text-cyan-400" :
                        currentUser === entry.username ? "text-purple-400" : "text-white"
                      }`}>
                        {entry.username}
                        {currentUser === entry.username && (
                          <span className="ml-1.5 text-[10px] text-purple-400/70">← you</span>
                        )}
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-600">
                      {entry.predictions} picks · {entry.winRate}%
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold text-green-400">{entry.totalPoints}</div>
                  {entry.streak > 0 && (
                    <div className="text-[10px] text-orange-400">🔥{entry.streak}</div>
                  )}
                </div>
              </div>
            ))}

            {leaderboard.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No players yet. <a href="/predict" className="text-purple-400 hover:text-purple-300">Start predicting!</a>
              </div>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-8">
          <a
            href="/predict"
            className="inline-block px-8 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all shadow-lg shadow-purple-500/20"
          >
            🎮 Start Predicting
          </a>
        </div>
      </div>
    </main>
  );
}
