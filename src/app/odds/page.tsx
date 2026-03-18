const sampleOdds = [
  {
    match: "Mexico vs South Korea",
    group: "A",
    date: "June 12, 2026",
    bookmakers: [
      { name: "Bet365", home: 1.85, draw: 3.40, away: 4.50 },
      { name: "1xBet", home: 1.90, draw: 3.35, away: 4.40 },
      { name: "Betway", home: 1.83, draw: 3.50, away: 4.60 },
      { name: "Pinnacle", home: 1.92, draw: 3.38, away: 4.45 },
    ],
  },
  {
    match: "Brazil vs Morocco",
    group: "C",
    date: "June 13, 2026",
    bookmakers: [
      { name: "Bet365", home: 2.10, draw: 3.20, away: 3.60 },
      { name: "1xBet", home: 2.15, draw: 3.15, away: 3.55 },
      { name: "Betway", home: 2.05, draw: 3.25, away: 3.70 },
      { name: "Pinnacle", home: 2.18, draw: 3.18, away: 3.50 },
    ],
  },
  {
    match: "England vs Croatia",
    group: "L",
    date: "June 14, 2026",
    bookmakers: [
      { name: "Bet365", home: 1.95, draw: 3.30, away: 4.20 },
      { name: "1xBet", home: 2.00, draw: 3.25, away: 4.10 },
      { name: "Betway", home: 1.90, draw: 3.40, away: 4.30 },
      { name: "Pinnacle", home: 2.02, draw: 3.22, away: 4.15 },
    ],
  },
  {
    match: "Argentina vs Austria",
    group: "J",
    date: "June 15, 2026",
    bookmakers: [
      { name: "Bet365", home: 1.40, draw: 4.50, away: 8.00 },
      { name: "1xBet", home: 1.42, draw: 4.40, away: 7.80 },
      { name: "Betway", home: 1.38, draw: 4.60, away: 8.20 },
      { name: "Pinnacle", home: 1.44, draw: 4.35, away: 7.70 },
    ],
  },
];

function getBestOdds(bookmakers: typeof sampleOdds[0]["bookmakers"]) {
  const bestHome = Math.max(...bookmakers.map((b) => b.home));
  const bestDraw = Math.max(...bookmakers.map((b) => b.draw));
  const bestAway = Math.max(...bookmakers.map((b) => b.away));
  return { bestHome, bestDraw, bestAway };
}

export default function OddsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Odds <span className="text-green-400">Comparison</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Compare bookmaker odds side-by-side for every World Cup 2026 match
        </p>
        <div className="mt-4 inline-flex items-center gap-2 bg-yellow-400/10 border border-yellow-400/30 rounded-full px-4 py-2 text-yellow-400 text-sm">
          ⚡ Sample data — Live odds coming soon
        </div>
      </div>

      <div className="space-y-6">
        {sampleOdds.map((match) => {
          const best = getBestOdds(match.bookmakers);
          return (
            <div
              key={match.match}
              className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white">{match.match}</h3>
                  <span className="text-sm text-gray-500">
                    Group {match.group} · {match.date}
                  </span>
                </div>
                <span className="text-xs bg-green-400/10 text-green-400 px-3 py-1 rounded-full">
                  {match.bookmakers.length} bookmakers
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-800">
                      <th className="text-left px-6 py-3 font-medium">Bookmaker</th>
                      <th className="text-center px-4 py-3 font-medium">Home</th>
                      <th className="text-center px-4 py-3 font-medium">Draw</th>
                      <th className="text-center px-4 py-3 font-medium">Away</th>
                    </tr>
                  </thead>
                  <tbody>
                    {match.bookmakers.map((bm) => (
                      <tr key={bm.name} className="border-b border-gray-800/50">
                        <td className="px-6 py-3 text-gray-300 font-medium">{bm.name}</td>
                        <td className={`text-center px-4 py-3 ${bm.home === best.bestHome ? "text-green-400 font-bold" : "text-gray-400"}`}>
                          {bm.home.toFixed(2)}
                        </td>
                        <td className={`text-center px-4 py-3 ${bm.draw === best.bestDraw ? "text-green-400 font-bold" : "text-gray-400"}`}>
                          {bm.draw.toFixed(2)}
                        </td>
                        <td className={`text-center px-4 py-3 ${bm.away === best.bestAway ? "text-green-400 font-bold" : "text-gray-400"}`}>
                          {bm.away.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-green-400/5">
                      <td className="px-6 py-3 text-green-400 font-bold">Best Odds</td>
                      <td className="text-center px-4 py-3 text-green-400 font-bold">{best.bestHome.toFixed(2)}</td>
                      <td className="text-center px-4 py-3 text-green-400 font-bold">{best.bestDraw.toFixed(2)}</td>
                      <td className="text-center px-4 py-3 text-green-400 font-bold">{best.bestAway.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
