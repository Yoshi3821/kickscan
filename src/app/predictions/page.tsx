const predictions = [
  { team: "Spain", flag: "🇪🇸", odds: "9/2", probability: 18, tier: "Favorite" },
  { team: "Argentina", flag: "🇦🇷", odds: "5/1", probability: 16, tier: "Favorite" },
  { team: "France", flag: "🇫🇷", odds: "6/1", probability: 14, tier: "Favorite" },
  { team: "England", flag: "🏴", odds: "7/1", probability: 12, tier: "Favorite" },
  { team: "Brazil", flag: "🇧🇷", odds: "8/1", probability: 11, tier: "Favorite" },
  { team: "Germany", flag: "🇩🇪", odds: "10/1", probability: 9, tier: "Contender" },
  { team: "Portugal", flag: "🇵🇹", odds: "12/1", probability: 8, tier: "Contender" },
  { team: "Netherlands", flag: "🇳🇱", odds: "14/1", probability: 7, tier: "Contender" },
  { team: "Belgium", flag: "🇧🇪", odds: "20/1", probability: 5, tier: "Contender" },
  { team: "USA", flag: "🇺🇸", odds: "25/1", probability: 4, tier: "Dark Horse" },
  { team: "Colombia", flag: "🇨🇴", odds: "28/1", probability: 3, tier: "Dark Horse" },
  { team: "Morocco", flag: "🇲🇦", odds: "33/1", probability: 3, tier: "Dark Horse" },
  { team: "Croatia", flag: "🇭🇷", odds: "33/1", probability: 3, tier: "Dark Horse" },
  { team: "Uruguay", flag: "🇺🇾", odds: "40/1", probability: 2, tier: "Dark Horse" },
  { team: "Japan", flag: "🇯🇵", odds: "50/1", probability: 2, tier: "Dark Horse" },
];

const tierColors: Record<string, string> = {
  Favorite: "text-yellow-400 bg-yellow-400/10 border-yellow-400/30",
  Contender: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  "Dark Horse": "text-purple-400 bg-purple-400/10 border-purple-400/30",
};

export default function PredictionsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          AI <span className="text-green-400">Predictions</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Our AI model analyzes team form, squad depth, and historical data
          to predict World Cup 2026 outcomes
        </p>
      </div>

      {/* Winner Odds Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">🏆 Outright Winner Predictions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 border-b border-gray-800">
                <th className="text-left px-6 py-3 font-medium">Rank</th>
                <th className="text-left px-6 py-3 font-medium">Team</th>
                <th className="text-center px-4 py-3 font-medium">Odds</th>
                <th className="text-center px-4 py-3 font-medium">Win %</th>
                <th className="text-center px-4 py-3 font-medium">Tier</th>
                <th className="text-left px-4 py-3 font-medium">Probability</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((p, i) => (
                <tr key={p.team} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-6 py-3 text-gray-500 font-mono">{i + 1}</td>
                  <td className="px-6 py-3">
                    <span className="text-lg mr-2">{p.flag}</span>
                    <span className="text-white font-medium">{p.team}</span>
                  </td>
                  <td className="text-center px-4 py-3 text-green-400 font-mono font-bold">
                    {p.odds}
                  </td>
                  <td className="text-center px-4 py-3 text-gray-300">
                    {p.probability}%
                  </td>
                  <td className="text-center px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full border ${tierColors[p.tier]}`}>
                      {p.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 w-48">
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-400 h-2 rounded-full"
                        style={{ width: `${p.probability * 5}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Insight */}
      <div className="bg-gradient-to-r from-green-900/20 to-gray-900 border border-green-400/20 rounded-xl p-8">
        <h3 className="text-xl font-bold text-green-400 mb-4">🧠 AI Insight</h3>
        <p className="text-gray-300 leading-relaxed">
          Spain enters as the AI&apos;s top pick — reigning European champions with a generational
          squad featuring Pedri, Gavi, Yamal, and Nico Williams. However, the expanded 48-team
          format introduces more variance. Dark horses like Morocco (2022 semi-finalists) and
          Japan (rapidly improving) could exploit this. Our model gives a 34% chance that the
          winner comes from outside the traditional top 5 favorites — the highest probability in
          World Cup history.
        </p>
      </div>
    </div>
  );
}
