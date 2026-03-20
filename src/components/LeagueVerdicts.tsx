import { getAllLeagueFixtures, LEAGUES } from '@/lib/league-api';
import { generateAutoVerdict } from '@/lib/auto-verdict';
import Link from 'next/link';

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
    <div className="flex gap-0.5">
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

async function LeagueVerdictsContent() {
  try {
    // Fetch upcoming fixtures (limit to 6 for homepage)
    const fixtures = await getAllLeagueFixtures(12);
    
    if (fixtures.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-400">No upcoming league matches found.</p>
        </div>
      );
    }

    const verdictCards = fixtures.map((fixture) => {
      // Generate basic verdict for preview
      const verdict = generateAutoVerdict(fixture, null, null, [], [], []);
      
      const league = LEAGUES.find(l => l.id === fixture.league.id);
      const matchTime = new Date(fixture.date).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Seoul'
      });

      return (
        <Link
          key={fixture.id}
          href={`/leagues/${fixture.id}`}
          className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover-gradient-border transition-all group block"
        >
          {/* League badge */}
          <div className="flex items-center gap-2 mb-3">
            <img src={fixture.league.logo} alt={fixture.league.name} className="w-4 h-4" />
            <span className="text-xs text-gray-400">
              {league?.flag} {fixture.league.name}
            </span>
          </div>

          {/* Match */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <img src={fixture.home.logo} alt={fixture.home.name} className="w-6 h-6" />
              <span className="text-sm font-medium text-white truncate">{fixture.home.name}</span>
            </div>
            
            <span className="text-xs text-gray-400 mx-2">vs</span>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-white truncate">{fixture.away.name}</span>
              <img src={fixture.away.logo} alt={fixture.away.name} className="w-6 h-6" />
            </div>
          </div>

          {/* Time */}
          <div className="text-xs text-gray-400 text-center mb-3">
            {matchTime}
          </div>

          {/* Verdict preview */}
          <div className="flex items-center justify-between mb-3">
            <RecommendationBadge recommendation={verdict.recommendation} />
            <ValueStars rating={verdict.valueRating} />
          </div>

          <div className="text-center">
            <div className="text-sm font-medium text-white mb-1">{verdict.pick}</div>
            <div className="text-xs text-gray-400">{verdict.confidencePct}% confidence</div>
          </div>

          <div className="text-center mt-4 py-2 rounded-xl text-xs font-semibold text-green-400 bg-green-500/10 border border-green-500/20 group-hover:bg-green-500/20 transition-all">
            View Analysis →
          </div>
        </Link>
      );
    });

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {verdictCards.slice(0, 6)}
      </div>
    );

  } catch (error) {
    console.error('Failed to load league verdicts:', error);
    return (
      <div className="text-center py-8">
        <p className="text-red-400 mb-2">Failed to load league matches</p>
        <p className="text-sm text-gray-500">Please try again later.</p>
      </div>
    );
  }
}

export default function LeagueVerdicts() {
  return <LeagueVerdictsContent />;
}