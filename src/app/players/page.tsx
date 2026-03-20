"use client";
import Link from "next/link";
import { useState } from "react";
import { allPlayers, getCountryColor, playerImages } from "@/data/players";

const filterOptions = [
  { label: "All", tag: null },
  { label: "Last Dance 🕺", tag: "last-dance" },
  { label: "Rising Stars 🌟", tag: "rising-star" },
  { label: "Golden Boot Contenders 🥇", tag: "golden-boot-contender" },
  { label: "Host Nation Heroes 🏠", tag: "host-nation" },
];

export default function PlayersPage() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const filteredPlayers = activeFilter
    ? allPlayers.filter((p) => p.tags.includes(activeFilter))
    : allPlayers;

  return (
    <main className="min-h-screen bg-[#06060f] text-white">
      <section className="py-20 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4">
            <span className="bg-gradient-to-r from-purple-500 to-cyan-400 bg-clip-text text-transparent">
              ⭐ Stars of World Cup 2026
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            The players who will define the tournament
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {filterOptions.map((opt) => (
            <button
              key={opt.label}
              onClick={() => setActiveFilter(opt.tag)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all border cursor-pointer ${
                activeFilter === opt.tag
                  ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                  : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Player Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredPlayers.map((player) => {
            const color = getCountryColor(player.country);
            return (
              <Link
                key={player.slug}
                href={`/players/${player.slug}`}
                className={`group relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-6 hover:border-white/20 transition-all hover:shadow-lg ${
                  player.tier === 1 ? "sm:col-span-1" : ""
                }`}
                style={{
                  borderLeftWidth: "3px",
                  borderLeftColor: color,
                }}
              >
                {/* Featured Badge */}
                {player.tier === 1 && (
                  <span className="absolute top-3 right-3 text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/30 font-bold tracking-wider">
                    ⭐ FEATURED
                  </span>
                )}

                {/* Player Image + Flag + Number */}
                {playerImages[player.slug] && (
                  <div className="w-full h-48 rounded-xl overflow-hidden mb-4 bg-white/5">
                    <img
                      src={playerImages[player.slug]}
                      alt={player.name}
                      className="w-full h-full object-cover object-top"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-3xl">{player.flag}</span>
                  <span className="text-sm font-bold text-gray-500">#{player.number}</span>
                </div>

                {/* Name */}
                <h3 className="text-lg font-black text-white tracking-wide mb-1 uppercase group-hover:text-purple-300 transition">
                  {player.name}
                </h3>

                {/* Position + Club */}
                <p className="text-xs text-gray-500 mb-3">
                  {player.position} · {player.club}
                </p>

                {/* Tagline */}
                <p className="text-sm italic bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent font-medium mb-4">
                  &ldquo;{player.tagline}&rdquo;
                </p>

                {/* Stats */}
                <div className="space-y-1 mb-4">
                  {player.wcGoals > 0 && (
                    <p className="text-xs text-gray-400">
                      ⚽ {player.wcGoals} WC Goals
                    </p>
                  )}
                  {player.wcTitles > 0 && (
                    <p className="text-xs text-gray-400">
                      🏆 {player.wcTitles === 1 ? "2022 Champion" : `${player.wcTitles}x Champion`}
                    </p>
                  )}
                  {player.wcGoals === 0 && player.wcTitles === 0 && (
                    <p className="text-xs text-gray-400">
                      🌟 First World Cup
                    </p>
                  )}
                </div>

                {/* Group + Country */}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">
                    Group {player.group} · {player.country}
                  </span>
                  <span className="text-xs font-semibold text-purple-400 group-hover:text-purple-300 transition">
                    View Profile →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {filteredPlayers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg">No players match this filter</p>
          </div>
        )}
      </section>
    </main>
  );
}
