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

    const settled = searchParams.get('settled');

    // If settled=true, fetch all settled predictions (for verdict history)
    if (settled === 'true') {
      // Fetch settled predictions — deduplicate by match_id server-side
      const { data: settledPreds, error: settledError } = await supabase
        .from('predictions')
        .select('*')
        .eq('settled', true)
        .order('created_at', { ascending: false })
        .limit(200); // Fetch more to ensure dedup coverage

      if (settledError) {
        return NextResponse.json({ error: settledError.message }, { status: 500 });
      }

      // Deduplicate: one record per match_id, prefer entries with team names
      const matchMap = new Map<string, any>();
      for (const pred of (settledPreds || [])) {
        const existing = matchMap.get(pred.match_id);
        if (!existing) {
          matchMap.set(pred.match_id, pred);
        } else {
          // Prefer the entry that has team names
          const hasNames = pred.home_team && pred.home_team !== 'Unknown' && pred.home_team !== '';
          const existingHasNames = existing.home_team && existing.home_team !== 'Unknown' && existing.home_team !== '';
          if (hasNames && !existingHasNames) {
            matchMap.set(pred.match_id, pred);
          }
        }
      }

      // Enrich with team names from WC data if missing
      const deduped = Array.from(matchMap.values()).map((pred: any) => {
        if ((!pred.home_team || pred.home_team === 'Unknown') && pred.match_id.startsWith('wc_')) {
          const wcId = pred.match_id.replace('wc_', '');
          const wcMatch = wcMatchLookup[wcId];
          if (wcMatch) {
            pred.home_team = wcMatch.home;
            pred.away_team = wcMatch.away;
          }
        }
        return pred;
      });

      // Sort by created_at desc, limit
      deduped.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return NextResponse.json({
        success: true,
        predictions: deduped.slice(0, limit)
      });
    }

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