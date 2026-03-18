export default function Footer() {
  return (
    <footer className="bg-gray-900 border-t border-gray-800 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              ⚽ Kick<span className="text-green-400">Scan</span>
            </h3>
            <p className="text-gray-400 text-sm">
              AI-powered betting intelligence for FIFA World Cup 2026.
              Compare odds, find arbitrage, and make smarter bets.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="/groups" className="hover:text-green-400 transition">Groups</a></li>
              <li><a href="/odds" className="hover:text-green-400 transition">Odds Comparison</a></li>
              <li><a href="/predictions" className="hover:text-green-400 transition">AI Predictions</a></li>
              <li><a href="/arb-alerts" className="hover:text-green-400 transition">Arb Alerts</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase mb-4">Disclaimer</h4>
            <p className="text-gray-500 text-xs">
              KickScan.io provides information for educational purposes only.
              Betting involves risk. Please gamble responsibly. 18+ only.
              We may earn commissions from bookmaker referrals.
            </p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
          © 2026 KickScan.io — All rights reserved.
        </div>
      </div>
    </footer>
  );
}
