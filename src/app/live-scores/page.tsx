import { getLiveMatches, getTodayMatches, LiveMatch } from '@/lib/livescore-api';
import LiveScoreClient from './LiveScoreClient';

const wcMatches = [
  { date: "Jun 11", time: "3:00 PM ET", home: "🇲🇽 Mexico", away: "🇿🇦 South Africa", venue: "Estadio Azteca, Mexico City" },
  { date: "Jun 11", time: "10:00 PM ET", home: "🇰🇷 South Korea", away: "🏳️ UEFA PO D", venue: "Estadio Akron, Guadalajara" },
  { date: "Jun 12", time: "3:00 PM ET", home: "🇨🇦 Canada", away: "🏳️ UEFA PO A", venue: "BMO Field, Toronto" },
  { date: "Jun 12", time: "9:00 PM ET", home: "🇺🇸 USA", away: "🇵🇾 Paraguay", venue: "SoFi Stadium, Los Angeles" },
  { date: "Jun 13", time: "3:00 PM ET", home: "🇶🇦 Qatar", away: "🇨🇭 Switzerland", venue: "Levi's Stadium, San Francisco" },
  { date: "Jun 13", time: "6:00 PM ET", home: "🇧🇷 Brazil", away: "🇲🇦 Morocco", venue: "MetLife Stadium, New York" },
];

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute

export default async function LiveScoresPage() {
  // Fetch initial data on the server
  let liveMatches: LiveMatch[] = [];
  let todayMatches: LiveMatch[] = [];
  
  try {
    [liveMatches, todayMatches] = await Promise.all([
      getLiveMatches(),
      getTodayMatches()
    ]);
  } catch (error) {
    console.error('Failed to fetch initial live scores data:', error);
  }

  // Combine and deduplicate (live matches are also in today's matches)
  const matchMap = new Map();
  
  // Add today's matches first
  todayMatches.forEach(match => {
    matchMap.set(match.fixtureId, match);
  });
  
  // Override with live match data (in case of more recent data)
  liveMatches.forEach(match => {
    matchMap.set(match.fixtureId, { ...match, isLive: true });
  });

  const allMatches = Array.from(matchMap.values());
  
  // Sort by: live matches first, then by kick-off time
  allMatches.sort((a, b) => {
    // Live matches first
    if (a.isLive && !b.isLive) return -1;
    if (!a.isLive && b.isLive) return 1;
    
    // Then by date/time
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const initialData = {
    matches: allMatches,
    liveCount: liveMatches.length,
    totalCount: allMatches.length,
    lastUpdated: new Date().toISOString()
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* HERO HEADER */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-2 text-green-400 text-sm font-medium mb-6">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
          </span>
          LIVE
        </div>
        <h1 className="text-4xl md:text-6xl font-bold mb-4">
          <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            ⚡ Live Scores
          </span>
        </h1>
        <div className="space-y-2">
          <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">
            Real-time football scores from around the world
          </p>
          {liveMatches.length > 0 && (
            <div className="inline-flex items-center gap-2 text-red-400 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
              🟢 {liveMatches.length} {liveMatches.length !== 1 ? 'matches' : 'match'} live
            </div>
          )}
          <p className="text-gray-500 text-sm">
            Updates every 10 seconds
          </p>
        </div>
      </div>

      {/* LIVE SCORES SECTION */}
      <div className="mb-12">
        <LiveScoreClient initialData={initialData} />
      </div>

      {/* WORLD CUP 2026 */}
      <div className="mt-8 mb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
            🏟️ World Cup 2026 Live Scores
          </h2>
          <p className="text-gray-400">
            Custom live score tracking activates{" "}
            <span className="text-cyan-400 font-semibold">June 11, 2026</span>
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {wcMatches.map((match, i) => (
            <div
              key={i}
              className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/[0.08] transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-gray-500 font-medium">
                  {match.date} · {match.time}
                </span>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  UPCOMING
                </span>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-white font-semibold text-sm">{match.home}</span>
                <span className="text-gray-600 text-xs font-bold px-3">VS</span>
                <span className="text-white font-semibold text-sm">{match.away}</span>
              </div>

              <div className="flex items-center gap-1.5 text-gray-500 text-xs">
                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate">{match.venue}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}