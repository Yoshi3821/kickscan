import Link from "next/link";
import { allMatches, getFlag, groupNames } from "@/data/matches";

const groupInfo = Object.entries(groupNames).map(([id, teams]) => ({
  id,
  teams,
  flags: teams.map(t => getFlag(t)),
  topPick: teams[0], // First team is generally the favorite
}));

// Override top picks with actual favorites
const topPicks: Record<string, string> = {
  A: "Mexico", B: "Switzerland", C: "Brazil", D: "USA",
  E: "Germany", F: "Netherlands", G: "Belgium", H: "Spain",
  I: "France", J: "Argentina", K: "Portugal", L: "England",
};

export default function GroupsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl md:text-5xl font-black">
          World Cup 2026 <span className="text-green-400">Groups</span>
        </h1>
        <p className="mt-3 text-gray-400 text-lg">
          12 groups of 4 teams — AI analysis, odds, and predictions for each
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {groupInfo.map((g) => {
          const groupMatches = allMatches.filter(m => m.group === g.id);
          return (
            <div
              key={g.id}
              className="bg-gray-900/50 border border-gray-800/50 rounded-xl p-6 hover:border-green-400/30 transition"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xl font-black text-green-400">Group {g.id}</span>
                <span className="text-xs text-gray-500">{groupMatches.length} matches</span>
              </div>
              <ul className="space-y-2.5 mb-4">
                {g.teams.map((team, i) => (
                  <li key={team} className="flex items-center gap-3 text-gray-300">
                    <span className="text-lg">{g.flags[i]}</span>
                    <span className="text-sm">{team}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-gray-800/50 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-gray-600">AI Pick to Win Group:</span>
                  <span className="ml-2 text-xs font-semibold text-green-400">{topPicks[g.id]}</span>
                </div>
              </div>

              {/* Mini schedule */}
              <div className="mt-4 pt-3 border-t border-gray-800/50">
                <p className="text-[10px] text-gray-600 mb-2 uppercase tracking-wider">Schedule</p>
                <div className="space-y-1.5">
                  {groupMatches.map(m => (
                    <div key={m.id} className="flex items-center justify-between text-[11px]">
                      <span className="text-gray-500 min-w-[55px]">{m.date}</span>
                      <span className="text-gray-300 flex-1 text-center truncate px-1">
                        {m.homeFlag} {m.home} vs {m.away} {m.awayFlag}
                      </span>
                      <span className="text-gray-600 min-w-[60px] text-right">{m.time.replace(" ET", "")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick links */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link href="/odds" className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-xl transition text-center text-sm">
          Compare Odds for All Groups →
        </Link>
        <Link href="/predictions" className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-xl transition border border-gray-700 text-center text-sm">
          AI Predictions →
        </Link>
      </div>
    </div>
  );
}
