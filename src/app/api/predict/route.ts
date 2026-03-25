import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { allMatches, getKickoffISO } from "@/data/matches";

interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  predicted_result: "home" | "draw" | "away";
  predicted_score: string;
  boosted: boolean;
  created_at: string;
  settled: boolean;
  actual_result?: "home" | "draw" | "away" | null;
  actual_score?: string | null;
  points_earned: number;
  fixture_date?: string;
}

interface User {
  id: string;
  boosters_used_today: number;
  last_booster_date: string;
  total_predictions: number;
}

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
 * Derive the fixture date (YYYY-MM-DD) for a match.
 * Backend is authoritative — frontend hint is only used as fallback for league matches.
 */
function deriveFixtureDate(matchId: string, frontendHint?: string): string | null {
  // WC matches — derive from static match data (authoritative)
  if (matchId.startsWith('wc_')) {
    const numericId = Number(matchId.replace('wc_', ''));
    const match = allMatches.find(m => m.id === numericId);
    if (match) {
      // getKickoffISO returns e.g. "2026-06-11T19:00:00Z"
      const iso = getKickoffISO(match.date, match.time);
      return iso.split('T')[0]; // "2026-06-11"
    }
  }

  // League matches — use frontend hint (kickoff ISO date portion)
  // Frontend derives this from the fixture's kickoff time, which is authoritative
  if (frontendHint && /^\d{4}-\d{2}-\d{2}$/.test(frontendHint)) {
    return frontendHint;
  }

  // Last resort: no fixture date available
  return null;
}

/**
 * Check if user already has a boosted prediction on a given fixture date.
 * Returns the match_id of the existing boosted prediction, or null.
 */
async function getExistingBoostForDate(
  userId: string, 
  fixtureDate: string, 
  excludeMatchId?: string
): Promise<string | null> {
  let query = supabaseAdmin
    .from('predictions')
    .select('match_id')
    .eq('user_id', userId)
    .eq('fixture_date', fixtureDate)
    .eq('boosted', true)
    .limit(1);

  if (excludeMatchId) {
    query = query.neq('match_id', excludeMatchId);
  }

  const { data } = await query;
  return data && data.length > 0 ? data[0].match_id : null;
}

/**
 * Race-safe booster claim: after setting boosted=true on our prediction,
 * verify we're the only boosted prediction for this fixture date.
 * If a race caused two, undo ours and return false.
 */
async function verifyBoosterExclusive(
  userId: string,
  fixtureDate: string,
  predictionId: string
): Promise<boolean> {
  const { data: boostedRows } = await supabaseAdmin
    .from('predictions')
    .select('id, created_at')
    .eq('user_id', userId)
    .eq('fixture_date', fixtureDate)
    .eq('boosted', true)
    .order('created_at', { ascending: true });

  if (!boostedRows || boostedRows.length <= 1) {
    return true; // We're the only one — good
  }

  // Race detected! Multiple boosted predictions for same fixture date.
  // Keep the earliest one, undo the rest.
  const keepId = boostedRows[0].id;
  if (keepId === predictionId) {
    // We won the race — undo the others
    const otherIds = boostedRows.slice(1).map(r => r.id);
    await supabaseAdmin
      .from('predictions')
      .update({ boosted: false })
      .in('id', otherIds);
    return true;
  } else {
    // We lost the race — undo ours
    await supabaseAdmin
      .from('predictions')
      .update({ boosted: false })
      .eq('id', predictionId);
    return false;
  }
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
      console.error("Error fetching prediction:", error);
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

    // Validation
    if (!userId || !token || !matchId || !predictedResult) {
      return NextResponse.json({ 
        error: "userId, token, matchId, and predictedResult required" 
      }, { status: 400 });
    }

    if (!["home", "draw", "away"].includes(predictedResult)) {
      return NextResponse.json({ 
        error: "predictedResult must be home, draw, or away" 
      }, { status: 400 });
    }

    if (predictedScore && !isValidScore(predictedScore)) {
      return NextResponse.json({ 
        error: "predictedScore must be in format '2-1' or empty" 
      }, { status: 400 });
    }

    if (hasMatchStarted(matchId)) {
      return NextResponse.json({ 
        error: "Cannot predict after match has started" 
      }, { status: 400 });
    }

    // Derive fixture date — backend authoritative, frontend as fallback
    const fixtureDate = deriveFixtureDate(matchId, frontendFixtureDate);

    // Validate user token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', token)
      .single();

    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ 
        error: "Invalid user authentication. Please log in again." 
      }, { status: 401 });
    }

    // Check for existing prediction(s) - handle duplicates
    const { data: existingPredictions, error: predError } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .order('created_at', { ascending: false });

    const existingPrediction = existingPredictions?.[0] || null;
    
    // Clean up duplicates if any exist
    if (existingPredictions && existingPredictions.length > 1) {
      const dupeIds = existingPredictions.slice(1).map(p => p.id);
      await supabaseAdmin
        .from('predictions')
        .delete()
        .in('id', dupeIds);
    }

    const now = new Date().toISOString();

    if (existingPrediction) {
      // === UPDATE existing prediction ===
      const updateData: any = {
        predicted_result: predictedResult,
        predicted_score: predictedScore || '',
        ...(lockedOdds && {
          locked_home_odds: lockedOdds.home,
          locked_draw_odds: lockedOdds.draw,
          locked_away_odds: lockedOdds.away,
        }),
        // Backfill fixture_date if missing
        ...(fixtureDate && !existingPrediction.fixture_date && { fixture_date: fixtureDate }),
      };

      const effectiveFixtureDate = existingPrediction.fixture_date || fixtureDate;

      // --- Booster logic (fixture-date based) ---
      if (useBooster && !existingPrediction.boosted) {
        // Check if user already has a booster on another match for this fixture date
        if (effectiveFixtureDate) {
          const conflictMatch = await getExistingBoostForDate(userId, effectiveFixtureDate, matchId);
          if (conflictMatch) {
            return NextResponse.json({ 
              error: "You already used your booster on another match for this match day. Remove it first to move it here.",
              boosterConflictMatch: conflictMatch
            }, { status: 400 });
          }
        }
        updateData.boosted = true;

      } else if (!useBooster && existingPrediction.boosted) {
        // Removing booster — always allowed before lock
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

      // Race-safety: if we just set boosted=true, verify exclusivity
      if (useBooster && !existingPrediction.boosted && effectiveFixtureDate) {
        const isExclusive = await verifyBoosterExclusive(userId, effectiveFixtureDate, existingPrediction.id);
        if (!isExclusive) {
          // Our booster was undone by race resolution
          updatedPrediction.boosted = false;
        }
      }

      // Check booster availability for this fixture date
      const boosterUsedOnDate = effectiveFixtureDate
        ? !!(await getExistingBoostForDate(userId, effectiveFixtureDate))
        : false;

      return NextResponse.json({
        prediction: updatedPrediction,
        boosterUsedOnDate,
        fixtureDate: effectiveFixtureDate,
        updated: true
      });

    } else {
      // === CREATE new prediction ===
      const basePredictionData: any = {
        user_id: userId,
        match_id: matchId,
        predicted_result: predictedResult,
        predicted_score: predictedScore || '',
        boosted: false, // Start without booster — claim below if requested
        created_at: now,
        settled: false,
        points_earned: 0,
        ...(fixtureDate && { fixture_date: fixtureDate }),
        ...(lockedOdds && {
          locked_home_odds: lockedOdds.home,
          locked_draw_odds: lockedOdds.draw,
          locked_away_odds: lockedOdds.away,
        }),
      };

      const newPredictionData: any = {
        ...basePredictionData,
        ...(homeTeam && { home_team: homeTeam }),
        ...(awayTeam && { away_team: awayTeam }),
        ...(marketFavorite && { market_favorite: marketFavorite })
      };

      // Insert prediction (without booster first for safety)
      let newPrediction;
      let insertError;

      const result1 = await supabaseAdmin
        .from('predictions')
        .insert(newPredictionData)
        .select()
        .single();

      if (result1.error && (homeTeam || awayTeam)) {
        const result2 = await supabaseAdmin
          .from('predictions')
          .insert(basePredictionData)
          .select()
          .single();
        newPrediction = result2.data;
        insertError = result2.error;
      } else {
        newPrediction = result1.data;
        insertError = result1.error;
      }

      if (insertError) {
        console.error("Error creating prediction:", insertError);
        return NextResponse.json({ error: "Failed to create prediction" }, { status: 500 });
      }

      // Now claim booster if requested
      let boosterClaimed = false;
      if (useBooster && fixtureDate) {
        // Check for existing booster on this fixture date
        const conflictMatch = await getExistingBoostForDate(userId, fixtureDate, matchId);
        if (!conflictMatch) {
          // No conflict — set boosted
          await supabaseAdmin
            .from('predictions')
            .update({ boosted: true })
            .eq('id', newPrediction.id);

          // Race-safety: verify we're still the only one
          const isExclusive = await verifyBoosterExclusive(userId, fixtureDate, newPrediction.id);
          if (isExclusive) {
            newPrediction.boosted = true;
            boosterClaimed = true;
          }
          // If not exclusive, verifyBoosterExclusive already undid our boost
        }
      }

      // Update user's total predictions
      await supabaseAdmin
        .from('users')
        .update({ total_predictions: (user.total_predictions || 0) + 1 })
        .eq('id', userId);

      // Check booster availability for this fixture date
      const boosterUsedOnDate = fixtureDate
        ? !!(await getExistingBoostForDate(userId, fixtureDate))
        : false;

      return NextResponse.json({
        prediction: newPrediction,
        boosterUsedOnDate,
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

    // Validate user
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('id, total_predictions')
      .eq('id', token)
      .single();

    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Invalid authentication" }, { status: 401 });
    }

    // Find the prediction
    const { data: prediction } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    if (!prediction) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    if (prediction.settled) {
      return NextResponse.json({ error: "Cannot cancel a settled prediction" }, { status: 400 });
    }

    // Delete
    await supabaseAdmin
      .from('predictions')
      .delete()
      .eq('id', prediction.id);

    // Decrement total_predictions
    await supabaseAdmin
      .from('users')
      .update({ total_predictions: Math.max(0, (user.total_predictions || 1) - 1) })
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      boosterRefunded: prediction.boosted
    });

  } catch (err) {
    console.error("DELETE prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
