import Link from "next/link";

const groups = [
  { id: "A", teams: ["Mexico", "South Korea", "South Africa", "UEFA Playoff D"], flags: ["🇲🇽", "🇰🇷", "🇿🇦", "🏳️"], difficulty: 2, topPick: "Mexico" },
  { id: "B", teams: ["Canada", "Switzerland", "Qatar", "UEFA Playoff A"], flags: ["🇨🇦", "🇨🇭", "🇶🇦", "🏳️"], difficulty: 3, topPick: "Switzerland" },
  { id: "C", teams: ["Brazil", "Morocco", "Scotland", "Haiti"], flags: ["🇧🇷", "🇲🇦", "🏴", "🇭🇹"], difficulty: 4, topPick: "Brazil" },
  { id: "D", teams: ["USA", "Paraguay", "Australia", "UEFA Playoff C"], flags: ["🇺🇸", "🇵🇾", "🇦🇺", "🏳️"], difficulty: 2, topPick: "USA" },
  { id: "E", teams: ["Germany", "Ecuador", "Ivory Coast", "Curacao"], flags: ["🇩🇪", "🇪🇨", "🇨🇮", "🇨🇼"], difficulty: 3, topPick: "Germany" },
  { id: "F", teams: ["Netherlands", "Japan", "Tunisia", "UEFA Playoff B"], flags: ["🇳🇱", "🇯🇵", "🇹🇳", "🏳️"], difficulty: 4, topPick: "Netherlands" },
  { id: "G", teams: ["Belgium", "Iran", "Egypt", "New Zealand"], flags: ["🇧🇪", "🇮🇷", "🇪🇬", "🇳🇿"], difficulty: 2, topPick: "Belgium" },
  { id: "H", teams: ["Spain", "Uruguay", "Saudi Arabia", "Cape Verde"], flags: ["🇪🇸", "🇺🇾", "🇸🇦", "🇨🇻"], difficulty: 4, topPick: "Spain" },
  { id: "I", teams: ["France", "Senegal", "Norway", "Playoff TBD"], flags: ["🇫🇷", "🇸🇳", "🇳🇴", "🏳️"], difficulty: 3, topPick: "France" },
  { id: "J", teams: ["Argentina", "Austria", "Algeria", "Jordan"], flags: ["🇦🇷", "🇦🇹", "🇩🇿", "🇯🇴"], difficulty: 2, topPick: "Argentina" },
  { id: "K", teams: ["Portugal", "Colombia", "Uzbekistan", "Playoff TBD"], flags: ["🇵🇹", "🇨🇴", "🇺🇿", "🏳️"], difficulty: 3, topPick: "Portugal" },
  { id: "L", teams: ["England", "Croatia", "Panama", "Ghana"], flags: ["🏴", "🇭🇷", "🇵🇦", "🇬🇭"], difficulty: 3, topPick: "England" },
];

export default function GroupsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          World Cup 2026 <span className="text-green-400">Groups</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          12 groups of 4 teams — AI analysis, odds, and predictions for each
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((g) => (
          <Link
            key={g.id}
            href={`/groups/${g.id.toLowerCase()}`}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-400/50 transition group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xl font-bold text-green-400">
                Group {g.id}
              </span>
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <span
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i < g.difficulty ? "bg-green-400" : "bg-gray-700"
                    }`}
                  />
                ))}
              </div>
            </div>
            <ul className="space-y-2.5 mb-4">
              {g.teams.map((team, i) => (
                <li key={team} className="flex items-center gap-3 text-gray-300">
                  <span className="text-lg">{g.flags[i]}</span>
                  <span>{team}</span>
                </li>
              ))}
            </ul>
            <div className="pt-3 border-t border-gray-800">
              <span className="text-xs text-gray-500">AI Pick to Win Group:</span>
              <span className="ml-2 text-sm font-semibold text-green-400">{g.topPick}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
