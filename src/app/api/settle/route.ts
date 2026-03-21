import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

const API_FOOTBALL_KEY = '3408fed656308fb4ade76a6b3212a975';

/**
 * Settlement API — checks finished matches and updates prediction results.
 * Called periodically (e.g. every 5 min via client polling or cron).
 * 
 * GET /api/settle — settles all unsettled predictions for finished matches
 */
export async function GET(request: NextRequest) {
  try {
    // Get all unsettled predictions
    const { data: unsettled, error: fetchError } = await supabaseAdmin
      .from('predictions')
      .select('id, user_id, match_id, predicted_result, predicted_score, boosted')
      .eq('settled', false)
      .limit(50);

    if (fetchError || !unsettled || unsettled.length === 0) {
      return NextResponse.json({ settled: 0, message: 'No unsettled predictions' });
    }

    // Group by fixture ID to batch API calls
    const fixtureIds = new Set<string>();
    for (const pred of unsettled) {
      if (pred.match_id.startsWith('league_')) {
        fixtureIds.add(pred.match_id.replace('league_', ''));
      }
    }

    // Fetch fixture results from API-Football
    const fixtureResults: Record<string, { homeGoals: number; awayGoals: number; status: string }> = {};
    
    for (const fixtureId of fixtureIds) {
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
          {
            headers: { 'x-apisports-key': API_FOOTBALL_KEY },
            next: { revalidate: 60 }
          }
        );
        const data = await res.json();
        const fixture = data.response?.[0];
        if (fixture) {
          const status = fixture.fixture?.status?.short || '';
          if (['FT', 'AET', 'PEN'].includes(status)) {
            fixtureResults[fixtureId] = {
              homeGoals: fixture.goals?.home ?? 0,
              awayGoals: fixture.goals?.away ?? 0,
              status
            };
          }
        }
      } catch {}
    }

    let settledCount = 0;

    for (const pred of unsettled) {
      let actualHome: number | null = null;
      let actualAway: number | null = null;
      let isFinished = false;

      if (pred.match_id.startsWith('league_')) {
        const fixtureId = pred.match_id.replace('league_', '');
        const result = fixtureResults[fixtureId];
        if (result) {
          actualHome = result.homeGoals;
          actualAway = result.awayGoals;
          isFinished = true;
        }
      }
      // WC matches — not started yet, skip
      
      if (!isFinished || actualHome === null || actualAway === null) continue;

      // Calculate actual result
      const actualResult = actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw';
      const actualScore = `${actualHome}-${actualAway}`;

      // Calculate points
      let points = 0;
      const resultCorrect = pred.predicted_result === actualResult;
      const scoreCorrect = pred.predicted_score === actualScore;

      if (resultCorrect) {
        points = 3; // Correct result
        if (pred.boosted) points *= 2; // Booster doubles base
      }
      if (scoreCorrect) {
        points += 5; // Exact score bonus (not doubled by booster)
      }

      // Update prediction
      const { error: updateError } = await supabaseAdmin
        .from('predictions')
        .update({
          settled: true,
          actual_result: actualResult,
          actual_score: actualScore,
          points_earned: points
        })
        .eq('id', pred.id);

      if (updateError) {
        console.error(`Failed to settle prediction ${pred.id}:`, updateError);
        continue;
      }

      // Update user stats
      const { data: userData } = await supabaseAdmin
        .from('users')
        .select('total_points, correct_results, correct_scores, current_streak, best_streak')
        .eq('id', pred.user_id)
        .single();

      if (userData) {
        const newStreak = resultCorrect ? (userData.current_streak || 0) + 1 : 0;
        const bestStreak = Math.max(newStreak, userData.best_streak || 0);

        await supabaseAdmin
          .from('users')
          .update({
            total_points: (userData.total_points || 0) + points,
            correct_results: (userData.correct_results || 0) + (resultCorrect ? 1 : 0),
            correct_scores: (userData.correct_scores || 0) + (scoreCorrect ? 1 : 0),
            current_streak: newStreak,
            best_streak: bestStreak
          })
          .eq('id', pred.user_id);
      }

      settledCount++;
    }

    return NextResponse.json({
      settled: settledCount,
      checked: unsettled.length,
      finishedFixtures: Object.keys(fixtureResults).length
    });

  } catch (error) {
    console.error('Settlement error:', error);
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 });
  }
}
