"use client";
import { useEffect, useState, Suspense } from "react";
import { allMatches, getKickoffISO } from "@/data/matches";
import { getUserTimezone, formatDateTime, getTimezoneLabel, setUserTimezone, TIMEZONE_OPTIONS } from "@/lib/timezone";
import { useSearchParams, useRouter } from 'next/navigation';

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

interface AvgOdds {
  home: number;
  draw: number;
  away: number;
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
  avgOdds?: AvgOdds | null;
  recommendation?: string;
  pick?: string;
  confidencePct?: number;
  matchStatus?: string;
  liveScore?: { home: number; away: number; minute: number; status: string } | null;
}

interface MatchSignals {
  aiPick?: string;
  aiConfidence?: number;
  aiVerdict?: string; // BET/LEAN/SKIP/AVOID
  marketFavorite?: string;
  fanVote?: { home: number; draw: number; away: number };
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
  const router = useRouter();
  const goToProfile = (username: string, isAI: boolean) => {
    router.push(`/profile/${isAI ? 'kickscan_ai' : encodeURIComponent(username)}`);
  };

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
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [usernameStatus, setUsernameStatus] = useState<string>(""); // "", "checking", "available", "taken", "invalid"
  const [emailError, setEmailError] = useState<string>("");
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
  const [userTz, setUserTz] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      try { return getUserTimezone(); } catch { return "America/New_York"; }
    }
    return "America/New_York";
  });
  const [showTzPicker, setShowTzPicker] = useState(false);

  // Live scores for match cards
  const [liveScores, setLiveScores] = useState<Record<string, { home: number; away: number; minute: number; status: string }>>({});

  // Pending picks modal
  const [showPicksModal, setShowPicksModal] = useState(false);
  const [pendingPicks, setPendingPicks] = useState<any[]>([]);
  const [loadingPicks, setLoadingPicks] = useState(false);
  const [cancellingPick, setCancellingPick] = useState<string | null>(null);

  // Initialize timezone
  useEffect(() => {
    setUserTz(getUserTimezone());
    const handleTzChange = () => setUserTz(getUserTimezone());
    window.addEventListener("kickscan_tz_change", handleTzChange);
    return () => window.removeEventListener("kickscan_tz_change", handleTzChange);
  }, []);

  // Scroll to #leaderboard anchor on mount (for nav link)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#leaderboard') {
      // Retry scroll until element exists (handles async render)
      const scrollToLeaderboard = () => {
        const el = document.getElementById('leaderboard');
        if (el) {
          el.scrollIntoView({ behavior: 'instant', block: 'start' });
          return true;
        }
        return false;
      };
      // Try immediately, then retry a few times
      if (!scrollToLeaderboard()) {
        const retries = [100, 300, 600, 1000];
        retries.forEach((ms) => {
          setTimeout(scrollToLeaderboard, ms);
        });
      }
    }
  }, []);

  // Username validation with debounce
  useEffect(() => {
    if (!username.trim()) {
      setUsernameStatus("");
      return;
    }

    const normalized = username.trim().replace(/\s+/g, ' ');
    const isValid = /^[a-zA-Z0-9_ ]{3,20}$/.test(normalized) && normalized.length >= 3;
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
          validateSession(userData.id, userData.token).finally(() => setAuthChecking(false));
          if (userData.avatar) setSelectedAvatar(userData.avatar);
        } else {
          setAuthChecking(false);
        }
      } catch (err) {
        localStorage.removeItem("kickscan_user");
        setAuthChecking(false);
      }
    } else {
      setAuthChecking(false);
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

    const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
    let lastHadFinished = false;

    const triggerSettlement = () => {
      fetch('/api/settle', { cache: 'no-store' })
        .then(() => {
          // Refresh user data after settlement to update points
          const saved = localStorage.getItem("kickscan_user");
          if (saved) {
            try {
              const d = JSON.parse(saved);
              if (d.id && d.token) validateSession(d.id, d.token);
            } catch {}
          }
        })
        .catch(() => {});
    };

    const fetchLiveScores = async () => {
      try {
        const response = await fetch('/api/livescores', { cache: 'no-store' });
        const data = await response.json();
        if (data.matches && Array.isArray(data.matches)) {
          const scores: Record<string, { home: number; away: number; minute: number; status: string }> = {};
          let hasFinished = false;
          for (const m of data.matches) {
            const status = m.status || '';
            scores[`league_${m.fixtureId}`] = {
              home: m.homeGoals ?? 0,
              away: m.awayGoals ?? 0,
              minute: m.minute ?? 0,
              status
            };
            if (FINISHED_STATUSES.includes(status)) hasFinished = true;
          }
          setLiveScores(scores);

          // Auto-trigger settlement when we first detect finished matches
          if (hasFinished && !lastHadFinished) {
            triggerSettlement();
          }
          lastHadFinished = hasFinished;
        }
      } catch (err) {
        // Silently fail — live scores are enhancement only
      }
    };

    fetchLiveScores();
    const interval = setInterval(fetchLiveScores, 30000);

    // Settlement polling — check for finished matches every 2 min (was 5 min)
    triggerSettlement();
    const settleInterval = setInterval(triggerSettlement, 120000);

    return () => {
      clearInterval(interval);
      clearInterval(settleInterval);
    };
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

  const handleLeaveGroup = async (groupId: string, groupName: string) => {
    if (!confirm(`Are you sure you want to leave "${groupName}"? You'll lose access to this group's leaderboard.`)) {
      return;
    }

    setGroupsLoading(true);
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave',
          userId,
          groupId
        })
      });

      const data = await response.json();
      if (data.success) {
        setUserGroups(prev => prev.filter(g => g.id !== groupId));
        if (selectedGroup?.id === groupId) {
          setSelectedGroup(null);
          setSelectedGroupLeaderboard([]);
        }
      } else {
        alert(data.error || "Failed to leave group");
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

  const openPicksModal = async () => {
    setShowPicksModal(true);
    setLoadingPicks(true);
    try {
      const response = await fetch(`/api/predictions?userId=${userId}&limit=30`);
      const data = await response.json();
      if (data.predictions) {
        // Show unsettled (pending) first, then settled
        const sorted = data.predictions.sort((a: any, b: any) => {
          if (a.settled !== b.settled) return a.settled ? 1 : -1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        setPendingPicks(sorted);
      }
    } catch {
      setPendingPicks([]);
    } finally {
      setLoadingPicks(false);
    }
  };

  const cancelPick = async (matchId: string) => {
    if (!confirm("Cancel this prediction? This cannot be undone.")) return;
    setCancellingPick(matchId);
    try {
      const response = await fetch('/api/predict', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, token, matchId })
      });
      const data = await response.json();
      if (data.success) {
        // Remove from local list
        setPendingPicks(prev => prev.filter(p => p.match_id !== matchId));
        // Remove from predictions state
        setPredictions(prev => {
          const next = { ...prev };
          delete next[matchId];
          return next;
        });
        // Refresh user data
        validateSession(userId, token);
        if (data.boosterRefunded) {
          setBoostersRemaining(prev => Math.min(prev + 1, 2));
        }
      } else {
        alert(data.error || "Failed to cancel prediction");
      }
    } catch {
      alert("Network error. Please try again.");
    } finally {
      setCancellingPick(null);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setEmailError("Please enter a valid email (e.g. name@email.com)");
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

  const handlePrediction = async (matchId: string, result: "home" | "draw" | "away", score: string, useBooster: boolean = false, homeTeam?: string, awayTeam?: string) => {
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
          useBooster,
          homeTeam,
          awayTeam
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

  // Show skeleton while checking auth — prevents guest UI flash for logged-in users
  if (authChecking) {
    return (
      <main className="min-h-screen bg-[#06060f] text-white">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <div className="h-12 bg-white/10 rounded-xl w-80 mx-auto mb-4 animate-pulse" />
            <div className="h-6 bg-white/5 rounded-lg w-64 mx-auto animate-pulse" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 h-64 animate-pulse" />
            </div>
            <div className="lg:col-span-2">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-96 animate-pulse" />
            </div>
          </div>
        </div>
      </main>
    );
  }

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
                      <p className="text-red-400 text-xs mt-1">3-20 characters. Letters, numbers, spaces & underscores.</p>
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

                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError("");
                      }}
                      onBlur={() => {
                        const trimmed = email.trim();
                        if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
                          setEmailError("Please enter a valid email (e.g. name@email.com)");
                        } else {
                          setEmailError("");
                        }
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-white/5 border text-white placeholder-gray-500 focus:outline-none transition ${
                        emailError
                          ? "border-red-500/50 focus:border-red-500/70"
                          : "border-white/10 focus:border-purple-500/50"
                      }`}
                    />
                    {emailError && (
                      <p className="text-red-400 text-xs mt-1">{emailError}</p>
                    )}
                  </div>
                  
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
                    disabled={loading || usernameStatus === "taken" || usernameStatus === "invalid" || !!emailError}
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
            <div className="lg:col-span-2" id="leaderboard">
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
                      onClick={() => goToProfile(entry.username, entry.isAI)}
                      className={`grid grid-cols-6 gap-4 items-center py-3 px-3 mb-2 rounded-xl border transition-all cursor-pointer ${
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
                      onClick={() => goToProfile(entry.username, entry.isAI)}
                      className={`p-4 rounded-xl border cursor-pointer ${
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
        {/* Header — compact on mobile */}
        <div className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-1">🎮 Predict & Compete</h1>
          <p className="text-sm md:text-xl text-gray-400">Predict match results, earn points, beat the AI</p>
        </div>

        {/* User Stats Bar — premium layout */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 mb-6">
          {/* Player name + timezone — single row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedAvatar}</span>
              <div>
                <div className="text-sm font-bold text-white">{user.username}</div>
                <div className="text-[10px] text-gray-500">Rank #{user.rank || 0}</div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-gray-500 bg-white/5 px-2 py-1 rounded-lg">
              <span>🕐 {getTimezoneLabel(userTz)}</span>
              <button
                onClick={() => setShowTzPicker(!showTzPicker)}
                className="text-purple-400 hover:text-purple-300 transition"
              >
                ✎
              </button>
            </div>
          </div>
          {/* Stats grid — 2 rows of 3 on mobile, 1 row of 7 on desktop */}
          <div className="grid grid-cols-3 md:grid-cols-7 gap-3 md:gap-4">
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <div className="text-lg md:text-xl font-bold text-green-400">{user.totalPoints}</div>
              <div className="text-[10px] md:text-xs text-gray-500">Points</div>
            </div>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <div className="text-lg md:text-xl font-bold text-white">
                {user.predictions > 0 ? Math.round((user.correctResults / user.predictions) * 100) : 0}%
              </div>
              <div className="text-[10px] md:text-xs text-gray-500">Win Rate</div>
            </div>
            <button onClick={openPicksModal} className="text-center bg-white/[0.03] rounded-xl py-2 cursor-pointer hover:bg-white/[0.06] transition">
              <div className="text-lg md:text-xl font-bold text-blue-400">{user.predictions}</div>
              <div className="text-[10px] md:text-xs text-gray-500">Picks ›</div>
            </button>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <div className="text-lg md:text-xl font-bold text-orange-400">🔥{user.currentStreak}</div>
              <div className="text-[10px] md:text-xs text-gray-500">Streak</div>
            </div>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <div className="text-lg md:text-xl font-bold text-purple-400">{boostersRemaining}</div>
              <div className="text-[10px] md:text-xs text-gray-500">Boosters</div>
            </div>
            <div className="text-center bg-white/[0.03] rounded-xl py-2">
              <div className="text-lg md:text-xl font-bold text-cyan-400">{userGroups.length}</div>
              <div className="text-[10px] md:text-xs text-gray-500">Groups</div>
            </div>
            <div className="text-center hidden md:block bg-white/[0.03] rounded-xl py-2">
              <div className="text-lg md:text-xl font-bold text-gray-300">{user.bestStreak}</div>
              <div className="text-[10px] md:text-xs text-gray-500">Best Streak</div>
            </div>
          </div>
        </div>

        {/* Timezone picker (expandable) */}
        {showTzPicker && (
          <div className="max-w-sm mx-auto mb-4 bg-white/5 border border-white/10 rounded-xl p-3">
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

        {/* Competition Tabs — compact on mobile */}
        <div className="mb-5">
          <div className="flex gap-1.5 bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-1.5 w-fit mx-auto">
            <button
              onClick={() => setActiveTab('league')}
              className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                activeTab === 'league'
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'text-gray-300 hover:bg-white/10'
              }`}
            >
              🏟️ LEAGUES
            </button>
            <button
              onClick={() => setActiveTab('wc2026')}
              className={`px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
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
                              <div className="cursor-pointer flex-1" onClick={() => handleViewGroupLeaderboard(group)}>
                                <div className="font-bold">🏆 {group.name}</div>
                                <div className="text-sm text-gray-400">{group.memberCount} members</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewGroupLeaderboard(group)}
                                  className="px-4 py-2 rounded-xl text-sm bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleLeaveGroup(group.id, group.name)}
                                  className="px-3 py-2 rounded-xl text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                >
                                  Leave
                                </button>
                              </div>
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
                      key={`wc_${match.id}_${userTz}`}
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
                {/* Private Groups for League */}
                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 mb-6">
                  <h3 className="text-lg font-bold mb-4 text-green-400">👥 League Private Groups</h3>
                  
                  {/* My League Groups */}
                  {userGroups.filter(g => g.competition === 'league').length > 0 && (
                    <div className="mb-4">
                      <div className="space-y-2">
                        {userGroups.filter(g => g.competition === 'league').map((group) => (
                          <div key={group.id} className="bg-white/5 border border-white/10 rounded-xl p-3">
                            <div className="flex items-center justify-between">
                              <div className="cursor-pointer flex-1" onClick={() => handleViewGroupLeaderboard(group)}>
                                <div className="font-bold text-sm">🏟️ {group.name}</div>
                                <div className="text-xs text-gray-500">{group.memberCount} members</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => handleViewGroupLeaderboard(group)}
                                  className="px-3 py-1.5 rounded-lg text-xs bg-green-500/20 text-green-400 hover:bg-green-500/30 transition"
                                >
                                  View
                                </button>
                                <button
                                  onClick={() => handleLeaveGroup(group.id, group.name)}
                                  className="px-2.5 py-1.5 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
                                >
                                  Leave
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-3">
                    {/* Create League Group */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <h5 className="font-bold text-sm mb-2">🏟️ Create League Group</h5>
                      {!showCreateGroup || activeTab !== 'league' ? (
                        <button
                          onClick={() => { setShowCreateGroup(true); setActiveTab('league'); }}
                          className="w-full py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition text-sm"
                        >
                          Create Group
                        </button>
                      ) : (
                        <div className="space-y-2">
                          <input
                            type="text"
                            placeholder="Group Name"
                            value={newGroupName}
                            onChange={(e) => setNewGroupName(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 text-sm"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={handleCreateGroup}
                              disabled={groupsLoading}
                              className="flex-1 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition disabled:opacity-50 text-sm"
                            >
                              {groupsLoading ? "Creating..." : "Create"}
                            </button>
                            <button
                              onClick={() => setShowCreateGroup(false)}
                              className="px-3 py-2 rounded-lg bg-gray-500/20 text-gray-400 hover:bg-gray-500/30 transition text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Created code display for league */}
                    {createdGroupCode && activeTab === 'league' && (
                      <div className="md:col-span-2 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
                        <div className="text-center">
                          <div className="text-sm text-green-400 mb-2">✅ Group created! Share this code:</div>
                          <div className="flex items-center justify-center gap-2">
                            <div className="font-mono text-xl font-bold bg-white/5 py-2 px-6 rounded-xl">
                              {createdGroupCode}
                            </div>
                            <button
                              onClick={() => copyToClipboard(createdGroupCode)}
                              className="px-3 py-2 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition text-sm"
                            >
                              Copy
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Join League Group */}
                    <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                      <h5 className="font-bold text-sm mb-2">🤝 Join a League Group</h5>
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={joinGroupCode}
                          onChange={(e) => setJoinGroupCode(e.target.value.toUpperCase())}
                          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:outline-none focus:border-green-500/50 text-center font-mono text-sm"
                        />
                        <button
                          onClick={() => handleJoinGroup()}
                          disabled={groupsLoading}
                          className="w-full py-2 rounded-lg bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition disabled:opacity-50 text-sm"
                        >
                          {groupsLoading ? "Joining..." : "Join Group"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-6 text-green-400">⚽ League Matches</h2>
                {!loadingMatches && leagueMatches.length > 0 && (() => {
                  const LIVE_STATUSES = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'];
                  const FINISHED_STATUSES = ['FT', 'AET', 'PEN'];
                  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
                  const nowMs = Date.now();

                  const getMatchLiveScore = (match: LeagueMatch) =>
                    liveScores[`league_${match.id}`] || match.liveScore || null;

                  const liveMatches = leagueMatches.filter((m) => {
                    const ls = getMatchLiveScore(m);
                    return ls && LIVE_STATUSES.includes(ls.status);
                  });

                  const finishedMatches = leagueMatches.filter((m) => {
                    const ls = getMatchLiveScore(m);
                    if (!ls || !FINISHED_STATUSES.includes(ls.status)) return false;
                    // Keep visible for 12 hours after kickoff
                    const kickoff = new Date(m.date).getTime();
                    return nowMs - kickoff < TWELVE_HOURS;
                  });

                  const upcomingMatches = leagueMatches.filter((m) => {
                    const ls = getMatchLiveScore(m);
                    const isLive = ls && LIVE_STATUSES.includes(ls.status);
                    const isFinished = ls && FINISHED_STATUSES.includes(ls.status);
                    return !isLive && !isFinished;
                  });

                  const renderMatchCard = (match: LeagueMatch) => (
                    <MatchCard
                      key={`league_${match.id}_${userTz}`}
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
                      liveScore={getMatchLiveScore(match)}
                      avgOdds={match.avgOdds || null}
                      signals={(() => {
                        const s: MatchSignals = {};
                        if (match.pick) { s.aiPick = match.pick; }
                        if (match.confidencePct) { s.aiConfidence = match.confidencePct; }
                        if (match.recommendation) { s.aiVerdict = match.recommendation; }
                        if (match.avgOdds) {
                          const o = match.avgOdds;
                          s.marketFavorite = o.home < o.away ? `${match.homeName} Win` : o.away < o.home ? `${match.awayName} Win` : "Even";
                        }
                        return Object.keys(s).length > 0 ? s : null;
                      })()}
                    />
                  );

                  return (
                    <div className="space-y-6 mb-8">
                      {/* Live Matches */}
                      {liveMatches.length > 0 && (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span></span>
                            <h3 className="text-lg font-bold text-green-400">LIVE NOW</h3>
                          </div>
                          <div className="space-y-4">
                            {liveMatches.map(renderMatchCard)}
                          </div>
                        </div>
                      )}

                      {/* Upcoming Matches */}
                      {upcomingMatches.length > 0 && (
                        <div>
                          {liveMatches.length > 0 && (
                            <h3 className="text-lg font-bold text-gray-300 mb-3">📅 Upcoming</h3>
                          )}
                          <div className="space-y-4">
                            {upcomingMatches.slice(0, 10).map(renderMatchCard)}
                          </div>
                        </div>
                      )}

                      {/* Finished Matches — visible for 12h */}
                      {finishedMatches.length > 0 && (
                        <div>
                          <h3 className="text-lg font-bold text-gray-400 mb-3">✅ Recent Results</h3>
                          <div className="space-y-4">
                            {finishedMatches.map(renderMatchCard)}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
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
            <div id="leaderboard" className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-1">
                {activeTab === 'league' ? '🌐 Global Leaderboard' : '🏆 World Cup 2026'}
              </h3>
              <p className="text-[10px] text-gray-500 mb-4">
                {activeTab === 'league' ? 'All competitions combined' : 'Tournament starts June 11 — register now to secure your spot'}
              </p>
              <div className="space-y-2">
                {leaderboard.slice(0, 10).map((entry) => (
                  <div
                    key={entry.username}
                    onClick={() => goToProfile(entry.username, entry.isAI)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-sm cursor-pointer hover:bg-white/[0.06] ${
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
              <a
                href="/leaderboard"
                className="block text-center mt-3 text-xs text-purple-400 hover:text-purple-300 transition font-medium"
              >
                View Full Leaderboard →
              </a>

              {/* My Groups section — shows groups matching current tab */}
              {userGroups.filter(g => g.competition === activeTab || (activeTab === 'league' && g.competition === 'league') || (activeTab === 'wc2026' && g.competition === 'wc2026')).length > 0 && (
                <>
                  <hr className="border-white/10 my-6" />
                  <div>
                    <h4 className="text-lg font-bold mb-4">👥 My Groups</h4>
                    <div className="space-y-2">
                      {userGroups.filter(g => g.competition === activeTab || (activeTab === 'league' && g.competition === 'league') || (activeTab === 'wc2026' && g.competition === 'wc2026')).map((group) => (
                        <div
                          key={group.id}
                          onClick={() => handleViewGroupLeaderboard(group)}
                          className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 text-sm cursor-pointer hover:bg-white/10 transition"
                        >
                          <div>
                            <div className="font-bold">
                              {group.competition === 'league' ? '🏟️' : '🏆'} {group.name}
                            </div>
                            <div className="text-xs text-gray-400">{group.memberCount} members</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs ${group.competition === 'league' ? 'text-green-400' : 'text-purple-400'}`}>Open →</span>
                          </div>
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
              {/* Group Actions */}
              <div className="mt-6 pt-4 border-t border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">
                    Share code: <span className="font-mono font-bold text-white">{selectedGroup.code}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(selectedGroup.code)}
                    className="px-3 py-1 rounded-lg bg-green-500/20 text-green-400 hover:bg-green-500/30 transition text-xs"
                  >
                    Copy
                  </button>
                </div>
                <button
                  onClick={() => {
                    handleLeaveGroup(selectedGroup.id, selectedGroup.name);
                  }}
                  className="w-full py-2 rounded-xl text-sm bg-red-500/20 text-red-400 hover:bg-red-500/30 transition border border-red-500/30"
                >
                  Leave Group
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Pending Picks Modal (#59) */}
        {showPicksModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[300] overflow-y-auto">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 w-full max-w-lg my-auto max-h-[85vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">📋 My Picks</h3>
                <button
                  onClick={() => setShowPicksModal(false)}
                  className="text-gray-400 hover:text-white transition text-xl"
                >
                  ✕
                </button>
              </div>

              {loadingPicks ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-white/5 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : pendingPicks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  No predictions yet. Start predicting!
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingPicks.map((pick) => {
                    const homeName = pick.home_team && pick.home_team !== "Unknown" && pick.home_team !== "" ? pick.home_team : null;
                    const awayName = pick.away_team && pick.away_team !== "Unknown" && pick.away_team !== "" ? pick.away_team : null;
                    const matchLabel = homeName && awayName
                      ? `${homeName} vs ${awayName}`
                      : pick.match_id.startsWith('wc_') ? "World Cup Match"
                      : "League Match";

                    const pickLabel = pick.predicted_result === "home"
                      ? `${homeName || "Home"} Win`
                      : pick.predicted_result === "away"
                      ? `${awayName || "Away"} Win`
                      : "Draw";

                    const isSettled = pick.settled;
                    const isWin = isSettled && pick.points_earned > 0;
                    const isLoss = isSettled && pick.points_earned === 0;
                    const isPending = !isSettled;

                    // Check if cancel is possible — match not in liveScores as live/finished
                    const ls = liveScores[pick.match_id];
                    const LIVE_STATUSES_M = ['1H', '2H', 'HT', 'ET', 'P', 'LIVE', 'BT'];
                    const FINISHED_STATUSES_M = ['FT', 'AET', 'PEN'];
                    const isMatchLive = ls && LIVE_STATUSES_M.includes(ls.status);
                    const isMatchFinished = ls && FINISHED_STATUSES_M.includes(ls.status);
                    const canCancel = isPending && !isMatchLive && !isMatchFinished;

                    return (
                      <div
                        key={pick.id || pick.match_id}
                        className={`p-4 border rounded-xl ${
                          isWin ? "bg-green-500/[0.08] border-green-500/25"
                          : isLoss ? "bg-red-500/[0.06] border-red-500/20"
                          : isMatchLive ? "bg-amber-500/[0.06] border-amber-500/20"
                          : "bg-white/5 border-white/10"
                        }`}
                      >
                        {/* Match name */}
                        <div className="font-bold text-white text-sm mb-1">{matchLabel}</div>

                        {/* Pick + Score */}
                        <div className="text-sm text-gray-300 mb-2">
                          Pick: <span className="text-white font-semibold">{pickLabel}</span>
                          <span className="text-gray-600 mx-1.5">·</span>
                          Score: <span className="text-white font-semibold">{pick.predicted_score}</span>
                          {pick.boosted && <span className="text-purple-400 text-xs ml-2">⚡</span>}
                        </div>

                        {/* Status + action */}
                        {isSettled ? (
                          <div className="flex items-center justify-between">
                            {pick.actual_score && (
                              <span className="text-sm font-bold text-white">
                                Final: <span className={isWin ? "text-green-400" : "text-red-400"}>{pick.actual_score}</span>
                              </span>
                            )}
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-lg ${
                              isWin ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
                            }`}>
                              {isWin ? `Win · +${pick.points_earned} pts` : "Loss · 0 pts"}
                            </span>
                          </div>
                        ) : isMatchLive ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span></span>
                              <span className="text-xs text-green-400 font-bold">
                                {ls ? `${ls.home}-${ls.away} (${ls.minute}')` : "LIVE"}
                              </span>
                            </div>
                            <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-lg">
                              🔒 Locked
                            </span>
                          </div>
                        ) : canCancel ? (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">⏳ Pending</span>
                            <button
                              onClick={() => cancelPick(pick.match_id)}
                              disabled={cancellingPick === pick.match_id}
                              className="px-3 py-1 rounded-lg text-xs bg-red-500/20 text-red-400 hover:bg-red-500/30 transition border border-red-500/30 disabled:opacity-50"
                            >
                              {cancellingPick === pick.match_id ? "Cancelling..." : "Cancel Pick"}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-500">⏳ Pending</span>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-lg">
                              🔒 Locked
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 text-center">
                <button
                  onClick={() => setShowPicksModal(false)}
                  className="px-6 py-2 rounded-xl text-sm bg-white/10 text-gray-300 hover:bg-white/20 transition"
                >
                  Close
                </button>
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
  onPredict: (matchId: string, result: "home" | "draw" | "away", score: string, useBooster: boolean, homeTeam?: string, awayTeam?: string) => void;
  kickoffISO?: string;
  liveScore?: { home: number; away: number; minute: number; status: string } | null;
  avgOdds?: AvgOdds | null;
  signals?: MatchSignals | null;
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
  liveScore,
  avgOdds,
  signals
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
    await onPredict(matchId, selectedResult, score, useBooster, home, away);
    setIsSubmitting(false);
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6">
      {/* Match Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          {leagueFlag && <span className="text-xs">{leagueFlag}</span>}
          <span className="text-xs text-gray-400 font-bold">{league}</span>
        </div>
        <span className="text-xs text-gray-500">{date} {time}</span>
      </div>

      {/* Teams — compact on mobile */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-center flex-1">
          <div className="text-xl md:text-2xl mb-1">
            {homeFlag.startsWith('http') ? (
              <img src={homeFlag} alt="" className="w-7 h-7 md:w-8 md:h-8 mx-auto" />
            ) : (
              homeFlag
            )}
          </div>
          <div className="text-xs md:text-sm font-medium text-white truncate px-1">{home}</div>
        </div>
        <div className="text-[10px] text-gray-600 font-bold px-2">VS</div>
        <div className="text-center flex-1">
          <div className="text-xl md:text-2xl mb-1">
            {awayFlag.startsWith('http') ? (
              <img src={awayFlag} alt="" className="w-7 h-7 md:w-8 md:h-8 mx-auto" />
            ) : (
              awayFlag
            )}
          </div>
          <div className="text-xs md:text-sm font-medium text-white truncate px-1">{away}</div>
        </div>
      </div>

      {/* Avg Market Odds — shown when available and match hasn't started */}
      {avgOdds && !isStarted && !isLive && !isFinished && (
        <div className="mb-3 px-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl">
          <div className="text-xs text-gray-500 text-center mb-2 uppercase tracking-wider font-semibold">Avg Market Odds</div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className={`py-1.5 rounded-lg ${avgOdds.home <= avgOdds.away && avgOdds.home <= avgOdds.draw ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.03]'}`}>
              <div className="text-[10px] text-gray-500 mb-0.5">Home</div>
              <div className={`text-lg font-bold ${avgOdds.home <= avgOdds.away && avgOdds.home <= avgOdds.draw ? 'text-green-400' : 'text-gray-300'}`}>{avgOdds.home.toFixed(2)}</div>
            </div>
            <div className={`py-1.5 rounded-lg ${avgOdds.draw <= avgOdds.home && avgOdds.draw <= avgOdds.away ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.03]'}`}>
              <div className="text-[10px] text-gray-500 mb-0.5">Draw</div>
              <div className={`text-lg font-bold ${avgOdds.draw <= avgOdds.home && avgOdds.draw <= avgOdds.away ? 'text-green-400' : 'text-gray-300'}`}>{avgOdds.draw.toFixed(2)}</div>
            </div>
            <div className={`py-1.5 rounded-lg ${avgOdds.away <= avgOdds.home && avgOdds.away <= avgOdds.draw ? 'bg-green-500/10 border border-green-500/20' : 'bg-white/[0.03]'}`}>
              <div className="text-[10px] text-gray-500 mb-0.5">Away</div>
              <div className={`text-lg font-bold ${avgOdds.away <= avgOdds.home && avgOdds.away <= avgOdds.draw ? 'text-green-400' : 'text-gray-300'}`}>{avgOdds.away.toFixed(2)}</div>
            </div>
          </div>
          {(() => {
            const fav = avgOdds.home < avgOdds.away ? home : avgOdds.away < avgOdds.home ? away : null;
            return fav ? (
              <div className="text-xs text-gray-500 text-center mt-2">
                Market favorite: <span className="text-green-400 font-semibold">{fav}</span>
              </div>
            ) : null;
          })()}
        </div>
      )}

      {/* KickScan Prediction — AI pick, market prediction, fan vote */}
      {signals && !isStarted && !isLive && !isFinished && (
        <div className="mb-3 px-4 py-3 bg-purple-500/[0.04] border border-purple-500/[0.12] rounded-xl">
          <div className="text-xs text-purple-400 text-center mb-2.5 uppercase tracking-wider font-semibold">KickScan Prediction</div>
          <div className="space-y-2">
            {/* Fan Vote */}
            {signals.fanVote && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-14 flex-shrink-0">🗳️ Fans</span>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden flex">
                  <div className="bg-green-500/40 h-full flex items-center justify-center text-[10px] text-green-300 font-bold" style={{ width: `${signals.fanVote.home}%` }}>
                    {signals.fanVote.home > 15 ? `${signals.fanVote.home}%` : ''}
                  </div>
                  <div className="bg-yellow-500/40 h-full flex items-center justify-center text-[10px] text-yellow-300 font-bold" style={{ width: `${signals.fanVote.draw}%` }}>
                    {signals.fanVote.draw > 15 ? `${signals.fanVote.draw}%` : ''}
                  </div>
                  <div className="bg-blue-500/40 h-full flex items-center justify-center text-[10px] text-blue-300 font-bold" style={{ width: `${signals.fanVote.away}%` }}>
                    {signals.fanVote.away > 15 ? `${signals.fanVote.away}%` : ''}
                  </div>
                </div>
              </div>
            )}
            {/* AI Prediction + link to full verdict */}
            {signals.aiPick && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-14 flex-shrink-0">🧠 AI</span>
                <span className={`text-sm font-bold ${
                  signals.aiVerdict === 'BET' ? 'text-green-400' :
                  signals.aiVerdict === 'LEAN' ? 'text-amber-400' :
                  signals.aiVerdict === 'SKIP' ? 'text-gray-400' : 'text-red-400'
                }`}>
                  {signals.aiPick}
                </span>
                {signals.aiConfidence && (
                  <span className="text-gray-500 text-xs">({signals.aiConfidence}%)</span>
                )}
                <a
                  href={matchId.startsWith('league_') ? `/leagues/${matchId.replace('league_', '')}` : matchId.startsWith('wc_') ? `/match/${matchId.replace('wc_', '')}` : '#'}
                  className="ml-auto text-purple-400 hover:text-purple-300 text-xs font-medium transition flex items-center gap-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  View <span className="text-sm">→</span>
                </a>
              </div>
            )}
            {/* Market Prediction */}
            {signals.marketFavorite && (
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-sm w-14 flex-shrink-0">📊 Mkt</span>
                <span className="text-sm font-bold text-cyan-400">{signals.marketFavorite}</span>
              </div>
            )}
          </div>
        </div>
      )}

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
                  (() => {
                    const actualHome = liveScore.home;
                    const actualAway = liveScore.away;
                    const predResult = prediction.predicted_result;
                    const actualResult = actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw';
                    return predResult === actualResult;
                  })() ? 'text-green-400' : 'text-red-400'
                }`}>
                  {(() => {
                    // Use actual settled points if available, otherwise calculate display
                    if (prediction.settled && prediction.points_earned !== undefined) {
                      if (prediction.points_earned > 0) {
                        const predScore = prediction.predicted_score;
                        const actualScore = `${liveScore.home}-${liveScore.away}`;
                        if (predScore === actualScore) return `🎯 Exact score! +${prediction.points_earned} pts`;
                        return `✅ Correct result! +${prediction.points_earned} pts`;
                      }
                      return '❌ Wrong prediction · 0 pts';
                    }
                    // Fallback for not-yet-settled display
                    const actualHome = liveScore.home;
                    const actualAway = liveScore.away;
                    const predResult = prediction.predicted_result;
                    const actualResult = actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw';
                    const predScore = prediction.predicted_score;
                    const actualScore = `${actualHome}-${actualAway}`;
                    if (predScore === actualScore) return '🎯 Exact score!';
                    if (predResult === actualResult) return '✅ Correct result!';
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
        /* Normal editable state — "Your Prediction" section */
        <div className="bg-gradient-to-b from-purple-500/[0.06] to-transparent border border-purple-500/15 rounded-2xl p-4 space-y-4">
          {/* Section header */}
          <div className="text-center">
            <div className="text-xs text-purple-400 font-bold uppercase tracking-wider mb-0.5">Your Prediction</div>
            {minutesToLock !== null && minutesToLock <= 60 && minutesToLock > 0 && (
              <div className="text-[10px] text-amber-400">
                ⏱️ Locks in {minutesToLock} min
              </div>
            )}
          </div>

          {/* Result Prediction — unified control group */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 text-center">Pick result</div>
            <div className="flex gap-1.5 bg-white/[0.03] rounded-xl p-1">
              <button
                onClick={() => setSelectedResult("home")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  selectedResult === "home"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30 shadow-sm shadow-green-500/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
                }`}
              >
                {home.length > 12 ? home.slice(0, 10) + "…" : home}
              </button>
              <button
                onClick={() => setSelectedResult("draw")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  selectedResult === "draw"
                    ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 shadow-sm shadow-yellow-500/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
                }`}
              >
                Draw
              </button>
              <button
                onClick={() => setSelectedResult("away")}
                className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                  selectedResult === "away"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm shadow-blue-500/10"
                    : "text-gray-400 hover:bg-white/5 hover:text-gray-300"
                }`}
              >
                {away.length > 12 ? away.slice(0, 10) + "…" : away}
              </button>
            </div>
          </div>

          {/* Score Prediction — team names tied to inputs */}
          <div>
            <div className="text-xs text-gray-500 mb-1.5 text-center">Predict score</div>
            <div className="flex items-center justify-center gap-3">
              <div className="text-center">
                <div className="text-[10px] text-gray-500 mb-1 truncate max-w-[80px]">{home}</div>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={homeScore}
                  onChange={(e) => setHomeScore(e.target.value)}
                  className="w-14 h-12 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition"
                />
              </div>
              <span className="text-lg font-bold text-gray-600 mt-4">—</span>
              <div className="text-center">
                <div className="text-[10px] text-gray-500 mb-1 truncate max-w-[80px]">{away}</div>
                <input
                  type="number"
                  min="0"
                  max="9"
                  value={awayScore}
                  onChange={(e) => setAwayScore(e.target.value)}
                  className="w-14 h-12 text-center text-xl font-bold bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition"
                />
              </div>
            </div>
          </div>

          {/* Booster — inside same action area */}
          <div className="flex items-center justify-center">
            <label className="flex items-center gap-2 cursor-pointer bg-white/[0.03] rounded-xl px-4 py-2">
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
                  : "border-gray-500 hover:border-purple-400"
              } ${boostersRemaining === 0 ? "opacity-50 cursor-not-allowed" : ""}`}>
                {useBooster && <span className="text-white text-xs">✓</span>}
              </div>
              <span className={`text-sm font-medium transition ${
                useBooster ? "text-purple-400" : "text-gray-400"
              } ${boostersRemaining === 0 ? "opacity-50" : ""}`}>
                ⚡ Booster {boostersRemaining === 0 ? "(0 left)" : `(${boostersRemaining} left)`}
              </span>
            </label>
          </div>

          {/* Submit — belongs to the action card */}
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all disabled:opacity-50 shadow-lg shadow-purple-500/20"
          >
            {isSubmitting ? "Saving..." : (prediction ? "Update Prediction" : "Submit Prediction")}
          </button>

          {/* Current Prediction indicator */}
          {prediction && (
            <div className="text-center text-sm">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full text-xs border border-green-500/20">
                ✅ {
                  prediction.predicted_result === "home" ? `${home} Win` :
                  prediction.predicted_result === "away" ? `${away} Win` : "Draw"
                } {prediction.predicted_score}
                {prediction.boosted && <span>⚡</span>}
              </span>
              <div className="text-[10px] text-gray-600 mt-1">
                Editable until 5 min before kickoff
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