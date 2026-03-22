import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * ONE-TIME reset endpoint. Delete after use.
 * Requires CRON_SECRET for auth.
 */
export async function POST(request: NextRequest) {
  // Auth: one-time secret embedded for this single reset
  const resetToken = request.headers.get('x-reset-token');
  if (resetToken !== 'kickscan-fresh-start-2026-03-22') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: string[] = [];

  try {
    // Step 1: Delete all predictions
    const { error: predError, count: predCount } = await supabaseAdmin
      .from('predictions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all (neq dummy to match all)

    if (predError) {
      results.push(`❌ Predictions delete failed: ${predError.message}`);
    } else {
      results.push(`✅ Predictions deleted`);
    }

    // Step 2: Reset user stats
    const { error: userError } = await supabaseAdmin
      .from('users')
      .update({
        total_points: 0,
        total_predictions: 0,
        correct_results: 0,
        correct_scores: 0,
        current_streak: 0,
        best_streak: 0,
        boosters_used_today: 0,
        last_booster_date: null,
      })
      .neq('id', '00000000-0000-0000-0000-000000000000'); // update all

    if (userError) {
      results.push(`❌ User stats reset failed: ${userError.message}`);
    } else {
      results.push(`✅ User stats reset to 0`);
    }

    // Step 3: Clear cron locks
    const { error: lockError } = await supabaseAdmin
      .from('cron_locks')
      .update({ locked_at: null, locked_by: null })
      .eq('id', 'settlement');

    if (lockError) {
      results.push(`❌ Cron lock clear failed: ${lockError.message}`);
    } else {
      results.push(`✅ Cron locks cleared`);
    }

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message, results }, { status: 500 });
  }
}
