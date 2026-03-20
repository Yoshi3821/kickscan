"use client";
import { useEffect, useState, Suspense } from "react";
import { allMatches, getKickoffISO } from "@/data/matches";
import { getUserTimezone, formatDateTime, getTimezoneLabel, setUserTimezone, TIMEZONE_OPTIONS } from "@/lib/timezone";
import { useSearchParams } from 'next/navigation';

interface User {
  id: string;
  username: string;
  totalPoints: number;
  predictions: number;
  correctResults: number;
  correctScores: number;
  currentStreak: number;
  bestStreak: number;
  boostersUsedToday: number;
  rank?: number;
}

interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_result: "home" | "draw" | "away";
  predicted_score: string;
  boosted: boolean;
  created_at: string;
  settled: boolean;
  points_earned: number;
}

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalPoints: number;
  predictions: number;
  winRate: number;
  streak: number;
  isAI: boolean;
}

interface LeagueMatch {
  id: string | number;
  homeName: string;
  awayName: string;
  homeLogo?: string;
  awayLogo?: string;
  date: string;
  leagueName: string;
  leagueFlag: string;
  leagueLogo: string;
}

interface Group {
  id: string;
  name: string;
  code: string;
  competition: string;
  memberCount: number;
}

interface GroupMember {
  userId: string;
  username: string;
  points: number;
}

type Competition = 'league' | 'wc2026';

function PredictPageContent() {
  const searchParams = useSearchParams();
  const joinCode = searchParams.get('join');

  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [token, setToken] = useState<string>("");
  
  // Form states
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loginUsername, setLoginUsername] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [usernameStatus, setUsernameStatus] = useState<string>(""); // "", "checking", "available", "taken", "invalid"
  const [selectedAvatar, setSelectedAvatar] = useState<string>("⚽");
  const [activeTab, setActiveTab] = useState<Competition>('league');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [leagueMatches, setLeagueMatches] = useState<LeagueMatch[]>([]);
  const [loadingMatches, setLoadingMatches] = useState<boolean>(true);
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({});
  const [boostersRemaining, setBoostersRemaining] = useState<number>(2);

  // Groups state
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [joinGroupCode, setJoinGroupCode] = useState("");
  const [createdGroupCode, setCreatedGroupCode] = useState("");
  const [selectedGroupLeaderboard, setSelectedGroupLeaderboard] = useState<GroupMember[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [userTz, setUserTz] = useState<string>("America/New_York");
  const [showTzPicker, setShowTzPicker] = useState(false);

  // Live scores for match cards
  const [liveScores, setLiveScores] = useState<Record<string, { home: number; away: number; minute: number; status: string }>>({});

  // Initialize timezone
  useEffect(() => {
    setUserTz(getUserTimezone());
    const handleTzChange = () => setUserTz(getUserTimezone());
    window.addEventListener("kickscan_tz_change", handleTzChange);
    return () => window.removeEventListener("kickscan_tz_change", handleTzChange);
  }, []);

  // Username validation with debounce
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus("");
      return;
    }

    const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username.trim());
    if (!isValid) {
      setUsernameStatus("invalid");
      return;
    }

    setUsernameStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/auth", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "check_username", username: username.trim() })
        });
        const data = await response.json();
        if (data.available) {
          setUsernameStatus("available");
        } else {
          setUsernameStatus("taken");
        }
      } catch {
        setUsernameStatus("");
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [username]);

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("kickscan_user");
    
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        if (userData.id && userData.token) {
          validateSession(userData.id, userData.token);
          if (userData.avatar) setSelectedAvatar(userData.avatar);
        }
      } catch (err) {
        localStorage.removeItem("kickscan_user");
      }
    }
    
    fetchLeaderboard();
    fetchUpcomingMatches();
  }, []);

  // Handle auto-join from URL
  useEffect(() => {
    if (joinCode && user && userId) {
      handleJoinGroup(joinCode);
    }
  }, [joinCode, user, userId]);

  // Load competition-specific leaderboard
  useEffect(() => {
    if (activeTab) {
      fetchLeaderboard();
    }
  }, [activeTab]);

  // Load user predictions when logged in
  useEffect(() => {
    if (user && userId) {
      loadUserPredictions();
      loadUserGroups();
    }
  }, [user, userId, leagueMatches]);

  // Fetch live scores every 30s for started matches
  useEffect(() => {
    if (!user) return;

    const fetchLiveScores = async () => {
      try {
        const response = await fetch('/api/livescores', { cache: 'no-store' });
        const data = await response.json();
        if (data.matches && Array.isArray(data.matches)) {
          const scores: Record<string, { home: number; away: number; minute: number; status: string }> = {};
          for (const m of data.matches) {
            // Match by fixture ID for league matches
            scores[`league_${m.fixtureId}`] = {
              home: m.homeGoals ?? 0,
              away: m.awayGoals ?? 0,
              minute: m.minute ?? 0,
              status: m.status || ''
            };
          }
          setLiveScores(scores);
        }
      } catch (err) {
        // Silently fail — live scores are enhancement only
      }
    };

    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const validateSession = async (uid: string, tok: string) => {
    try {
      const response = await fetch(`/api/auth?token=${tok}`);
      const data = await response.json();
      
      if (data.success) {
        setUser(data.user);
        setUserId(uid);
        setToken(tok);
        setBoostersRemaining(2 - data.user.boostersUsedToday);
      } else {
        localStorage.removeItem("kickscan_user");
      }
    } catch (err) {
      console.error("Session validation failed:", err);
      localStorage.removeItem("kickscan_user");
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const url = activeTab ? `/api/leaderboard?competition=${activeTab}` : '/api/leaderboard';
      const response = await fetch(url);
      const data = await response.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error("Failed to fetch leaderboard:", err);
    }
  };

  const fetchUpcomingMatches = async () => {
    try {
      const response = await fetch("/api/league-fixtures");
      const data = await response.json();
      setLeagueMatches(data.slice(0, 15)); // Limit to 15 matches
    } catch (err) {
      console.error("Failed to fetch league matches:", err);
    } finally {
      setLoadingMatches(false);
    }
  };

  const loadUserPredictions = async () => {
    if (!userId) return;
    
    const allMatchIds = [
      ...allMatches.slice(0, 10).map(m => `wc_${m.id}`),
      ...leagueMatches.slice(0, 10).map(m => `league_${m.id}`)
    ];

    const userPredictions: Record<string, Prediction> = {};
    
    for (const matchId of allMatchIds) {
      try {
        const response = await fetch(`/api/predict?userId=${userId}&matchId=${matchId}`);
        const data = await response.json();
        if (data.prediction) {
          userPredictions[matchId] = data.prediction;
        }
      } catch (err) {
        console.error(`Failed to load prediction for ${matchId}:`, err);
      }
    }
    
    setPredictions(userPredictions);
  };

  const loadUserGroups = async () => {
    if (!userId) return;
    
    try {
      const response = await fetch(`/api/groups?userId=${userId}`);
      const data = await response.json();
      if (data.groups) {
        setUserGroups(data.groups);
      }
    } catch (err) {
      console.error("Failed to load user groups:", err);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert("Please enter a group name");
      return;
    }

    setGroupsLoading(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          userId,
          name: newGroupName.trim(),
          competition: activeTab
        })
      });

      const data = await response.json();
      if (data.success) {
        setCreatedGroupCode(data.group.code);
        setNewGroupName("");
        setShowCreateGroup(false);
        loadUserGroups();
      } else {
        alert(data.error || "Failed to create group");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleJoinGroup = async (code?: string) => {
    const codeToUse = code || joinGroupCode;
    if (!codeToUse.trim()) {
      alert("Please enter a group code");
      return;
    }

    setGroupsLoading(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'join',
          userId,
          code: codeToUse.trim().toUpperCase()
        })
      });

      const data = await response.json();
      if (data.success) {
        alert(`✅ Joined "${data.group.name}"!`);
        setJoinGroupCode("");
        loadUserGroups();
      } else {
        alert(data.error || "Failed to join group");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    } finally {
      setGroupsLoading(false);
    }
  };

  const handleViewGroupLeaderboard = async (group: Group) => {
    try {
      const response = await fetch(`/api/groups?groupId=${group.id}`);
      const data = await response.json();
      if (data.leaderboard) {
        setSelectedGroup(group);
        setSelectedGroupLeaderboard(data.leaderboard);
      }
    } catch (err) {
      alert("Failed to load group leaderboard");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert("Copied to clipboard!");
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "register", 
          username: username.trim(), 
          email: email.trim(),
          password: password.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Show success popup
        alert(`🎉 Welcome to KickScan, ${data.user.username}! Your account is ready. Start predicting matches now!`);
        
        // Auto-login after registration
        const userData = {
          id: data.user.id,
          username: data.user.username,
          token: data.token,
          avatar: selectedAvatar
        };
        
        setUserId(data.user.id);
        setToken(data.token);
        localStorage.setItem("kickscan_user", JSON.stringify(userData));
        window.dispatchEvent(new Event("kickscan_auth_change"));
        
        // Fetch full user data
        validateSession(data.user.id, data.token);
        fetchLeaderboard();
      } else {
        setError(data.error || "Registration failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setError("Username and password are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "login", 
          username: loginUsername.trim(),
          password: loginPassword.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        const userData = {
          id: data.user.id,
          username: data.user.username,
          token: data.token
        };
        
        setUser(data.user);
        setUserId(data.user.id);
        setToken(data.token);
        localStorage.setItem("kickscan_user", JSON.stringify(userData));
        window.dispatchEvent(new Event("kickscan_auth_change"));
        
        fetchLeaderboard();
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePrediction = async (matchId: string, result: "home" | "draw" | "away", score: string, useBooster: boolean = false) => {
    if (!userId || !token) return;
    
    if (!/^\d+-\d+$/.test(score)) {
      alert("Score must be in format '2-1'");
      return;
    }

    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          token,
          matchId,
          predictedResult: result,
          predictedScore: score,
          useBooster
        })
      });

      const data = await response.json();
      
      if (data.success) {
        // Update local predictions
        setPredictions(prev => ({
          ...prev,
          [matchId]: data.prediction
        }));
        
        setBoostersRemaining(data.boostersRemaining);
        
        // Refresh user data
        validateSession(userId, token);
        fetchLeaderboard();
      } else {
        alert(data.error || "Failed to save prediction");
      }
    } catch (err) {
      alert("Network error. Please try again.");
    }
  };

  if (!user) {
    return (
      <main className="min-h-screen bg-[#06060f] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">🎮 Predict & Compete</h1>
            <p className="text-xl text-gray-400 mb-8">Can you beat the AI?</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Registration & Login */}
            <div className="lg:col-span-1 space-y-8">
              {/* Registration Form */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold mb-2">🎮 JOIN THE GAME</h2>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <input
                      type="text"
                      placeholder="Username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none transition ${
                        usernameStatus === "taken" || usernameStatus === "invalid"
                          ? "border-red-500/50 focus:border-red-500/70"
                          : usernameStatus === "available"
                          ? "border-green-500/50 focus:border-green-500/70"
                          : "border-white/10 focus:border-purple-500/50"
                      }`}
                      maxLength={20}
                    />
                    {usernameStatus === "invalid" && username.trim() && (
                      <p className="text-red-400 text-xs mt-1">3-20 characters, letters, numbers & underscores only</p>
                    )}
                    {usernameStatus === "taken" && (
                      <p className="text-red-400 text-xs mt-1">Username already taken</p>
                    )}
                    {usernameStatus === "available" && (
                      <p className="text-green-400 text-xs mt-1">✓ Username available</p>
                    )}
                    {usernameStatus === "checking" && (
                      <p className="text-gray-400 text-xs mt-1">Checking...</p>
                    )}
                  </div>
                  
                  {/* Avatar Picker */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Choose your avatar</label>
                    <div className="flex flex-wrap gap-2">
                      {["⚽", "🦁", "🐉", "🦅", "🎯", "🔥", "⭐", "🏆", "👑", "🐺", "🦈", "💎"].map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setSelectedAvatar(emoji)}
                          className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition ${
                            selectedAvatar === emoji
                              ? "bg-purple-500/30 border-2 border-purple-500 scale-110"
                              : "bg-white/5 border border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
                  />
                  
                  <div>
                    <input
                      type="password"
                      placeholder="Password (min 6 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
                      minLength={6}
                    />
                  </div>
                  
                  {error && (
                    <p className="text-red-400 text-sm text-center">{error}</p>
                  )}
                  
                  <button
                    onClick={handleRegister}
                    disabled={loading || usernameStatus === "taken" || usernameStatus === "invalid"}
                    className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all disabled:opacity-50"
                  >
                    {loading ? "Creating..." : "🚀 Create Account"}
                  </button>
                </div>
                
                <div className="text-center text-gray-400 text-sm mt-6">
                  Already playing?
                </div>

                {/* Login Form */}
                <div className="space-y-4 mt-4">
                  <input
                    type="text"
                    placeholder="Username"
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
                  />
                  
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 transition"
                  />
                  
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-white bg-white/10 border border-white/20 hover:bg-white/20 transition-all disabled:opacity-50"
                  >
                    {loading ? "..." : "Login"}
                  </button>
                  
                  {/* Account recovery — enable when support email is ready */}
                </div>
              </div>

              {/* How It Works */}
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-xl font-bold text-center mb-4">📋 HOW IT WORKS</h3>
                <div className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">1.</span>
                    <span>Register with username, email & password</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">2.</span>
                    <span>Predict match results + scores</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">3.</span>
                    <div>
                      <div>Earn points:</div>
                      <div className="ml-4 mt-1 space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span>✅ Correct result:</span>
                          <span className="text-green-400 font-bold">3 pts</span>
                        </div>
                        <div className="flex justify-between">
                          <span>🎯 Correct score:</span>
                          <span className="text-green-400 font-bold">+5 bonus</span>
                        </div>
                        <div className="flex justify-between">
                          <span>⚡ Booster (2/day):</span>
                          <span className="text-purple-400 font-bold">x2 base pts</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">4.</span>
                    <span>Climb the leaderboard</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-purple-400 font-bold">5.</span>
                    <span>Beat the AI 🧠</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Leaderboard */}
            <div className="lg:col-span-2">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
                <h3 className="text-2xl font-bold text-center mb-6">🏆 GLOBAL LEADERBOARD</h3>
                
                {/* Desktop View */}
                <div className="hidden md:block">
                  <div className="grid grid-cols-6 gap-4 text-sm font-bold text-gray-400 border-b border-white/10 pb-3 mb-4">
                    <div className="text-center">#</div>
                    <div className="col-span-2">Player</div>
                    <div className="text-center">Points</div>
                    <div className="text-center">Win%</div>
                    <div className="text-center">Streak</div>
                  </div>
                  
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.username}
                      className={`grid grid-cols-6 gap-4 items-center py-3 px-3 mb-2 rounded-xl border transition-all ${
                        entry.isAI 
                          ? 'bg-cyan-500/10 border-cyan-500/30' 
                          : entry.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-center flex items-center justify-center gap-2">
                        <span className="font-bold text-gray-400">#{entry.rank}</span>
                        {entry.rank === 1 && <span className="text-lg">🥇</span>}
                        {entry.rank === 2 && <span className="text-lg">🥈</span>}
                        {entry.rank === 3 && <span className="text-lg">🥉</span>}
                      </div>
                      
                      <div className="col-span-2 flex items-center gap-2">
                        {entry.isAI && <span className="text-lg">🧠</span>}
                        <span className={`font-bold truncate ${
                          entry.isAI ? 'text-cyan-400' : 'text-white'
                        }`}>
                          {entry.username}
                        </span>
                      </div>
                      
                      <div className="text-center font-bold text-green-400">
                        {entry.totalPoints}
                      </div>
                      
                      <div className="text-center font-bold">
                        {entry.winRate}%
                      </div>
                      
                      <div className="text-center font-bold text-orange-400">
                        🔥{entry.streak}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mobile View */}
                <div className="md:hidden space-y-3">
                  {leaderboard.map((entry) => (
                    <div
                      key={entry.username}
                      className={`p-4 rounded-xl border ${
                        entry.isAI 
                          ? 'bg-cyan-500/10 border-cyan-500/30' 
                          : entry.rank <= 3
                          ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                          : 'bg-white/5 border-white/10'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-400">#{entry.rank}</span>
                          {entry.rank === 1 && <span className="text-lg">🥇</span>}
                          {entry.rank === 2 && <span className="text-lg">🥈</span>}
                          {entry.rank === 3 && <span className="text-lg">🥉</span>}
                          {entry.isAI && <span className="text-lg">🧠</span>}
                          <span className={`font-bold ${
                            entry.isAI ? 'text-cyan-400' : 'text-white'
                          }`}>
                            {entry.username}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-green-400">{entry.totalPoints} pts</div>
                          <div className="text-xs text-gray-400">🔥{entry.streak}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center mt-6 text-gray-400 text-sm">
                  Register to start competing and see your name here!
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">🎮 Predict & Compete</h1>
          <p className="text-xl text-gray-400">Predict match results, earn points, beat the AI</p>
        </div>

        {/* User Stats Bar */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="text-sm text-gray-400">Player</div>
                <div className="text-lg font-bold">{selectedAvatar} {user.username}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Points</div>
                <div className="text-lg font-bold text-green-400">🏆 {user.totalPoints}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Rank</div>
                <div className="text-lg font-bold text-purple-400">#{user.rank || 0}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Win Rate</div>
                <div className="text-lg font-bold">
                  🎯 {user.predictions > 0 ? Math.round((user.correctResults / user.predictions) * 100) : 0}%
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-400">Streak</div>
                <div className="text-lg font-bold text-orange-400">🔥 {user.currentStreak}</div>
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-400">Boosters Today</div>
              <div className="text-lg font-bold text-purple-400">⚡ {boostersRemaining}</div>
            </div>
          </div>
        </div>

        {/* Timezone indicator */}
        <div className="flex items-center justify-center gap-2 mb-4 text-xs text-gray-500">
          <span>🕐 Times shown in {getTimezoneLabel(userTz)}</span>
          <button
            onClick={() => setShowTzPicker(!showTzPicker)}
            className="text-purple-400 hover:text-purple-300 transition underline"
          >
            Change
          </button>
        </div>
        {showTzPicker && (
          <div className="max-w-sm mx-auto mb-6 bg-white/5 border border-white/10 rounded-xl p-4">
            <label className="block text-xs text-gray-400 mb-2">Select your timezone</label>
            <select
              value={userTz}
              onChange={(e) => {
                setUserTimezone(e.target.value);
                setUserTz(e.target.value);
                setShowTzPicker(false);
              }}
              className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-purple-500/50"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz.value} value={tz.value} className="bg-gray-900 text-white">
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Competition Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-2 w-fit mx-auto">
            <button
              onClick={() => setActiveTab('league')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'league'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              🏟️ LEAGUES
            </button>
            <button
              onClick={() => setActiveTab('wc2026')}
              className={`px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'wc2026'
                  ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              🏆 WORLD CUP 2026
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Predictions */}
          <div className="lg:col-span-2">
            
            {/* World Cup Tab Content */}
            {activeTab === 'wc2026' && (
              <>
                {/* Private Groups Section for WC */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
                  <h3 className="text-xl font-bold mb-6 text-purple-400">👥 Private Groups</h3>
                  
                  {/* My Groups */}
                  {userGroups.filter(g => g.competition === 'wc2026').length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-lg font-bold mb-4">My Groups</h4>
                      <div className="space-y-3">
                        {userGroups.filter(g => g.competition === 'wc2026').map((group) => (
                          <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-bold">🏆 {group.name}</div>
                                <div className="text-sm text-gray-400">{group.memberCount} members</div>
                              </div>
                              <button
                                onClick={() => handleViewGroupLeaderboard(group)}
                                className="px-4 py-2 rounded-xl text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition"
                              >
                                View Leaderboard
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Create Group */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h5 className="font-bold mb-3">🏆 Create a Private Group</h5>
                      {!showCreateGroup ? (
                        <button
                          onClick={() => setShowCreateGroup(true)}
                          className="w-full py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition"
                        >
                          Create Group
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <input
                            type="text"
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCreateGroup}
                              disabled={groupsLoading}
                              className="flex-1 py-2 rounded-xl bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition disabled:opacity-50"
                            >
                              {groupsLoading ? "Creating..." : "Create"}
                            </button>
                            <button
                              onClick={() => setShowCreateGroup(false)}
                              className="px-4 py-2 rounded-xl bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {createdGroupCode && (
                        <div className="mt-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                          <div className="text-center">
                            <div className="text-sm text-green-400 mb-2">✅ Created! Share this code:</div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 text-center font-mono text-xl font-bold bg-white/5 py-2 rounded-xl">
                                {createdGroupCode}
                              </div>
                              <button
                                onClick={() => copyToClipboard(createdGroupCode)}
                                className="px-3 py-2 rounded-xl bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                              >
                                Copy
                              </button>
                            </div>
                            <button
                              onClick={() => copyToClipboard(`${window.location.origin}/predict?join=${createdGroupCode}`)}
                              className="mt-2 text-xs text-green-400 underline hover:text-green-300"
                            >
                              Copy share link: kickscan.io/predict?join={createdGroupCode}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Join Group */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                      <h5 className="font-bold mb-3">🤝 Join a Group</h5>
                      <div className="space-y-3">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={joinGroupCode}
                          onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 text-center font-mono"
                        />
                        <button
                          onClick={() => handleJoinGroup()}
                          disabled={groupsLoading}
                          className="w-full py-2 rounded-xl bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition disabled:opacity-50"
                        >
                          {groupsLoading ? "Joining..." : "Join Group"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WC Matches */}
                <h2 className="text-2xl font-bold mb-6 text-purple-400">🏆 World Cup 2026 Group Matches</h2>
                <div className="space-y-4 mb-8">
                  {allMatches.slice(0, 8).map((match) => (
                    <MatchCard
                      key={`wc_${match.id}`}
                      matchId={`wc_${match.id}`}
                      home={match.home}
                      away={match.away}
                      homeFlag={match.homeFlag}
                      awayFlag={match.awayFlag}
                      date={formatDateTime(getKickoffISO(match.date, match.time), userTz)}
                      time=""
                      league="World Cup 2026"
                      prediction={predictions[`wc_${match.id}`]}
                      boostersRemaining={boostersRemaining}
                      onPredict={handlePrediction}
                      kickoffISO={getKickoffISO(match.date, match.time)}
                    />
                  ))}
                </div>
              </>
            )}

            {/* League Tab Content */}
            {activeTab === 'league' && (
              <>
                <h2 className="text-2xl font-bold mb-6 text-green-400">⚽ League Matches</h2>
                {!loadingMatches && leagueMatches.length > 0 && (
                  <div className="space-y-4 mb-8">
                    {leagueMatches.slice(0, 10).map((match) => (
                      <MatchCard
                        key={`league_${match.id}`}
                        matchId={`league_${match.id}`}
                        home={match.homeName}
                        away={match.awayName}
                        homeFlag={match.homeLogo || ""}
                        awayFlag={match.awayLogo || ""}
                        date={formatDateTime(match.date, userTz)}
                        time=""
                        league={match.leagueName}
                        leagueFlag={match.leagueFlag}
                        prediction={predictions[`league_${match.id}`]}
                        boostersRemaining={boostersRemaining}
                        onPredict={handlePrediction}
                        kickoffISO={match.date}
                        liveScore={liveScores[`league_${match.id}`] || null}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Leaderboard & Rules */}
          <div>
            {/* Points System */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
              <h3 className="text-lg font-bold mb-4">🎯 How Points Work</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span>✅ Correct result:</span>
                  <span className="text-green-400 font-bold">3 pts</span>
                </div>
                <div className="flex justify-between">
                  <span>🎯 Correct score:</span>
                  <span className="text-green-400 font-bold">+5 bonus</span>
                </div>
                <div className="flex justify-between">
                  <span>❌ Wrong:</span>
                  <span className="text-gray-400 font-bold">0 pts</span>
                </div>
                <hr className="border-white/10" />
                <div className="text-center">
                  <p className="text-purple-400 font-bold">⚡ DAILY BOOSTER (×2)</p>
                  <p className="text-xs text-gray-400 mt-1">
                    2 per day • doubles base pts<br />
                    Does NOT apply to score bonus<br />
                    Use wisely — pick your best!
                  </p>
                </div>
              </div>
            </div>

            {/* Leaderboard */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-4">
                {activeTab === 'league' ? '🏟️ Season Leaderboard' : '🏆 WC 2026 Leaderboard'}
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {leaderboard.map((entry) => (
                  <div
                    key={entry.username}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm ${
                      entry.isAI 
                        ? 'bg-cyan-500/10 border-cyan-500/30' 
                        : entry.username === user.username
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-400">#{entry.rank}</span>
                      {entry.rank === 1 && <span>🥇</span>}
                      {entry.rank === 2 && <span>🥈</span>}
                      {entry.rank === 3 && <span>🥉</span>}
                      {entry.isAI && <span>🧠</span>}
                      <span className={`font-bold truncate ${
                        entry.isAI ? 'text-cyan-400' : 
                        entry.username === user.username ? 'text-purple-400' : 'text-white'
                      }`}>
                        {entry.username}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-green-400">{entry.totalPoints}</div>
                      <div className="text-xs text-gray-400">
                        {entry.winRate}% • 🔥{entry.streak}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* My Groups section for WC tab */}
              {activeTab === 'wc2026' && userGroups.filter(g => g.competition === 'wc2026').length > 0 && (
                <>
                  <hr className="border-white/10 my-6" />
                  <div>
                    <h4 className="text-lg font-bold mb-4">👥 My Groups</h4>
                    <div className="space-y-2">
                      {userGroups.filter(g => g.competition === 'wc2026').map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-sm"
                        >
                          <div>
                            <div className="font-bold">{group.name}</div>
                            <div className="text-xs text-gray-400">{group.memberCount} members</div>
                          </div>
                          <button
                            onClick={() => handleViewGroupLeaderboard(group)}
                            className="px-3 py-1 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition text-xs"
                          >
                            View
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Group Leaderboard Modal */}
        {selectedGroup && selectedGroupLeaderboard.length > 0 && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-[#06060f] border border-white/20 rounded-2xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold">🏆 {selectedGroup.name}</h3>
                  <div className="text-sm text-gray-400">
                    Code: {selectedGroup.code} | {selectedGroup.memberCount} members
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedGroup(null);
                    setSelectedGroupLeaderboard([]);
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>
              
              <div className="space-y-3">
                {selectedGroupLeaderboard.map((member, index) => (
                  <div
                    key={member.userId}
                    className={`flex items-center justify-between p-3 rounded-xl border ${
                      member.username === user.username
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-400">#{index + 1}</span>
                      {index === 0 && <span>🥇</span>}
                      {index === 1 && <span>🥈</span>}
                      {index === 2 && <span>🥉</span>}
                      <span className={`font-bold ${
                        member.username === user.username ? 'text-purple-400' : 'text-white'
                      }`}>
                        {member.username}
                        {member.username === user.username && <span className="text-xs ml-2">← you</span>}
                      </span>
                    </div>
                    <div className="font-bold text-green-400">{member.points} pts</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

interface MatchCardProps {
  matchId: string;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  date: string;
  time: string;
  league: string;
  leagueFlag?: string;
  prediction?: Prediction;
  boostersRemaining: number;
  onPredict: (matchId: string, result: "home" | "draw" | "away", score: string, useBooster: boolean) => void;
  kickoffISO?: string; // ISO date string for lock logic
  liveScore?: { home: number; away: number; minute: number; status: string } | null;
}

function MatchCard({ 
  matchId, 
  home, 
  away, 
  homeFlag, 
  awayFlag, 
  date, 
  time, 
  league, 
  leagueFlag,
  prediction, 
  boostersRemaining,
  onPredict,
  kickoffISO,
  liveScore
}: MatchCardProps) {
  const [selectedResult, setSelectedResult] = useState<"home" | "draw" | "away">(
    prediction?.predicted_result || "home"
  );
  const [homeScore, setHomeScore] = useState<string>(
    prediction?.predicted_score.split('-')[0] || "2"
  );
  const [awayScore, setAwayScore] = useState<string>(
    prediction?.predicted_score.split('-')[1] || "1"
  );
  const [useBooster, setUseBooster] = useState<boolean>(prediction?.boosted || false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [now, setNow] = useState<number>(Date.now());

  // Update clock every 30s for lock countdown
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Lock logic
  const kickoffMs = kickoffISO ? new Date(kickoffISO).getTime() : 0;
  const LOCK_BEFORE_MS = 5 * 60 * 1000; // 5 minutes
  const isLocked = kickoffISO ? now >= kickoffMs - LOCK_BEFORE_MS : false;
  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'];
  const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
  const isLive = liveScore !== null && liveScore !== undefined && LIVE_STATUSES.includes(liveScore.status);
  const isFinished = liveScore !== null && liveScore !== undefined && FINISHED_STATUSES.includes(liveScore.status);
  const isStarted = kickoffISO ? now >= kickoffMs : false;
  const minutesToLock = kickoffISO ? Math.max(0, Math.ceil((kickoffMs - LOCK_BEFORE_MS - now) / 60000)) : null;

  const handleSubmit = async () => {
    const score = `${homeScore}-${awayScore}`;
    
    if (useBooster && boostersRemaining === 0) {
      alert("No boosters remaining today!");
      return;
    }
    
    setIsSubmitting(true);
    await onPredict(matchId, selectedResult, score, useBooster);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
      {/* Match Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {leagueFlag && <span className="text-sm">{leagueFlag}</span>}
          <span className="text-sm text-gray-400 font-bold">{league}</span>
        </div>
        <span className="text-sm text-gray-500">{date} {time}</span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-center flex-1">
          <div className="text-2xl mb-2">
            {homeFlag.startsWith('http') ? (
              <img src={homeFlag} alt="" className="w-8 h-8 mx-auto" />
            ) : (
              homeFlag
            )}
          </div>
          <div className="text-sm font-medium text-white">{home}</div>
        </div>
        <div className="text-xs text-gray-500 font-bold px-3">VS</div>
        <div className="text-center flex-1">
          <div className="text-2xl mb-2">
            {awayFlag.startsWith('http') ? (
              <img src={awayFlag} alt="" className="w-8 h-8 mx-auto" />
            ) : (
              awayFlag
            )}
          </div>
          <div className="text-sm font-medium text-white">{away}</div>
        </div>
      </div>

      {/* Live / Finished / Started Match Card — shown after kickoff */}
      {(isStarted || isLive || isFinished) && prediction ? (
        <div className="space-y-4">
          <div className={`${isFinished ? 'bg-gray-500/10 border-gray-500/30' : 'bg-amber-500/10 border-amber-500/30'} border rounded-xl p-4 text-center`}>
            <div className={`text-xs font-bold uppercase tracking-wider mb-2 ${isFinished ? 'text-gray-400' : 'text-amber-400'}`}>
              {isFinished ? '✅ Match Finished' : '🔒 Prediction Locked'}
            </div>
            <div className="flex items-center justify-center gap-4 mb-3">
              <div className="text-center">
                <div className="text-sm text-gray-400">{home}</div>
              </div>
              {(isLive || isFinished) && liveScore ? (
                <div className="text-center">
                  <div className="text-2xl font-black text-white">{liveScore.home} - {liveScore.away}</div>
                  {isLive && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                      <span className="text-xs text-green-400 font-bold">{liveScore.minute}&apos; {liveScore.status}</span>
                    </div>
                  )}
                  {isFinished && (
                    <div className="text-xs text-gray-400 mt-1 font-bold">FT</div>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-400">vs</div>
                  <div className="text-xs text-gray-500">Awaiting live data</div>
                </div>
              )}
              <div className="text-center">
                <div className="text-sm text-gray-400">{away}</div>
              </div>
            </div>
            <div className="bg-white/5 rounded-lg p-3 space-y-1">
              <div className="text-sm text-white font-bold">
                Your prediction: {
                  prediction.predicted_result === "home" ? `${home} Win` :
                  prediction.predicted_result === "away" ? `${away} Win` : "Draw"
                } — {prediction.predicted_score}
              </div>
              {prediction.boosted && <div className="text-xs text-purple-400">⚡ Booster active</div>}
              {isFinished && liveScore && (
                <div className={`text-xs font-bold mt-1 ${
                  // Check if prediction was correct
                  (() => {
                    const actualHome = liveScore.home;
                    const actualAway = liveScore.away;
                    const predResult = prediction.predicted_result;
                    const actualResult = actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw';
                    return predResult === actualResult;
                  })() ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(() => {
                    const actualHome = liveScore.home;
                    const actualAway = liveScore.away;
                    const predResult = prediction.predicted_result;
                    const actualResult = actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw';
                    const predScore = prediction.predicted_score;
                    const actualScore = `${actualHome}-${actualAway}`;
                    if (predScore === actualScore) return '🎯 Exact score! +8 pts';
                    if (predResult === actualResult) return '✅ Correct result! +3 pts';
                    return '❌ Wrong prediction';
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (isStarted || isLive || isFinished) && !prediction ? (
        <div className="text-center py-4">
          <div className={`font-bold text-sm ${isFinished ? 'text-gray-400' : 'text-amber-400'}`}>
            {isFinished ? '⏹️ Match finished — no prediction submitted' : '🔒 Match started — predictions closed'}
          </div>
          <div className="text-xs text-gray-500 mt-1">You didn&apos;t submit a prediction for this match</div>
        </div>
      ) : isLocked && !isStarted ? (
        /* Locked but not started — within 5 min of kickoff */
        <div className="space-y-4">
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 text-center">
            <div className="text-sm font-bold text-amber-400">🔒 Prediction locked — match starts soon</div>
            <div className="text-xs text-gray-400 mt-1">Predictions lock 5 minutes before kickoff</div>
          </div>
          {prediction && (
            <div className="text-center text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                ✅ Your prediction: {
                  prediction.predicted_result === "home" ? `${home} Win` :
                  prediction.predicted_result === "away" ? `${away} Win` : "Draw"
                } {prediction.predicted_score}
                {prediction.boosted && <span>⚡</span>}
              </span>
            </div>
          )}
        </div>
      ) : (
        /* Normal editable state */
        <div className="space-y-4">
          {/* Lock countdown */}
          {minutesToLock !== null && minutesToLock <= 60 && minutesToLock > 0 && (
            <div className="text-center text-xs text-amber-400">
              ⏱️ Prediction locks in {minutesToLock} min
            </div>
          )}

          {/* Result Prediction */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Predict Result:</label>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedResult("home")}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition ${
                  selectedResult === "home"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                Home Win
              </button>
              <button
                onClick={() => setSelectedResult("draw")}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition ${
                  selectedResult === "draw"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                Draw
              </button>
              <button
                onClick={() => setSelectedResult("away")}
                className={`flex-1 py-2 px-3 rounded-xl text-sm font-bold transition ${
                  selectedResult === "away"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "bg-white/5 text-gray-300 hover:bg-white/10"
                }`}
              >
                Away Win
              </button>
            </div>
          </div>

          {/* Score Prediction */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Predict Score:</label>
            <div className="flex items-center gap-2 justify-center">
              <input
                type="number"
                min="0"
                max="9"
                value={homeScore}
                onChange={(e) => setHomeScore(e.target.value)}
                className="w-16 h-12 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
              <span className="text-xl font-bold text-gray-400">-</span>
              <input
                type="number"
                min="0"
                max="9"
                value={awayScore}
                onChange={(e) => setAwayScore(e.target.value)}
                className="w-16 h-12 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          {/* Booster Toggle */}
          <div className="flex items-center justify-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useBooster}
                onChange={(e) => setUseBooster(e.target.checked)}
                disabled={boostersRemaining === 0}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                useBooster 
                  ? "bg-purple-500 border-purple-500" 
                  : "border-gray-400 hover:border-purple-400"
              } ${boostersRemaining === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
                {useBooster && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={`text-sm font-medium transition ${
                useBooster ? "text-purple-400" : "text-gray-300"
              } ${boostersRemaining === 0 ? "opacity-50" : ""}`}>
                ⚡ Use Booster {boostersRemaining === 0 ? "(None left)" : `(${boostersRemaining} left)`}
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all disabled:opacity-50"
          >
            {isSubmitting ? "Saving..." : (prediction ? "Update Prediction" : "Submit Prediction")}
          </button>

          {/* Current Prediction Display */}
          {prediction && (
            <div className="text-center text-sm space-y-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-400 rounded-full border border-green-500/30">
                ✅ Your prediction: {
                  prediction.predicted_result === "home" ? `${home} Win` :
                  prediction.predicted_result === "away" ? `${away} Win` : "Draw"
                } {prediction.predicted_score}
                {prediction.boosted && <span>⚡</span>}
              </span>
              <div className="text-xs text-gray-500">
                Can be changed until 5 min before kickoff
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="min-h-screen bg-[#06060f] flex items-center justify-center text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-6">Please try refreshing the page</p>
        <a href="/predict" className="px-6 py-3 bg-purple-600 rounded-xl text-white font-bold">Refresh</a>
      </div>
    </div>
  );
}

function PredictPageSkeleton() {
  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header Skeleton */}
        <div className="text-center mb-12">
          <div className="h-12 bg-white/10 rounded-xl w-80 mx-auto mb-4 animate-pulse"></div>
          <div className="h-6 bg-white/5 rounded-lg w-64 mx-auto animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column Skeleton */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8">
              <div className="h-8 bg-white/10 rounded-lg mb-6 animate-pulse"></div>
              <div className="space-y-4">
                {[1,2,3].map(i => (
                  <div key={i} className="h-12 bg-white/5 rounded-xl animate-pulse"></div>
                ))}
                <div className="h-12 bg-white/10 rounded-xl animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Right Column Skeleton */}
          <div className="lg:col-span-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="h-8 bg-white/10 rounded-lg mb-6 animate-pulse"></div>
              <div className="space-y-4">
                {[1,2,3,4,5].map(i => (
                  <div key={i} className="h-24 bg-white/5 rounded-xl animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function PredictPage() {
  return (
    <Suspense fallback={<PredictPageSkeleton />}>
      <PredictPageContent />
    </Suspense>
  );
}