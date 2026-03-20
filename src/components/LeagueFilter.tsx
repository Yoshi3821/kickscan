"use client";

interface League {
  id: number;
  name: string;
  flag: string;
}

export default function LeagueFilter({ leagues }: { leagues: League[] }) {
  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => handleClick("all-matches")}
        className="px-4 py-3 bg-green-500/20 text-green-400 rounded-lg border border-green-500/30 text-sm font-medium active:scale-95 transition-all"
      >
        All
      </button>
      {leagues.map((league) => (
        <button
          key={league.id}
          onClick={() => handleClick(`league-${league.id}`)}
          className="px-4 py-3 bg-gray-800/50 text-gray-300 rounded-lg border border-gray-700/50 hover:bg-gray-700/50 hover:text-white active:scale-95 active:bg-gray-600/50 transition-all text-sm font-medium"
        >
          {league.flag} {league.name}
        </button>
      ))}
    </div>
  );
}
