import Link from "next/link";

const groups = [
  { id: "A", teams: ["Mexico 🇲🇽", "South Korea 🇰🇷", "South Africa 🇿🇦", "TBD (UEFA)"] },
  { id: "B", teams: ["Canada 🇨🇦", "Switzerland 🇨🇭", "Qatar 🇶🇦", "TBD (UEFA)"] },
  { id: "C", teams: ["Brazil 🇧🇷", "Morocco 🇲🇦", "Scotland 🏴", "Haiti 🇭🇹"] },
  { id: "D", teams: ["USA 🇺🇸", "Paraguay 🇵🇾", "Australia 🇦🇺", "TBD (UEFA)"] },
  { id: "E", teams: ["Germany 🇩🇪", "Ecuador 🇪🇨", "Ivory Coast 🇨🇮", "Curacao 🇨🇼"] },
  { id: "F", teams: ["Netherlands 🇳🇱", "Japan 🇯🇵", "Tunisia 🇹🇳", "TBD (UEFA)"] },
  { id: "G", teams: ["Belgium 🇧🇪", "Iran 🇮🇷", "Egypt 🇪🇬", "New Zealand 🇳🇿"] },
  { id: "H", teams: ["Spain 🇪🇸", "Uruguay 🇺🇾", "Saudi Arabia 🇸🇦", "Cape Verde 🇨🇻"] },
  { id: "I", teams: ["France 🇫🇷", "Senegal 🇸🇳", "Norway 🇳🇴", "TBD (Playoff)"] },
  { id: "J", teams: ["Argentina 🇦🇷", "Austria 🇦🇹", "Algeria 🇩🇿", "Jordan 🇯🇴"] },
  { id: "K", teams: ["Portugal 🇵🇹", "Colombia 🇨🇴", "Uzbekistan 🇺🇿", "TBD (Playoff)"] },
  { id: "L", teams: ["England 🏴", "Croatia 🇭🇷", "Panama 🇵🇦", "Ghana 🇬🇭"] },
];

const features = [
  {
    icon: "📊",
    title: "Live Odds Comparison",
    desc: "Compare odds across 10+ bookmakers in real-time for every World Cup match.",
  },
  {
    icon: "🧠",
    title: "AI Match Analysis",
    desc: "Deep analysis powered by AI — team form, head-to-head, tactical breakdown.",
  },
  {
    icon: "⚡",
    title: "Arbitrage Alerts",
    desc: "Instant alerts when bookmaker odds create guaranteed profit opportunities.",
  },
  {
    icon: "🎮",
    title: "Group Simulator",
    desc: "Interactive tool — play out scenarios and see who qualifies.",
  },
];

function CountdownTimer() {
  const worldCupDate = new Date("2026-06-11T00:00:00Z");
  const now = new Date();
  const diff = worldCupDate.getTime() - now.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  return (
    <div className="inline-flex items-center gap-2 bg-green-400/10 border border-green-400/30 rounded-full px-4 py-2 text-green-400 text-sm font-medium">
      🏆 {days} days until World Cup 2026
    </div>
  );
}

export default function Home() {
  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-900/20 via-gray-950 to-gray-950" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <div className="text-center">
            <CountdownTimer />
            <h1 className="mt-6 text-4xl md:text-6xl font-extrabold tracking-tight">
              AI-Powered Betting
              <br />
              <span className="text-green-400">Intelligence</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-gray-400 max-w-2xl mx-auto">
              Compare odds across bookmakers, get AI match predictions, and
              find arbitrage opportunities — all in one place for FIFA World Cup 2026.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/odds"
                className="px-8 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition"
              >
                Compare Odds →
              </Link>
              <Link
                href="/predictions"
                className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold rounded-lg transition border border-gray-700"
              >
                AI Predictions
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6 hover:border-green-400/50 transition"
            >
              <div className="text-3xl mb-4">{f.icon}</div>
              <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
              <p className="text-gray-400 text-sm">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Groups Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold">
            World Cup 2026 <span className="text-green-400">Groups</span>
          </h2>
          <p className="mt-4 text-gray-400">
            48 teams. 12 groups. 104 matches. Every odd compared.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id.toLowerCase()}`}
              className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-green-400/50 transition group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-green-400">
                  GROUP {g.id}
                </span>
                <span className="text-gray-600 group-hover:text-green-400 transition">→</span>
              </div>
              <ul className="space-y-1.5">
                {g.teams.map((t) => (
                  <li key={t} className="text-sm text-gray-300">
                    {t}
                  </li>
                ))}
              </ul>
            </Link>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gradient-to-r from-green-900/30 to-gray-900 py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-6">
            Don&apos;t Miss an Edge
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Get notified when our AI spots arbitrage opportunities and value
            bets across bookmakers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400"
            />
            <button className="px-6 py-3 bg-green-500 hover:bg-green-400 text-black font-bold rounded-lg transition">
              Get Alerts
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
