import { supabaseAdmin } from '@/lib/supabase';
import { calculate1X2Points, calculateCSBonus } from './new-scoring-engine';

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
  const { data, error } = await supabaseAdmin.rpc('acquire_settle_lock', {
    p_run_id: runId,
    p_expire_minutes: 4,
  });

  if (error) {
    console.error('[settle-lock] Failed to acquire lock:', error.message);
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
 * Determine if a predicted_score string counts as an active CS bet.
 * Only "N-N" (both sides numeric) counts. 
 * "", "x-x", "2-x", "x-1", null, undefined → NO CS bet.
 */
function isActiveCSBet(predictedScore: string | null | undefined): boolean {
  if (!predictedScore) return false;
  return /^\d+-\d+$/.test(predictedScore.trim());
}

/**
 * Core settlement logic — uses the approved 11-tier odds-based scoring system.
 * 
 * SCORING RULES (approved spec):
 * ─────────────────────────────────────────────
 * 1X2 (mandatory):
 *   Correct → odds-based points (1-11 pts per band)
 *   Wrong   → -1 point
 *   Booster → doubles 1X2 points only (not CS, not penalties)
 * 
 * Correct Score (optional):
 *   Correct → bonus based on total goals (0→+4, 1-3→+3, 4-6→+5, 7+→+7)
 *   Wrong   → -1 point
 *   Skipped → 0 points (no penalty)
 * 
 * Booster does NOT:
 *   - Double CS bonus or CS penalty
 *   - Multiply negative 1X2 points (wrong 1X2 = flat -1 even with booster)
 * ─────────────────────────────────────────────
 */
export async function runSettlement(): Promise<SettleResult> {
  const errors: string[] = [];

  // Get all unsettled predictions (include locked odds stored at prediction time)
  const { data: unsettled, error: fetchError } = await supabaseAdmin
    .from('predictions')
    .select('id, user_id, match_id, predicted_result, predicted_score, boosted, locked_home_odds, locked_draw_odds, locked_away_odds')
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
        } else if (['PST', 'CANC', 'ABD', 'AWD', 'WO'].includes(status)) {
          fixtureResults[fixtureId] = {
            homeGoals: -1,
            awayGoals: -1,
            status,
          };
        }
      }
    } catch (e: any) {
      errors.push(`API-Football error for ${fixtureId}: ${e.message}`);
    }
  }

  // Get locked odds for all matches we need to settle
  const matchIds = [...new Set(unsettled.map(p => p.match_id))];
  const { data: allOdds } = await supabaseAdmin
    .from('match_odds_cache')
    .select('*')
    .in('match_id', matchIds);

  const oddsMap: Record<string, { home: number; draw: number; away: number }> = {};
  if (allOdds) {
    for (const odds of allOdds) {
      oddsMap[odds.match_id] = {
        home: odds.average_home_odds || 0,
        draw: odds.average_draw_odds || 0,
        away: odds.average_away_odds || 0,
      };
    }
  }

  let settledCount = 0;
  const finishedFixtureCount = Object.keys(fixtureResults).length;

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

    // ── Handle voided matches (postponed, cancelled, etc.) ──
    if (actualHome === -1 && actualAway === -1) {
      const { error: voidError } = await supabaseAdmin
        .from('predictions')
        .update({
          settled: true,
          actual_result: 'void',
          actual_score: 'VOID',
          points_earned: 0,
          final_1x2_points: 0,
          final_cs_points: 0,
          final_total_points: 0,
        })
        .eq('id', pred.id)
        .eq('settled', false);

      if (voidError) {
        errors.push(`Failed to void ${pred.id}: ${voidError.message}`);
        continue;
      }

      // Refund booster if used
      if (pred.boosted) {
        const today = new Date().toISOString().split('T')[0];
        const { data: userData } = await supabaseAdmin
          .from('users')
          .select('boosters_used_today, last_booster_date')
          .eq('id', pred.user_id)
          .single();
        if (userData && userData.last_booster_date === today) {
          await supabaseAdmin
            .from('users')
            .update({ boosters_used_today: Math.max(0, (userData.boosters_used_today || 1) - 1) })
            .eq('id', pred.user_id);
        }
      }

      settledCount++;
      continue;
    }

    // ── Calculate actual result ──
    const actualResult: 'home' | 'draw' | 'away' =
      actualHome > actualAway ? 'home' : actualAway > actualHome ? 'away' : 'draw';
    const actualScore = `${actualHome}-${actualAway}`;

    // ── Get locked odds ──
    // Priority: odds stored on prediction (captured when user saved) > match_odds_cache (fallback)
    const predOdds = (pred.locked_home_odds && pred.locked_draw_odds && pred.locked_away_odds)
      ? { home: pred.locked_home_odds, draw: pred.locked_draw_odds, away: pred.locked_away_odds }
      : null;
    const odds = predOdds || oddsMap[pred.match_id] || null;

    // ── 1X2 SCORING ──
    let final1X2Points = 0;
    let selectedOdds = 0;
    const resultCorrect = pred.predicted_result === actualResult;

    if (resultCorrect) {
      // Get the odds for the outcome the user picked
      if (odds) {
        switch (pred.predicted_result) {
          case 'home': selectedOdds = odds.home; break;
          case 'draw': selectedOdds = odds.draw; break;
          case 'away': selectedOdds = odds.away; break;
        }
      }

      if (selectedOdds > 0) {
        // Use the approved 11-tier odds-based system
        const basePoints = calculate1X2Points(selectedOdds);
        // Booster doubles 1X2 points only (correct picks only)
        final1X2Points = pred.boosted ? basePoints * 2 : basePoints;
      } else {
        // No locked odds available — fallback: award minimum 1 point
        final1X2Points = pred.boosted ? 2 : 1;
        errors.push(`No locked odds for match ${pred.match_id}, prediction ${pred.id} — used fallback 1pt`);
      }
    } else {
      // Wrong 1X2 = flat -1 (booster does NOT multiply penalties)
      final1X2Points = -1;
    }

    // ── CORRECT SCORE SCORING ──
    let finalCSPoints = 0;
    const csEntered = isActiveCSBet(pred.predicted_score);

    if (csEntered) {
      const scoreCorrect = pred.predicted_score === actualScore;
      if (scoreCorrect) {
        // Bonus based on total goals in the actual final score
        const totalGoals = actualHome + actualAway;
        finalCSPoints = calculateCSBonus(totalGoals);
      } else {
        // Wrong CS = -1
        finalCSPoints = -1;
      }
    }
    // If CS not entered (x-x, partial, empty) → 0 points, no penalty

    // ── TOTAL ──
    const finalTotalPoints = final1X2Points + finalCSPoints;
    const scoreCorrect = csEntered && pred.predicted_score === actualScore;

    // ── Get points band description ──
    let pointsBand = 'N/A';
    if (selectedOdds > 0) {
      const pts = calculate1X2Points(selectedOdds);
      pointsBand = `${selectedOdds.toFixed(2)} = ${pts}pt${pts !== 1 ? 's' : ''}`;
    }

    // ── Update prediction ──
    const { error: updateError } = await supabaseAdmin
      .from('predictions')
      .update({
        settled: true,
        actual_result: actualResult,
        actual_score: actualScore,
        locked_home_odds: odds?.home || pred.locked_home_odds || null,
        locked_draw_odds: odds?.draw || pred.locked_draw_odds || null,
        locked_away_odds: odds?.away || pred.locked_away_odds || null,
        locked_points_band: pointsBand,
        final_1x2_points: final1X2Points,
        final_cs_points: finalCSPoints,
        final_total_points: finalTotalPoints,
        points_earned: finalTotalPoints, // backward compatibility
        scored_at: new Date().toISOString(),
      })
      .eq('id', pred.id)
      .eq('settled', false);

    if (updateError) {
      errors.push(`Failed to settle ${pred.id}: ${updateError.message}`);
      continue;
    }

    // ── Update user stats ──
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
          total_points: (userData.total_points || 0) + finalTotalPoints,
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
    finishedFixtures: finishedFixtureCount,
    errors,
  };
}
