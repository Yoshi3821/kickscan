"use client";
import Link from "next/link";
import { useState } from "react";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <nav className="bg-gray-900 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">⚽</span>
            <span className="text-xl font-bold text-white">
              Kick<span className="text-green-400">Scan</span>
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/groups" className="text-gray-300 hover:text-green-400 transition">
              Groups
            </Link>
            <Link href="/odds" className="text-gray-300 hover:text-green-400 transition">
              Odds Comparison
            </Link>
            <Link href="/predictions" className="text-gray-300 hover:text-green-400 transition">
              AI Predictions
            </Link>
            <Link href="/arb-alerts" className="text-gray-300 hover:text-green-400 transition">
              Arb Alerts
            </Link>
            <Link href="/blog" className="text-gray-300 hover:text-green-400 transition">
              Blog
            </Link>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            <Link href="/groups" className="block text-gray-300 hover:text-green-400 py-2">Groups</Link>
            <Link href="/odds" className="block text-gray-300 hover:text-green-400 py-2">Odds Comparison</Link>
            <Link href="/predictions" className="block text-gray-300 hover:text-green-400 py-2">AI Predictions</Link>
            <Link href="/arb-alerts" className="block text-gray-300 hover:text-green-400 py-2">Arb Alerts</Link>
            <Link href="/blog" className="block text-gray-300 hover:text-green-400 py-2">Blog</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
