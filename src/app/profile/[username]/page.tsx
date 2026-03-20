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
  const username = params.username as string;

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
              {predictions.map((pred, i) => (
                <div
                  key={`${pred.match_id}-${i}`}
                  className={`rounded-xl p-4 border ${
                    pred.hidden
                      ? "bg-white/[0.02] border-white/5"
                      : pred.points_earned > 0
                      ? "bg-green-500/[0.05] border-green-500/20"
                      : pred.settled
                      ? "bg-red-500/[0.03] border-red-500/10"
                      : "bg-white/[0.03] border-white/10"
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-white">
                        {pred.match_label || pred.match_id}
                      </div>
                      {pred.match_date && (
                        <div className="text-xs text-gray-500">{pred.match_date}</div>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      {pred.hidden ? (
                        <div className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
                          🔒 Hidden until kickoff
                        </div>
                      ) : (
                        <>
                          <div className="text-sm font-bold text-white">
                            {resultLabel(pred.predicted_result)}
                            {pred.predicted_score && ` ${pred.predicted_score}`}
                          </div>
                          {pred.boosted && (
                            <span className="text-xs text-purple-400">⚡ Boosted</span>
                          )}
                        </>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0 min-w-[60px]">
                      {pred.settled ? (
                        <div className={`text-sm font-bold ${pointsColor(pred.points_earned)}`}>
                          {pred.points_earned > 0 ? `+${pred.points_earned}` : "0"} pts
                        </div>
                      ) : pred.source === "verdict_engine" ? (
                        <span className="text-[10px] text-cyan-400/60 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                          AI Engine
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">Pending</span>
                      )}
                      {pred.actual_score && (
                        <div className="text-xs text-gray-400">Final: {pred.actual_score}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
