// API route for odds capture and management
import { NextRequest, NextResponse } from 'next/server';
import { getMatchOdds, fetchOddsFromAPI, updateMatchOdds, lockOddsIfNeeded } from '@/lib/odds-manager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');
  const fixtureId = searchParams.get('fixtureId');
  const action = searchParams.get('action') || 'get';

  try {
    if (!matchId || !fixtureId) {
      return NextResponse.json(
        { error: 'matchId and fixtureId required' },
        { status: 400 }
      );
    }

    const fixtureIdNum = parseInt(fixtureId);

    switch (action) {
      case 'get':
        // Get current odds (cached or fresh)
        const odds = await getMatchOdds(fixtureIdNum);
        
        return NextResponse.json({
          success: true,
          odds: odds ? {
            averageOdds: odds.averageOdds,
            isLocked: odds.isLocked,
            lastUpdated: odds.lastUpdated.toISOString(),
            bookmakerCount: 0 // Don't expose individual bookmaker data
          } : null
        });

      case 'refresh':
        // Force refresh odds from API
        const bookmakers = await fetchOddsFromAPI(fixtureIdNum);
        
        if (bookmakers.length > 0) {
          // We need match details to update - get from database
          const { supabaseAdmin } = await import('@/lib/supabase');
          const { data: matchData } = await supabaseAdmin
            .from('match_odds_cache')
            .select('match_id, home_team, away_team, kickoff_time')
            .eq('fixture_id', fixtureIdNum)
            .single();

          if (matchData) {
            const success = await updateMatchOdds(
              fixtureIdNum,
              matchData.match_id,
              matchData.home_team,
              matchData.away_team,
              new Date(matchData.kickoff_time),
              bookmakers
            );

            if (success) {
              return NextResponse.json({
                success: true,
                message: `Refreshed odds from ${bookmakers.length} bookmakers`,
                bookmakerCount: bookmakers.length
              });
            }
          }
        }

        return NextResponse.json(
          { error: 'Failed to refresh odds' },
          { status: 500 }
        );

      case 'lock':
        // Manually lock odds (admin action)
        const locked = await lockOddsIfNeeded(fixtureIdNum);
        
        return NextResponse.json({
          success: true,
          locked,
          message: locked ? 'Odds locked successfully' : 'Odds already locked or not ready'
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Odds capture error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, matchId, fixtureId, homeTeam, awayTeam, kickoffTime } = body;

    if (!matchId || !fixtureId) {
      return NextResponse.json(
        { error: 'matchId and fixtureId required' },
        { status: 400 }
      );
    }

    const fixtureIdNum = parseInt(fixtureId);

    switch (action) {
      case 'initialize':
        // Initialize odds tracking for a new match
        if (!homeTeam || !awayTeam || !kickoffTime) {
          return NextResponse.json(
            { error: 'homeTeam, awayTeam, and kickoffTime required for initialization' },
            { status: 400 }
          );
        }

        // Fetch initial odds from API
        const bookmakers = await fetchOddsFromAPI(fixtureIdNum);
        
        if (bookmakers.length > 0) {
          const success = await updateMatchOdds(
            fixtureIdNum,
            matchId,
            homeTeam,
            awayTeam,
            new Date(kickoffTime),
            bookmakers
          );

          return NextResponse.json({
            success,
            message: success ? 
              `Initialized odds tracking with ${bookmakers.length} bookmakers` :
              'Failed to initialize odds',
            bookmakerCount: bookmakers.length
          });
        } else {
          // Initialize with placeholder odds if API fails
          const { supabaseAdmin } = await import('@/lib/supabase');
          const { error } = await supabaseAdmin
            .from('match_odds_cache')
            .upsert({
              fixture_id: fixtureIdNum,
              match_id: matchId,
              home_team: homeTeam,
              away_team: awayTeam,
              kickoff_time: new Date(kickoffTime).toISOString(),
              average_home_odds: 0,
              average_draw_odds: 0,
              average_away_odds: 0,
              bookmaker_count: 0,
              source: 'placeholder'
            });

          return NextResponse.json({
            success: !error,
            message: 'Initialized with placeholder odds (API returned no data)',
            bookmakerCount: 0
          });
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Odds capture POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}