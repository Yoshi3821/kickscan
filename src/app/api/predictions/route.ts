import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { allMatches } from '@/data/matches';

// Build a lookup for WC matches
const wcMatchLookup: Record<string, { home: string; away: string }> = {};
for (const m of allMatches) {
  wcMatchLookup[String(m.id)] = { home: m.home, away: m.away };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const limit = parseInt(searchParams.get('limit') || '10');

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId parameter' }, { status: 400 });
    }

    // Fetch user's recent predictions
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enhance predictions with match info
    const enhancedPredictions = await Promise.all(
      (predictions || []).map(async (prediction) => {
        const matchId: string = prediction.match_id;
        
        let home_team = "Unknown";
        let away_team = "Unknown";
        let competition = "Unknown";
        
        if (matchId.startsWith('wc_')) {
          const wcId = matchId.replace('wc_', '');
          const wcMatch = wcMatchLookup[wcId];
          if (wcMatch) {
            home_team = wcMatch.home;
            away_team = wcMatch.away;
          }
          competition = "World Cup 2026";
        } else if (matchId.startsWith('league_')) {
          // For league matches, store home/away in the prediction or fetch from fixture cache
          // Try to get from prediction metadata if stored, otherwise use fixture ID
          const fixtureId = matchId.replace('league_', '');
          
          // Check if prediction has stored team names (added at predict time)
          if (prediction.home_team && prediction.away_team) {
            home_team = prediction.home_team;
            away_team = prediction.away_team;
          } else {
            // Fallback: fetch from API-Football (limited to avoid burning API calls)
            try {
              const fixtureRes = await fetch(
                `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
                {
                  headers: {
                    'x-apisports-key': process.env.API_FOOTBALL_KEY || '3408fed656308fb4ade76a6b3212a975' // TODO: move to env only
                  },
                  next: { revalidate: 86400 } // Cache for 24 hours
                }
              );
              const fixtureData = await fixtureRes.json();
              if (fixtureData.response?.[0]) {
                const fixture = fixtureData.response[0];
                home_team = fixture.teams?.home?.name || "Home";
                away_team = fixture.teams?.away?.name || "Away";
                competition = fixture.league?.name || "League";
              }
            } catch {
              // Silently fail — team names will show as match ID fallback
              home_team = "";
              away_team = "";
            }
          }
          if (competition === "Unknown") competition = "League Match";
        }

        return {
          ...prediction,
          home_team,
          away_team,
          competition
        };
      })
    );

    return NextResponse.json({
      success: true,
      predictions: enhancedPredictions
    });

  } catch (error) {
    console.error('Predictions API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}