"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Profile {
  username: string;
  displayName?: string;
  isAI?: boolean;
  rank: number | null;
  totalPoints: number;
  totalPredictions: number;
  correctResults: number;
  correctScores: number;
  currentStreak: number;
  bestStreak: number;
  winRate: number;
  joinedAt: string;
  dataDisclaimer?: string;
}

interface PredictionEntry {
  match_id: string;
  match_label?: string;
  match_date?: string;
  predicted_result: string | null;
  predicted_score: string | null;
  boosted: boolean | null;
  settled: boolean;
  actual_result: string | null;
  actual_score: string | null;
  points_earned: number;
  created_at: string;
  hidden?: boolean;
  source?: string;
}

export default function PublicProfilePage() {
  const params = useParams();
  // Safety: decode in case URL encoding persists through useParams
  const rawUsername = params.username as string;
  const username = (() => {
    try { return decodeURIComponent(rawUsername); } catch { return rawUsername; }
  })();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [predictions, setPredictions] = useState<PredictionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!username) return;
    fetch(`/api/profile?username=${encodeURIComponent(username)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setProfile(data.profile);
          setPredictions(data.predictions || []);
        }
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [username]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06060f] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="h-8 bg-white/10 rounded-xl w-48 mx-auto mb-4 animate-pulse" />
            <div className="h-4 bg-white/5 rounded-lg w-32 mx-auto animate-pulse" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-[#06060f] text-white">
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold mb-4">Player not found</h1>
          <p className="text-gray-400 mb-6">{error || "This player doesn't exist."}</p>
          <Link href="/predict" className="px-6 py-3 bg-purple-600 rounded-xl text-white font-bold">
            Back to Predict
          </Link>
        </div>
      </main>
    );
  }

  const resultLabel = (r: string | null) => {
    if (r === "home") return "Home Win";
    if (r === "away") return "Away Win";
    if (r === "draw") return "Draw";
    return "—";
  };

  const pointsColor = (pts: number) => {
    if (pts >= 8) return "text-yellow-400";
    if (pts > 0) return "text-green-400";
    return "text-gray-500";
  };

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Profile Header */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-3">{profile.isAI ? "🧠" : "⚽"}</div>
            <h1 className="text-2xl font-bold">
              {profile.displayName || profile.username}
              {profile.isAI && (
                <span className="ml-2 text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/30">
                  AI
                </span>
              )}
            </h1>
            {profile.rank && (
              <div className="text-gray-400 text-sm mt-1">Rank #{profile.rank}</div>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-green-400">{profile.totalPoints}</div>
              <div className="text-xs text-gray-400">Points</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{profile.totalPredictions}</div>
              <div className="text-xs text-gray-400">Predictions</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-purple-400">{profile.winRate}%</div>
              <div className="text-xs text-gray-400">Win Rate</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-orange-400">🔥 {profile.currentStreak}</div>
              <div className="text-xs text-gray-400">Streak</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{profile.correctResults}</div>
              <div className="text-xs text-gray-400">Correct Results</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-yellow-400">🎯 {profile.correctScores}</div>
              <div className="text-xs text-gray-400">Exact Scores</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center">
              <div className="text-lg font-bold text-white">{profile.bestStreak}</div>
              <div className="text-xs text-gray-400">Best Streak</div>
            </div>
          </div>

          {/* AI Disclaimer */}
          {profile.dataDisclaimer && (
            <div className="mt-6 bg-cyan-500/5 border border-cyan-500/20 rounded-xl p-4 text-xs text-cyan-300/70 text-center">
              ℹ️ {profile.dataDisclaimer}
            </div>
          )}
        </div>

        {/* Prediction History */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-6">
            {profile.isAI ? "🧠 AI Predictions" : "📋 Prediction History"}
          </h2>

          {predictions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No predictions yet.
            </div>
          ) : (
            <div className="space-y-3">
              {predictions.map((pred, i) => {
                // Safe match label — never show raw IDs
                const safeLabel = pred.match_label && !pred.match_label.startsWith('league_') && !pred.match_label.startsWith('wc_')
                  ? pred.match_label
                  : pred.match_id.startsWith('wc_') ? "World Cup Match" : "League Match";

                const isWin = pred.settled && pred.points_earned > 0;
                const isLoss = pred.settled && pred.points_earned === 0;

                return (
                  <div
                    key={`${pred.match_id}-${i}`}
                    className={`rounded-xl p-4 border ${
                      pred.hidden
                        ? "bg-white/[0.02] border-white/5"
                        : isWin
                        ? "bg-green-500/[0.08] border-green-500/25"
                        : isLoss
                        ? "bg-red-500/[0.06] border-red-500/20"
                        : "bg-white/[0.03] border-white/10"
                    }`}
                  >
                    {/* Match title */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-white">{safeLabel}</div>
                      {pred.match_date && (
                        <span className="text-[10px] text-gray-500">{pred.match_date}</span>
                      )}
                    </div>

                    {pred.hidden ? (
                      <div className="text-xs text-gray-500 bg-white/5 px-3 py-1.5 rounded-lg inline-block">
                        🔒 Hidden until kickoff
                      </div>
                    ) : (
                      <>
                        {/* Pick + Score */}
                        <div className="text-sm mb-2">
                          <span className="text-gray-400">Pick:</span>
                          <span className="font-semibold text-white ml-1">{resultLabel(pred.predicted_result)}</span>
                          {pred.predicted_score && (
                            <>
                              <span className="text-gray-600 mx-1.5">·</span>
                              <span className="text-gray-400">Score:</span>
                              <span className="font-semibold text-white ml-1">{pred.predicted_score}</span>
                            </>
                          )}
                          {pred.boosted && (
                            <span className="text-purple-400 text-xs ml-2">⚡ Boosted</span>
                          )}
                        </div>

                        {/* Result row */}
                        {pred.settled ? (
                          <div className="flex items-center justify-between pt-3 border-t border-white/5">
                            <div>
                              {pred.actual_score && (
                                <div className="text-lg font-black text-white">
                                  Final: <span className={isWin ? "text-green-400" : "text-red-400"}>{pred.actual_score}</span>
                                </div>
                              )}
                            </div>
                            <div className={`text-sm font-bold px-3 py-1 rounded-lg ${
                              isWin
                                ? "bg-green-500/20 text-green-400"
                                : "bg-red-500/20 text-red-400"
                            }`}>
                              {isWin ? `Win · +${pred.points_earned} pts` : "Loss · 0 pts"}
                            </div>
                          </div>
                        ) : pred.source === "verdict_engine" ? (
                          <div className="text-[10px] text-cyan-400/60 bg-cyan-500/10 px-1.5 py-0.5 rounded inline-block">
                            AI Engine
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 pt-2 border-t border-white/5">⏳ Awaiting result</div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
