export default function ArbAlertsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Arbitrage <span className="text-green-400">Alerts</span>
        </h1>
        <p className="mt-4 text-gray-400 text-lg">
          Our AI scans bookmaker odds 24/7 to find guaranteed profit opportunities
        </p>
      </div>

      {/* How It Works */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 mb-12">
        <h2 className="text-2xl font-bold mb-6">How Arbitrage Betting Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="font-bold text-white mb-2">1. We Scan</h3>
            <p className="text-gray-400 text-sm">
              Our AI monitors odds across 10+ bookmakers every minute, looking for price gaps.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="font-bold text-white mb-2">2. We Alert</h3>
            <p className="text-gray-400 text-sm">
              When combined implied probability drops below 100%, we send you an instant alert.
            </p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-3">💰</div>
            <h3 className="font-bold text-white mb-2">3. You Profit</h3>
            <p className="text-gray-400 text-sm">
              Place the calculated stakes on each side. Guaranteed profit regardless of outcome.
            </p>
          </div>
        </div>
      </div>

      {/* Sample Alert */}
      <div className="bg-gray-900 border border-green-400/30 rounded-xl overflow-hidden mb-8">
        <div className="px-6 py-3 bg-green-400/10 border-b border-green-400/30 flex items-center gap-2">
          <span className="text-green-400 font-bold">⚡ SAMPLE ALERT</span>
          <span className="text-gray-500 text-sm">— Live alerts coming during World Cup</span>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500 block">Match</span>
              <span className="text-white font-bold">Brazil vs Morocco</span>
            </div>
            <div>
              <span className="text-gray-500 block">Market</span>
              <span className="text-white">3-way (1X2)</span>
            </div>
            <div>
              <span className="text-gray-500 block">Combined Probability</span>
              <span className="text-green-400 font-bold">97.8%</span>
            </div>
            <div>
              <span className="text-gray-500 block">ROI</span>
              <span className="text-green-400 font-bold">2.2%</span>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500">
                  <th className="text-left py-2">Bet</th>
                  <th className="text-left py-2">Bookmaker</th>
                  <th className="text-center py-2">Odds</th>
                  <th className="text-center py-2">Stake ($100 total)</th>
                  <th className="text-center py-2">Payout</th>
                </tr>
              </thead>
              <tbody className="text-gray-300">
                <tr>
                  <td className="py-2">Brazil Win</td>
                  <td>Pinnacle</td>
                  <td className="text-center text-green-400 font-bold">2.18</td>
                  <td className="text-center">$46.88</td>
                  <td className="text-center">$102.20</td>
                </tr>
                <tr>
                  <td className="py-2">Draw</td>
                  <td>Betway</td>
                  <td className="text-center text-green-400 font-bold">3.25</td>
                  <td className="text-center">$31.44</td>
                  <td className="text-center">$102.18</td>
                </tr>
                <tr>
                  <td className="py-2">Morocco Win</td>
                  <td>Bet365</td>
                  <td className="text-center text-green-400 font-bold">3.60</td>
                  <td className="text-center">$21.68</td>
                  <td className="text-center">$102.15</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="bg-green-400/5 border border-green-400/20 rounded-lg p-4 text-sm">
            <span className="text-green-400 font-bold">Guaranteed Profit:</span>
            <span className="text-white ml-2">~$2.18 on $100 total stake (2.2% ROI)</span>
          </div>
        </div>
      </div>

      {/* Coming Soon CTA */}
      <div className="bg-gradient-to-r from-green-900/30 to-gray-900 rounded-xl p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">🔔 Get Arb Alerts During World Cup</h2>
        <p className="text-gray-400 mb-6">
          Sign up now and be the first to receive real-time arbitrage alerts when the tournament begins.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="Enter your email"
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
          />
          <button className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition">
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
}
