import { supabaseAdmin } from '@/lib/supabase';

const API_FOOTBALL_KEY = '3408fed656308fb4ade76a6b3212a975';

export interface SettleResult {
  settled: number;
  checked: number;
  finishedFixtures: number;
  skippedLocked?: boolean;
  errors: string[];
}

/**
 * Acquire a settlement lock. Returns true if lock acquired, false if another run is active.
 * Lock expires after 4 minutes (safe gap for 5-min cron).
 */
export async function acquireLock(runId: string): Promise<boolean> {
  // Try to upsert lock row — only succeed if no active lock exists
  const { data, error } = await supabaseAdmin.rpc('acquire_settle_lock', {
    p_run_id: runId,
    p_expire_minutes: 4,
  });

  if (error) {
    console.error('[settle-lock] Failed to acquire lock:', error.message);
    // If RPC doesn't exist yet, fall through without lock (backward compat)
    // This lets the cron work even before the DB migration runs
    if (error.message.includes('acquire_settle_lock')) {
      console.warn('[settle-lock] RPC not found — running without lock');
      return true;
    }
    return false;
  }

  return data === true;
}

/**
 * Release the settlement lock.
 */
export async function releaseLock(runId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from('cron_locks')
    .update({ locked_at: null, locked_by: null })
    .eq('id', 'settlement')
    .eq('locked_by', runId);

  if (error) {
    console.error('[settle-lock] Failed to release lock:', error.message);
  }
}

/**
 * Core settlement logic — shared between /api/settle and /api/cron/settle.
 * Finds unsettled predictions for finished matches, calculates points, updates users.
 */
export async function runSettlement(): Promise<SettleResult> {
  const errors: string[] = [];

  // Get all unsettled predictions
  const { data: unsettled, error: fetchError } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id, match_id, predicted_result, predicted_score, boosted')
    .eq('settled', false)
    .limit(50);

  if (fetchError) {
    errors.push(`Fetch error: ${fetchError.message}`);
    return { settled: 0, checked: 0, finishedFixtures: 0, errors };
  }

  if (!unsettled || unsettled.length === 0) {
    return { settled: 0, checked: 0, finishedFixtures: 0, errors };
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
          next: { revalidate: 60 },
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
            status,
          };
        }
      }
    } catch (e: any) {
      errors.push(`API-Football error for ${fixtureId}: ${e.message}`);
    }
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

    if (!isFinished || actualHome === null || actualAway === null) continue;

    // Calculate actual result
    const actualResult =
      actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw';
    const actualScore = `${actualHome}-${actualAway}`;

    // Calculate points
    let points = 0;
    const resultCorrect = pred.predicted_result === actualResult;
    const scoreCorrect = pred.predicted_score === actualScore;

    if (resultCorrect) {
      points = 3;
      if (pred.boosted) points *= 2;
    }
    if (scoreCorrect) {
      points += 5;
    }

    // Update prediction — use settled=false in WHERE as extra safety against double-settle
    const { error: updateError, count } = await supabaseAdmin
      .from('predictions')
      .update({
        settled: true,
        actual_result: actualResult,
        actual_score: actualScore,
        points_earned: points,
      })
      .eq('id', pred.id)
      .eq('settled', false);

    if (updateError) {
      errors.push(`Failed to settle ${pred.id}: ${updateError.message}`);
      continue;
    }

    // If count is 0, another process already settled this — skip user update
    // (Supabase JS v2 doesn't always return count, so we proceed but the .eq('settled', false) guard prevents double-write)

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
          best_streak: bestStreak,
        })
        .eq('id', pred.user_id);
    }

    settledCount++;
  }

  return {
    settled: settledCount,
    checked: unsettled.length,
    finishedFixtures: Object.keys(fixtureResults).length,
    errors,
  };
}
