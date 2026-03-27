import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { allMatches, getKickoffISO } from "@/data/matches";

function isValidScore(score: string): boolean {
  return /^\d+-\d+$/.test(score);
}

function hasMatchStarted(matchId: string): boolean {
  if (matchId.startsWith('wc_')) {
    const numericId = Number(matchId.replace('wc_', ''));
    const match = allMatches.find(m => m.id === numericId);
    if (match) {
      const kickoff = new Date(getKickoffISO(match.date, match.time));
      const now = new Date();
      return now >= new Date(kickoff.getTime() - 5 * 60 * 1000);
    }
  }
  return false;
}

/**
 * Derive fixture date from the match's CALENDAR date (not UTC).
 * "June 11 at 10PM ET" = fixture date June 11 (the matchday), not June 12 UTC.
 */
function deriveFixtureDate(matchId: string, frontendHint?: string): string | null {
  if (matchId.startsWith('wc_')) {
    const numericId = Number(matchId.replace('wc_', ''));
    const match = allMatches.find(m => m.id === numericId);
    if (match) {
      // Use the calendar date from match data (e.g. "June 11" → "2026-06-11")
      const months: Record<string, string> = {
        "January": "01", "February": "02", "March": "03", "April": "04",
        "May": "05", "June": "06", "July": "07", "August": "08",
        "September": "09", "October": "10", "November": "11", "December": "12"
      };
      const parts = match.date.split(" ");
      const month = months[parts[0]] || "06";
      const day = parts[1].padStart(2, "0");
      return `2026-${month}-${day}`;
    }
  }
  if (frontendHint && /^\d{4}-\d{2}-\d{2}$/.test(frontendHint)) {
    return frontendHint;
  }
  return null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const matchId = searchParams.get("matchId");

    if (!userId || !matchId) {
      return NextResponse.json({ error: "userId and matchId required" }, { status: 400 });
    }

    const { data: prediction, error } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ prediction: prediction || null });
  } catch (err) {
    console.error("GET prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, matchId, predictedResult, predictedScore, useBooster, homeTeam, awayTeam, marketFavorite, lockedOdds, fixtureDate: frontendFixtureDate } = body;

    if (!userId || !token || !matchId || !predictedResult) {
      return NextResponse.json({ error: "userId, token, matchId, and predictedResult required" }, { status: 400 });
    }
    if (!["home", "draw", "away"].includes(predictedResult)) {
      return NextResponse.json({ error: "predictedResult must be home, draw, or away" }, { status: 400 });
    }
    if (predictedScore && !isValidScore(predictedScore)) {
      return NextResponse.json({ error: "predictedScore must be in format '2-1' or empty" }, { status: 400 });
    }
    if (hasMatchStarted(matchId)) {
      return NextResponse.json({ error: "Cannot predict after match has started" }, { status: 400 });
    }

    const fixtureDate = deriveFixtureDate(matchId, frontendFixtureDate);

    // ── ROUND-TRIP 1: Auth + existing prediction + booster check IN PARALLEL ──
    const [userResult, predResult, boosterResult] = await Promise.all([
      // Auth
      supabaseAdmin.from('users').select('id, total_predictions').eq('id', token).single(),
      // Existing prediction for this match
      supabaseAdmin.from('predictions').select('*').eq('user_id', userId).eq('match_id', matchId).limit(1).single(),
      // Booster check: any boosted prediction on this fixture date (excluding this match)?
      fixtureDate && useBooster
        ? supabaseAdmin.from('predictions').select('match_id').eq('user_id', userId).eq('fixture_date', fixtureDate).eq('boosted', true).neq('match_id', matchId).limit(1)
        : Promise.resolve({ data: null, error: null })
    ]);

    const user = userResult.data;
    if (userResult.error || !user || user.id !== userId) {
      return NextResponse.json({ error: "Invalid user authentication. Please log in again." }, { status: 401 });
    }

    // Booster conflict check (already done in parallel)
    if (useBooster && boosterResult.data && boosterResult.data.length > 0) {
      return NextResponse.json({
        error: "You already used your booster on another match for this match day. Remove it first to move it here.",
        boosterConflictMatch: boosterResult.data[0].match_id
      }, { status: 400 });
    }

    const existingPrediction = predResult.error?.code === 'PGRST116' ? null : predResult.data;

    if (existingPrediction) {
      // ── ROUND-TRIP 2: Single UPDATE ──
      const updateData: any = {
        predicted_result: predictedResult,
        predicted_score: predictedScore || '',
        ...(lockedOdds && {
          locked_home_odds: lockedOdds.home,
          locked_draw_odds: lockedOdds.draw,
          locked_away_odds: lockedOdds.away,
        }),
        ...(fixtureDate && !existingPrediction.fixture_date && { fixture_date: fixtureDate }),
      };

      // Booster state
      if (useBooster && !existingPrediction.boosted) {
        updateData.boosted = true;
      } else if (!useBooster && existingPrediction.boosted) {
        updateData.boosted = false;
      }

      const { data: updatedPrediction, error: updateError } = await supabaseAdmin
        .from('predictions')
        .update(updateData)
        .eq('id', existingPrediction.id)
        .select()
        .single();

      if (updateError) {
        console.error("Error updating prediction:", updateError);
        return NextResponse.json({ error: "Failed to update prediction" }, { status: 500 });
      }

      // Determine booster status from what we know (no extra query)
      const effectiveFixtureDate = existingPrediction.fixture_date || fixtureDate;
      const boosterUsedOnDate = updatedPrediction.boosted || false;

      return NextResponse.json({
        prediction: updatedPrediction,
        boosterUsedOnDate,
        fixtureDate: effectiveFixtureDate,
        updated: true
      });

    } else {
      // ── ROUND-TRIP 2: Single INSERT ──
      const predictionData: any = {
        user_id: userId,
        match_id: matchId,
        predicted_result: predictedResult,
        predicted_score: predictedScore || '',
        boosted: useBooster || false,  // Set directly — booster conflict already checked
        created_at: new Date().toISOString(),
        settled: false,
        points_earned: 0,
        ...(fixtureDate && { fixture_date: fixtureDate }),
        ...(lockedOdds && {
          locked_home_odds: lockedOdds.home,
          locked_draw_odds: lockedOdds.draw,
          locked_away_odds: lockedOdds.away,
        }),
        ...(homeTeam && { home_team: homeTeam }),
        ...(awayTeam && { away_team: awayTeam }),
        ...(marketFavorite && { market_favorite: marketFavorite }),
      };

      const { data: newPrediction, error: insertError } = await supabaseAdmin
        .from('predictions')
        .insert(predictionData)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating prediction:", insertError);
        return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 });
      }

      // ── ROUND-TRIP 3: Update user stats (fire-and-forget, don't await) ──
      supabaseAdmin
        .from('users')
        .update({ total_predictions: (user.total_predictions || 0) + 1 })
        .eq('id', userId)
        .then(() => {});

      return NextResponse.json({
        prediction: newPrediction,
        boosterUsedOnDate: newPrediction.boosted || false,
        fixtureDate,
        created: true
      });
    }

  } catch (err) {
    console.error("POST prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, matchId } = body;

    if (!userId || !token || !matchId) {
      return NextResponse.json({ error: "userId, token, and matchId required" }, { status: 400 });
    }

    // Auth + find prediction in parallel
    const [userResult, predResult] = await Promise.all([
      supabaseAdmin.from('users').select('id, total_predictions').eq('id', token).single(),
      supabaseAdmin.from('predictions').select('*').eq('user_id', userId).eq('match_id', matchId).single()
    ]);

    if (userResult.error || !userResult.data || userResult.data.id !== userId) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }
    if (!predResult.data) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }
    if (predResult.data.settled) {
      return NextResponse.json({ error: "Cannot cancel a settled prediction" }, { status: 400 });
    }

    // Delete + decrement in parallel
    await Promise.all([
      supabaseAdmin.from('predictions').delete().eq('id', predResult.data.id),
      supabaseAdmin.from('users').update({ total_predictions: Math.max(0, (userResult.data.total_predictions || 1) - 1) }).eq('id', userId)
    ]);

    return NextResponse.json({ success: true, boosterRefunded: predResult.data.boosted });

  } catch (err) {
    console.error("DELETE prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
