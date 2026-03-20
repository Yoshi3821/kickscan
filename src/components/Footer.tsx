import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-gray-950 border-t border-gray-800/50 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-bold text-white mb-4">
              ⚽ Kick<span className="text-green-400">Scan</span>
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              AI-powered betting intelligence for FIFA World Cup 2026.
              Compare odds, find arbitrage opportunities, and make smarter bets across North America.
            </p>
            <div className="flex gap-3 mt-4">
              <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-gray-700 transition cursor-pointer text-sm">𝕏</span>
              <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-gray-700 transition cursor-pointer text-sm">📷</span>
              <span className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-green-400 hover:bg-gray-700 transition cursor-pointer text-sm">▶</span>
            </div>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Tools</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link href="/verdicts" className="hover:text-green-400 transition">Verdicts</Link></li>
              <li><Link href="/leagues" className="hover:text-green-400 transition">Leagues</Link></li>
              <li><Link href="/live-scores" className="hover:text-green-400 transition">Live Scores</Link></li>
              <li><Link href="/players" className="hover:text-green-400 transition">Players</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Tournament</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li><Link href="/matches" className="hover:text-green-400 transition">All Matches</Link></li>
              <li><Link href="/blog" className="hover:text-green-400 transition">Blog & Analysis</Link></li>
              <li><span className="text-gray-600">Schedule (Coming Soon)</span></li>
              <li><span className="text-gray-600">Knockout Bracket (Coming Soon)</span></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">Legal</h4>
            <p className="text-gray-500 text-xs leading-relaxed">
              KickScan.io provides information for educational purposes only.
              Betting involves risk. Please gamble responsibly. 18+ only.
              We may earn commissions from bookmaker referrals.
            </p>
            <div className="mt-4 flex gap-2">
              <span className="text-[10px] bg-red-500/10 text-red-400 px-2 py-1 rounded border border-red-500/20">18+</span>
              <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-1 rounded border border-yellow-500/20">Gamble Responsibly</span>
            </div>
          </div>
        </div>
        <div className="pt-8 border-t border-gray-800/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-600 text-xs">
            © 2026 KickScan.io — All rights reserved.
          </p>
          <p className="text-gray-700 text-xs">
            FIFA World Cup 2026™ — USA 🇺🇸 Mexico 🇲🇽 Canada 🇨🇦
          </p>
        </div>
      </div>
    </footer>
  );
}
