import { getAllLeagueFixtures, LEAGUES } from '@/lib/league-api';
import { generateAutoVerdict } from '@/lib/auto-verdict';
import Link from 'next/link';
import LeagueFilter from "@/components/LeagueFilter";
import LeagueTimezone from "@/components/LeagueTimezone";
import { Suspense } from 'react';

export const revalidate = 1800; // 30 min cache for fresher data

export const metadata = {
  title: "⚽ Live Leagues — KickScan.io",
  description: "AI verdicts for Premier League, Champions League, La Liga, Serie A & Bundesliga. Live odds, form analysis, and betting intelligence for all major football leagues.",
  keywords: ["Premier League betting", "Champions League odds", "La Liga predictions", "Serie A analysis", "Bundesliga tips", "football league betting"]
};


// LeagueFilter is now a client component imported separately

function RecommendationBadge({ recommendation }: { recommendation: string }) {
  const colors = {
    'BET': 'bg-green-500/20 text-green-400 border-green-500/30',
    'LEAN': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'SKIP': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    'AVOID': 'bg-red-500/20 text-red-400 border-red-500/30',
  } as const;

  return (
    <span className={`px-2 py-1 text-xs font-bold border rounded-full ${colors[recommendation as keyof typeof colors] || colors.SKIP}`}>
      {recommendation}
    </span>
  );
}

function ValueStars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={`text-xs ${star <= rating ? 'text-yellow-400' : 'text-gray-600'}`}
        >
          ★
        </span>
      ))}
    </div>
  );
}

async function MatchCard({ fixture }: { fixture: any }) {
  // Generate a basic verdict without full API calls for performance
  const basicVerdict = generateAutoVerdict(fixture, null, null, [], [], []);

  const matchTime = new Date(fixture.date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Seoul'
  });

  const league = LEAGUES.find(l => l.id === fixture.league.id);

  return (
    <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-xl p-6 hover:border-gray-700/50 transition-all hover:bg-gray-800/20">
      {/* League badge */}
      <div className="flex items-center gap-2 mb-4">
        <img src={fixture.league.logo} alt={fixture.league.name} className="w-5 h-5" />
        <span className="text-sm text-gray-400">
          {league?.flag} {fixture.league.name}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <img src={fixture.home.logo} alt={fixture.home.name} className="w-8 h-8" />
          <span className="font-medium text-white">{fixture.home.name}</span>
        </div>
        
        <div className="text-center text-gray-400">
          <div className="text-xs">vs</div>
        </div>

        <div className="flex items-center gap-3">
          <span className="font-medium text-white">{fixture.away.name}</span>
          <img src={fixture.away.logo} alt={fixture.away.name} className="w-8 h-8" />
        </div>
      </div>

      {/* Match info — timezone-aware via client component */}
      <LeagueTimezone dateISO={fixture.date} venue={fixture.venue.name} fallbackTime={matchTime} />

      {/* Verdict preview */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <RecommendationBadge recommendation={basicVerdict.recommendation} />
          <span className="text-sm text-gray-300">{basicVerdict.pick}</span>
        </div>
        <ValueStars rating={basicVerdict.valueRating} />
      </div>

      {/* View button */}
      <Link
        href={`/leagues/${fixture.id}`}
        className="w-full block text-center bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg py-2 text-sm font-medium transition-colors"
      >
        View Verdict →
      </Link>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-6 animate-pulse">
          <div className="h-4 bg-gray-800 rounded mb-4"></div>
          <div className="h-8 bg-gray-800 rounded mb-4"></div>
          <div className="h-4 bg-gray-800 rounded mb-4"></div>
          <div className="h-6 bg-gray-800 rounded"></div>
        </div>
      ))}
    </div>
  );
}

async function LeagueMatches() {
  try {
    // Fetch more fixtures per league to ensure coverage
    const fixtures = await getAllLeagueFixtures(40);
    
    if (fixtures.length === 0) {
      return (
        <div className="text-center py-12">
          <p className="text-gray-400 mb-4">No upcoming matches found.</p>
          <p className="text-sm text-gray-500">Check back later for the latest fixtures.</p>
        </div>
      );
    }

    // Group fixtures by league
    const grouped: Record<string, typeof fixtures> = {};
    for (const fixture of fixtures) {
      const key = `${fixture.league.id}-${fixture.league.name}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(fixture);
    }

    return (
      <div id="all-matches" className="space-y-10">
        {Object.entries(grouped).map(([key, leagueFixtures]) => {
          const leagueId = key.split("-")[0];
          const league = leagueFixtures[0].league;
          const leagueInfo = LEAGUES.find(l => l.id === Number(leagueId));
          return (
            <div key={key} id={`league-${leagueId}`} className="scroll-mt-20">
              <div className="flex items-center gap-3 mb-4">
                <img src={league.logo} alt={league.name} className="w-6 h-6" />
                <h3 className="text-lg font-bold text-white">
                  {leagueInfo?.flag} {league.name}
                </h3>
                <span className="text-xs text-gray-500">{leagueFixtures.length} matches</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leagueFixtures.map((fixture) => (
                  <MatchCard key={fixture.id} fixture={fixture} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  } catch (error) {
    console.error('Failed to load league fixtures:', error);
    return (
      <div className="text-center py-12">
        <p className="text-red-400 mb-4">Failed to load matches</p>
        <p className="text-sm text-gray-500">Please try again later.</p>
      </div>
    );
  }
}

export default function LeaguesPage() {
  return (
    <main className="min-h-screen bg-dot-pattern">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
              ⚽ Live Leagues
            </span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            AI-powered verdicts for the world's biggest football leagues. Real-time form analysis, 
            head-to-head records, and value betting opportunities across all major competitions.
          </p>
        </div>

        {/* Timezone selector */}
        <LeagueTimezone pickerOnly />

        {/* League filters */}
        <LeagueFilter leagues={LEAGUES} />

        {/* Stats bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-400">5</div>
            <div className="text-sm text-gray-400">Leagues</div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-400">24</div>
            <div className="text-sm text-gray-400">Live Matches</div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-400">AI</div>
            <div className="text-sm text-gray-400">Powered</div>
          </div>
          <div className="bg-gray-900/30 backdrop-blur-sm border border-gray-800/50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-400">Live</div>
            <div className="text-sm text-gray-400">Odds</div>
          </div>
        </div>

        {/* Matches */}
        <Suspense fallback={<LoadingSkeleton />}>
          <LeagueMatches />
        </Suspense>
      </div>
    </main>
  );
}