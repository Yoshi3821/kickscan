"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  username: string;
  email: string;
  totalPoints: number;
  predictions: number;
  correctResults: number;
  correctScores: number;
  currentStreak: number;
  bestStreak: number;
  rank?: number;
  created_at: string;
}

interface Prediction {
  id: string;
  match_id: string;
  predicted_result: "home" | "draw" | "away";
  predicted_score: string;
  boosted: boolean;
  created_at: string;
  settled: boolean;
  points_earned: number;
  home_team?: string;
  away_team?: string;
  actual_result?: string | null;
  actual_score?: string | null;
  competition?: string;
}

interface Group {
  id: string;
  name: string;
  code: string;
  memberCount: number;
  competition?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [leavingGroup, setLeavingGroup] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("kickscan_user");
    
    if (!savedUser) {
      router.push("/predict");
      return;
    }

    try {
      const userData = JSON.parse(savedUser);
      if (!userData.id || !userData.token) {
        localStorage.removeItem("kickscan_user");
        router.push("/predict");
        return;
      }

      fetchUserData(userData.id, userData.token);
    } catch (err) {
      localStorage.removeItem("kickscan_user");
      router.push("/predict");
    }
  }, [router]);

  const fetchUserData = async (userId: string, token: string) => {
    try {
      // Fetch user profile
      const userResponse = await fetch(`/api/auth?token=${token}`);
      const userData = await userResponse.json();
      
      if (!userData.success) {
        localStorage.removeItem("kickscan_user");
        router.push("/predict");
        return;
      }

      setUser(userData.user);

      // Fetch recent predictions
      const predictionsResponse = await fetch(`/api/predictions?userId=${userId}&limit=10`);
      const predictionsData = await predictionsResponse.json();
      if (predictionsData.predictions) {
        setPredictions(predictionsData.predictions);
      }

      // Fetch user groups
      const groupsResponse = await fetch(`/api/groups?userId=${userId}`);
      const groupsData = await groupsResponse.json();
      if (groupsData.groups) {
        setGroups(groupsData.groups);
      }

    } catch (err) {
      console.error("Failed to fetch user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    if (!user) return;
    
    const group = groups.find(g => g.id === groupId);
    if (!confirm(`Are you sure you want to leave "${group?.name || 'this group'}"? You'll lose access to the group leaderboard.`)) {
      return;
    }
    
    setLeavingGroup(groupId);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave',
          userId: user.id,
          groupId
        })
      });

      const data = await response.json();
      if (data.success) {
        setGroups(groups.filter(g => g.id !== groupId));
      } else {
        alert(data.error || "Failed to leave group");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setLeavingGroup(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kickscan_user");
    router.push("/");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long", 
      day: "numeric"
    });
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case "home": return "🏠";
      case "away": return "✈️";
      case "draw": return "🤝";
      default: return "❓";
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-[#06060f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading profile...</div>
          <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-[#06060f] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="text-2xl mb-4">Session expired</div>
          <p className="text-gray-400 mb-6">Please log in again</p>
          <a href="/predict" className="px-6 py-3 bg-purple-600 rounded-xl text-white font-bold">
            Go to Login
          </a>
        </div>
      </main>
    );
  }

  const winRate = user.predictions > 0 ? Math.round((user.correctResults / user.predictions) * 100) : 0;
  const scoreRate = user.predictions > 0 ? Math.round((user.correctScores / user.predictions) * 100) : 0;

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-3">👤 MY PROFILE</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Profile Information</h2>
              <div className="space-y-3">
                <div>
                  <span className="text-gray-400 text-sm">Username:</span>
                  <div className="text-lg font-bold">{user.username}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Email:</span>
                  <div className="text-lg">{user.email}</div>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Joined:</span>
                  <div className="text-lg">{formatDate(user.created_at)}</div>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">📊 STATS</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{user.totalPoints}</div>
                  <div className="text-sm text-gray-400">Total Points</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{user.predictions}</div>
                  <div className="text-sm text-gray-400">Predictions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{winRate}%</div>
                  <div className="text-sm text-gray-400">Correct Results</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-amber-400">{scoreRate}%</div>
                  <div className="text-sm text-gray-400">Correct Scores</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-400">🔥{user.currentStreak}</div>
                  <div className="text-sm text-gray-400">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">{user.bestStreak}</div>
                  <div className="text-sm text-gray-400">Best Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">#{user.rank || 0}</div>
                  <div className="text-sm text-gray-400">Global Rank</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-cyan-400">👥 {groups.length}</div>
                  <div className="text-sm text-gray-400">Groups Joined</div>
                </div>
              </div>
            </div>

            {/* Recent Predictions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">📋 MY PREDICTIONS (recent)</h2>
              {predictions.length > 0 ? (
                <div className="space-y-3">
                  {predictions.map((prediction) => {
                    const homeName = prediction.home_team && prediction.home_team !== "Unknown" ? prediction.home_team : null;
                    const awayName = prediction.away_team && prediction.away_team !== "Unknown" ? prediction.away_team : null;
                    const matchLabel = homeName && awayName
                      ? `${homeName} vs ${awayName}`
                      : prediction.match_id.startsWith('wc_') ? `WC Match #${prediction.match_id.replace('wc_', '')}`
                      : prediction.match_id.startsWith('league_') ? `League Match #${prediction.match_id.replace('league_', '')}`
                      : `Match ${prediction.match_id}`;
                    
                    const pickLabel = prediction.predicted_result === "home"
                      ? `${homeName || "Home"} Win`
                      : prediction.predicted_result === "away"
                      ? `${awayName || "Away"} Win`
                      : "Draw";

                    return (
                      <div key={prediction.id} className={`p-4 border rounded-xl ${
                        prediction.settled
                          ? prediction.points_earned > 0
                            ? "bg-green-500/[0.06] border-green-500/20"
                            : "bg-red-500/[0.06] border-red-500/20"
                          : "bg-white/5 border-white/10"
                      }`}>
                        {/* Match title + competition */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-bold text-sm text-white">{matchLabel}</div>
                          {prediction.competition && (
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
                              {prediction.competition}
                            </span>
                          )}
                        </div>

                        {/* User's pick + predicted score */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base">{getResultIcon(prediction.predicted_result)}</span>
                          <div className="text-sm">
                            <span className="text-gray-300">Pick: </span>
                            <span className="font-semibold text-white">{pickLabel}</span>
                            <span className="text-gray-500 mx-1.5">·</span>
                            <span className="text-gray-300">Score: </span>
                            <span className="font-semibold text-white">{prediction.predicted_score}</span>
                            {prediction.boosted && (
                              <span className="ml-2 text-purple-400 text-xs">⚡ Boosted</span>
                            )}
                          </div>
                        </div>

                        {/* Post-match result (if settled) */}
                        {prediction.settled ? (
                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div className="text-xs">
                              {prediction.actual_score && (
                                <span className="text-gray-400">
                                  Final score: <span className="text-white font-bold">{prediction.actual_score}</span>
                                </span>
                              )}
                            </div>
                            <div className={`text-sm font-bold ${
                              prediction.points_earned > 0 ? "text-green-400" : "text-red-400"
                            }`}>
                              {prediction.points_earned > 0 ? (
                                <>✅ +{prediction.points_earned} pts</>
                              ) : (
                                <>❌ Wrong</>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-xs text-gray-500 pt-1">⏳ Awaiting result</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  No predictions yet. <a href="/predict" className="text-purple-400 hover:text-purple-300">Start predicting!</a>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Groups & Actions */}
          <div className="space-y-6">
            {/* My Groups */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">👥 MY GROUPS</h2>
              {groups.length > 0 ? (
                <div className="space-y-3">
                  {groups.map((group) => (
                    <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:bg-white/10 transition">
                      <a href={`/predict?tab=${group.competition || 'wc2026'}`} className="block mb-2">
                        <div className="font-bold">{group.name}</div>
                        <div className="text-xs text-gray-400">
                          {group.memberCount} members • Code: {group.code}
                        </div>
                      </a>
                      <button
                        onClick={() => handleLeaveGroup(group.id)}
                        disabled={leavingGroup === group.id}
                        className="w-full mt-2 py-2 px-3 rounded-xl text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition disabled:opacity-50"
                      >
                        {leavingGroup === group.id ? "Leaving..." : "Leave Group"}
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 py-4">
                  <p className="mb-3">No groups yet</p>
                  <a href="/predict" className="text-purple-400 hover:text-purple-300 text-sm">
                    Join or create a group
                  </a>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <a
                  href="/predict"
                  className="block w-full py-3 px-4 rounded-xl text-center bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold transition-all"
                >
                  🎮 Make Predictions
                </a>
                <a
                  href="/predict"
                  className="block w-full py-3 px-4 rounded-xl text-center bg-white/10 border border-white/20 hover:bg-white/20 text-gray-300 font-bold transition-all"
                >
                  👥 View Leaderboard
                </a>
              </div>
            </div>

            {/* Logout */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 rounded-xl text-center bg-red-500/20 border border-red-500/30 hover:bg-red-500/30 text-red-400 font-bold transition-all"
              >
                🔴 Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}