"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/verdicts", label: "🎯 WC Verdicts", isNew: true },
  { href: "/leagues", label: "⚽ Leagues" },
  { href: "/predict", label: "🎮 Predict", isHot: true },
  { href: "/predict#leaderboard", label: "🏆 Leaderboard" },
  { href: "/matches", label: "WC Fixtures" },
  { href: "/live-scores", label: "Live Scores", badge: true },
  { href: "/verdict-history", label: "📊 AI Verdict" },
  { href: "/players", label: "⭐ Players" },
];

interface User {
  id: string;
  username: string;
  token: string;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();

  // Check for logged in user on mount + listen for auth changes
  useEffect(() => {
    const loadUser = () => {
      const savedUser = localStorage.getItem("kickscan_user");
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          if (userData.id && userData.username) {
            setUser(userData);
          }
        } catch (err) {
          localStorage.removeItem("kickscan_user");
          setUser(null);
        }
      } else {
        setUser(null);
      }
    };

    loadUser();

    // Listen for auth changes from other components (e.g. /predict page login)
    const handleAuthChange = () => loadUser();
    window.addEventListener("kickscan_auth_change", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("kickscan_auth_change", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

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

        setUser(userData);
        localStorage.setItem("kickscan_user", JSON.stringify(userData));
        window.dispatchEvent(new Event("kickscan_auth_change"));
        setShowLoginModal(false);
        setLoginUsername("");
        setLoginPassword("");
        setError("");
      } else {
        setError(data.error || "Login failed");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("kickscan_user");
    window.dispatchEvent(new Event("kickscan_auth_change"));
    setUser(null);
    setDropdownOpen(false);
    window.location.reload();
  };

  return (
    <nav className="bg-gray-950/95 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-[100] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ pointerEvents: "auto" }}>
        <div className="flex justify-between h-16 items-center">
          <a href="/" className="flex items-center gap-2 relative z-[200] cursor-pointer" style={{ pointerEvents: "auto" }}>
            <span className="text-2xl">⚽</span>
            <span className="text-xl font-bold text-white">
              Kick<span className="text-green-400">Scan</span>
            </span>
            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-bold ml-1 tracking-wider">AI ENGINE</span>
          </a>

          <div className="hidden lg:flex items-center gap-6">
            {links.map((l, i) => (
              <a
                key={`${l.href}-${i}`}
                href={l.href}
                className={`text-sm font-medium transition relative ${
                  pathname === l.href
                    ? "text-green-400"
                    : "text-gray-300 hover:text-green-400"
                }`}
              >
                {l.label}
                {l.isNew && (
                  <span className="ml-1 text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded-full border border-purple-500/30 font-bold">NEW</span>
                )}
                {l.isHot && (
                  <span className="ml-1 text-[9px] bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded-full border border-orange-500/30 font-bold">HOT</span>
                )}
                {l.badge && (
                  <span className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </a>
            ))}

            {/* Auth buttons/dropdown */}
            {!user ? (
              <div className="flex items-center gap-3 ml-4">
                <a
                  href="/predict"
                  className="text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 px-4 py-2 rounded-xl transition-all"
                >
                  Sign Up
                </a>
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="text-sm font-medium text-gray-300 hover:text-white transition"
                >
                  Login
                </button>
              </div>
            ) : (
              <div className="relative ml-4">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium text-white hover:text-green-400 transition"
                >
                  👤 {user.username}
                  <span className="text-gray-400">▼</span>
                </button>
                
                {dropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-xl shadow-lg z-[200]">
                    <div className="py-2">
                      <a
                        href="/profile"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Profile
                      </a>
                      <a
                        href="/predict"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Predictions
                      </a>
                      <a
                        href="/predict"
                        className="block px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        My Groups
                      </a>
                      <div className="border-t border-gray-700 my-1"></div>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-gray-800/50 transition"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            className="lg:hidden text-gray-300 text-xl"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {menuOpen && (
          <div className="lg:hidden pb-4 space-y-1 border-t border-gray-800 pt-2">
            {links.map((l, i) => (
              <a
                key={`${l.href}-mobile-${i}`}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-3 text-sm font-medium transition ${
                  pathname === l.href
                    ? "text-green-400"
                    : "text-gray-300 hover:text-green-400"
                }`}
              >
                {l.label}
                {l.isNew && (
                  <span className="ml-2 text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded-full border border-purple-500/30 font-bold">NEW</span>
                )}
                {l.isHot && (
                  <span className="ml-2 text-[9px] bg-orange-500/20 text-orange-400 px-1 py-0.5 rounded-full border border-orange-500/30 font-bold">HOT</span>
                )}
                {l.badge && (
                  <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">LIVE</span>
                )}
              </a>
            ))}

            {/* Mobile Auth Section */}
            <div className="border-t border-gray-700 pt-3 mt-3">
              {!user ? (
                <>
                  <a
                    href="/predict"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-sm font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 rounded-xl text-center mx-2 mb-3"
                  >
                    Sign Up
                  </a>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setShowLoginModal(true);
                    }}
                    className="block w-full py-3 text-sm font-medium text-gray-300 hover:text-white transition text-center"
                  >
                    Login
                  </button>
                </>
              ) : (
                <>
                  <div className="px-2 py-2 text-sm font-bold text-white border-b border-gray-700 mb-2">
                    👤 {user.username}
                  </div>
                  <a
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 px-2 text-sm text-gray-300 hover:text-white transition"
                  >
                    My Profile
                  </a>
                  <a
                    href="/predict"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 px-2 text-sm text-gray-300 hover:text-white transition"
                  >
                    My Predictions
                  </a>
                  <a
                    href="/predict"
                    onClick={() => setMenuOpen(false)}
                    className="block py-2 px-2 text-sm text-gray-300 hover:text-white transition"
                  >
                    My Groups
                  </a>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleLogout();
                    }}
                    className="block w-full text-left py-2 px-2 text-sm text-red-400 hover:text-red-300 transition"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* Login Modal */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[300] overflow-y-auto">
            <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700 rounded-2xl p-6 w-full max-w-md my-auto max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Login</h3>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setError("");
                    setLoginUsername("");
                    setLoginPassword("");
                  }}
                  className="text-gray-400 hover:text-white transition"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
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
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
                
                {error && (
                  <p className="text-red-400 text-sm text-center">{error}</p>
                )}
                
                <button
                  onClick={handleLogin}
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 transition-all disabled:opacity-50"
                >
                  {loading ? "Logging in..." : "Login"}
                </button>

                <div className="text-center text-sm text-gray-400 space-y-2">
                  <div>
                    Don't have an account?{" "}
                    <a
                      href="/predict"
                      className="text-purple-400 hover:text-purple-300 transition"
                      onClick={() => setShowLoginModal(false)}
                    >
                      Sign up here
                    </a>
                  </div>
                  {/* Account recovery — enable when support email is ready */}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
