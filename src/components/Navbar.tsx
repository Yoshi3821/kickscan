"use client";
import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";

const links = [
  { href: "/matches", label: "Matches" },
  { href: "/players", label: "⭐ Players" },
  { href: "/live-scores", label: "Live Scores", badge: true },
  { href: "/matches", label: "Intelligence", isNew: true },
  { href: "/odds", label: "Odds" },
  { href: "/blog", label: "Blog" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="bg-gray-950/80 backdrop-blur-xl border-b border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="text-xl font-bold text-white">
              Kick<span className="text-green-400">Scan</span>
            </span>
            <span className="text-[9px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full border border-purple-500/30 font-bold ml-1 tracking-wider">AI ENGINE</span>
          </Link>

          <div className="hidden lg:flex items-center gap-6">
            {links.map((l, i) => (
              <Link
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
                {l.badge && (
                  <span className="absolute -top-1 -right-3 w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                )}
              </Link>
            ))}
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
              <Link
                key={`${l.href}-mobile-${i}`}
                href={l.href}
                onClick={() => setMenuOpen(false)}
                className={`block py-2 text-sm font-medium transition ${
                  pathname === l.href
                    ? "text-green-400"
                    : "text-gray-300 hover:text-green-400"
                }`}
              >
                {l.label}
                {l.isNew && (
                  <span className="ml-2 text-[9px] bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded-full border border-purple-500/30 font-bold">NEW</span>
                )}
                {l.badge && (
                  <span className="ml-2 text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full">LIVE</span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
}
