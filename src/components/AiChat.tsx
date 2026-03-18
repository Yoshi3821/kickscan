"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import type { MatchAnalysis } from "@/lib/ai-engine";

interface Bookmaker {
  key: string;
  name: string;
  home: number;
  draw: number;
  away: number;
}

interface Props {
  matchId: number;
  home: string;
  away: string;
  homeFlag: string;
  awayFlag: string;
  analysis: MatchAnalysis;
  odds?: Bookmaker[];
}

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
}

const DAILY_LIMIT = 5;
const STORAGE_KEY = "kickscan_chat_usage";
const VISITOR_KEY = "kickscan_vid";

function getVisitorId(): string {
  if (typeof window === "undefined") return "server";
  const stored = localStorage.getItem(VISITOR_KEY);
  if (stored) return stored;
  const fingerprint = [
    navigator.userAgent,
    screen.width,
    screen.height,
    screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    new Date().getTimezoneOffset(),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  const vid = "v_" + Math.abs(hash).toString(36) + "_" + Date.now().toString(36);
  localStorage.setItem(VISITOR_KEY, vid);
  return vid;
}

function getUsage(): { date: string; count: number } {
  if (typeof window === "undefined") return { date: "", count: 0 };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: new Date().toISOString().split("T")[0], count: 0 };
    const parsed = JSON.parse(raw);
    const today = new Date().toISOString().split("T")[0];
    if (parsed.date !== today) return { date: today, count: 0 };
    return parsed;
  } catch {
    return { date: new Date().toISOString().split("T")[0], count: 0 };
  }
}

function setUsage(usage: { date: string; count: number }) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(usage));
}

export default function AiChat({ matchId, home, away, homeFlag, awayFlag, analysis, odds }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [usage, setUsageState] = useState<{ date: string; count: number }>({ date: "", count: 0 });
  const [mounted, setMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const remaining = DAILY_LIMIT - usage.count;
  const isLimited = remaining <= 0;

  // Init
  useEffect(() => {
    setMounted(true);
    setUsageState(getUsage());
  }, []);

  // Welcome message
  useEffect(() => {
    if (mounted && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "ai",
          text: `Hey! I'm KickScan AI. I've analyzed ${homeFlag} ${home} vs ${awayFlag} ${away} — ask me anything about this match. Odds, predictions, tactics, value bets — I've got you covered. (${DAILY_LIMIT} free questions today)`,
        },
      ]);
    }
  }, [mounted, messages.length, home, away, homeFlag, awayFlag]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isTyping || isLimited) return;

      const userMsg: Message = { id: Date.now().toString(), role: "user", text: text.trim() };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matchId,
            question: text.trim(),
            visitorId: getVisitorId(),
          }),
        });

        const data = await res.json();

        // Update usage
        const newUsage = getUsage();
        newUsage.count += 1;
        newUsage.date = new Date().toISOString().split("T")[0];
        setUsage(newUsage);
        setUsageState(newUsage);

        // Simulate typing delay (300-800ms)
        await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: data.answer || "Hmm, something went wrong. Try asking again!",
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const errMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: "Connection issue — please try again in a moment.",
        };
        setMessages((prev) => [...prev, errMsg]);
      }

      setIsTyping(false);
    },
    [isTyping, isLimited, matchId]
  );

  const handleChip = (text: string) => sendMessage(text);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!mounted) return null;

  const suggestedChips = [
    "Who should I bet on?",
    "Is there value in the draw?",
    "What's the safest bet?",
  ];

  const showChips = messages.length <= 1;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 bottom-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white flex items-center justify-center shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-110 transition-all duration-300 group"
        aria-label="Open AI Chat"
      >
        {isOpen ? (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        ) : (
          <span className="text-2xl group-hover:scale-110 transition-transform">🧠</span>
        )}
        {/* Question count badge */}
        {!isOpen && remaining < DAILY_LIMIT && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {remaining}
          </span>
        )}
        {/* Pulse animation when closed */}
        {!isOpen && (
          <span className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 animate-ping opacity-20" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <>
          {/* Backdrop on mobile */}
          <div
            className="fixed inset-0 bg-black/40 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div
            className={`fixed z-50 flex flex-col overflow-hidden
              bg-[#0d0d1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-purple-500/10
              transition-all duration-300 ease-out
              /* Mobile: full-width bottom sheet */
              bottom-0 left-0 right-0 h-[90vh]
              /* Desktop: positioned above fab */
              md:bottom-24 md:right-6 md:left-auto md:w-[380px] md:h-[500px] md:rounded-2xl
            `}
            style={{ animation: "chatSlideUp 0.3s ease-out" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-lg">🧠</span>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-white truncate">KickScan AI</div>
                  <div className="text-[10px] text-gray-400 truncate">
                    {homeFlag} {home} vs {awayFlag} {away}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isLimited
                      ? "bg-red-500/20 text-red-400"
                      : "bg-purple-500/20 text-purple-300"
                  }`}
                >
                  {remaining}/{DAILY_LIMIT}
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white transition p-1"
                  aria-label="Close chat"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-line ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-br-md"
                        : "bg-white/[0.06] text-gray-200 border border-white/5 rounded-bl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}

              {/* Suggested chips */}
              {showChips && !isLimited && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {suggestedChips.map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChip(chip)}
                      disabled={isTyping}
                      className="text-xs bg-purple-500/15 text-purple-300 border border-purple-500/20 rounded-full px-3 py-1.5 hover:bg-purple-500/25 hover:border-purple-500/40 transition disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              )}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.06] border border-white/5 rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}

              {/* Rate limit message */}
              {isLimited && (
                <div className="text-center text-sm text-gray-400 bg-white/5 rounded-xl px-4 py-3 border border-white/5">
                  You&apos;ve used all {DAILY_LIMIT} free questions today. Come back tomorrow! 🔒
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="px-4 py-3 border-t border-white/10 shrink-0"
            >
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={isLimited ? "Daily limit reached" : "Ask about this match..."}
                  disabled={isLimited || isTyping}
                  className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition disabled:opacity-40"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLimited || isTyping}
                  className="bg-gradient-to-r from-purple-600 to-cyan-500 text-white rounded-xl px-4 py-2.5 text-sm font-bold hover:opacity-90 transition disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
}
