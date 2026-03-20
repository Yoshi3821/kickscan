import { getFixtureById, getTeamForm, getH2H, getInjuries, getFixtureOdds } from '@/lib/league-api';
import { generateAutoVerdict } from '@/lib/auto-verdict';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import LeagueMatchClient from './LeagueMatchClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = Number(id);
  
  try {
    const fixture = await getFixtureById(fixtureId);
    if (!fixture) return { title: "Match Not Found | KickScan" };
    
    return {
      title: `${fixture.home.name} vs ${fixture.away.name} — ${fixture.league.name} Analysis | KickScan`,
      description: `AI prediction, odds comparison, and form analysis for ${fixture.home.name} vs ${fixture.away.name} in ${fixture.league.name}. View team form, head-to-head records, and betting value.`,
      keywords: [`${fixture.home.name}`, `${fixture.away.name}`, `${fixture.league.name}`, "betting", "odds", "prediction"],
    };
  } catch {
    return { title: "Match Analysis | KickScan" };
  }
}

export default async function LeagueMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const fixtureId = Number(id);

  try {
    // Fetch all data in parallel
    const [fixture, homeForm, awayForm, h2h, injuries, odds] = await Promise.all([
      getFixtureById(fixtureId),
      null, // Will be fetched if fixture exists
      null, // Will be fetched if fixture exists
      [], // Will be fetched if fixture exists
      getInjuries(fixtureId),
      getFixtureOdds(fixtureId),
    ]);

    if (!fixture) {
      notFound();
    }

    // Fetch team forms after we have team IDs — with error handling
    let homeFormData = null;
    let awayFormData = null;
    let h2hData: any[] = [];
    try {
      const season = new Date().getFullYear();
      [homeFormData, awayFormData, h2hData] = await Promise.all([
        getTeamForm(fixture.home.id, fixture.league.id, season).catch(() => null),
        getTeamForm(fixture.away.id, fixture.league.id, season).catch(() => null),
        getH2H(fixture.home.id, fixture.away.id).catch(() => []),
      ]);
      // If current year fails, try previous year (for seasons like 2025/26)
      if (!homeFormData) {
        homeFormData = await getTeamForm(fixture.home.id, fixture.league.id, season - 1).catch(() => null);
      }
      if (!awayFormData) {
        awayFormData = await getTeamForm(fixture.away.id, fixture.league.id, season - 1).catch(() => null);
      }
    } catch {
      // Continue with null data — verdict will still work
    }

    // Generate AI verdict
    const verdict = generateAutoVerdict(fixture, homeFormData, awayFormData, h2hData, injuries, odds);

    return (
      <main className="min-h-screen bg-dot-pattern">
        {/* Back navigation */}
        <div className="max-w-5xl mx-auto px-4 pt-6">
          <Link
            href="/leagues"
            className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-green-400 transition"
          >
            ← All Leagues
          </Link>
        </div>

        {/* Client component with all the enhanced features */}
        <LeagueMatchClient 
          fixture={fixture}
          homeFormData={homeFormData}
          awayFormData={awayFormData}
          h2hData={h2hData}
          injuries={injuries}
          odds={odds}
          verdict={verdict}
        />
      </main>
    );
  } catch (error) {
    console.error('Error loading match data:', error);
    notFound();
  }
}