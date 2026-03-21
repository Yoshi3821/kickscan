import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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
  // For WC matches (numeric IDs 1-72), assume they haven't started yet since it's 2026
  const numericId = Number(matchId.replace('wc_', '').replace('league_', ''));
  if (!isNaN(numericId) && numericId >= 1 && numericId <= 72) {
    // WC matches start June 11, 2026 - for now, all are in the future
    return false;
  }
  
  // For league matches, we'd need to check fixture times
  // For MVP, assume all matches are still open for predictions
  return false;
}

function canUseBooster(user: User): boolean {
  const today = new Date().toISOString().split('T')[0];
  
  // Reset daily boosters if it's a new day
  if (user.last_booster_date !== today) {
    return true; // New day, so they get fresh boosters
  }
  
  return user.boosters_used_today < 2;
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

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error("Error fetching prediction:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ prediction: prediction || null });

  } catch (err) {
    console.error("GET prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/predict — cancel a pending prediction
 * Body: { userId, token, matchId }
 * Only allowed if match hasn't started (>5 min to kickoff).
 */
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
      .select('id, total_predictions, boosters_used_today, last_booster_date')
      .eq('id', token)
      .single();

    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Fetch the prediction
    const { data: prediction, error: predError } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    if (predError || !prediction) {
      return NextResponse.json({ error: "Prediction not found" }, { status: 404 });
    }

    // Cannot cancel settled predictions
    if (prediction.settled) {
      return NextResponse.json({ error: "Cannot cancel a settled prediction" }, { status: 400 });
    }

    // Check kickoff time — for league matches, use the fixture API
    if (matchId.startsWith('league_')) {
      const fixtureId = matchId.replace('league_', '');
      try {
        const res = await fetch(
          `https://v3.football.api-sports.io/fixtures?id=${fixtureId}`,
          {
            headers: { 'x-apisports-key': '3408fed656308fb4ade76a6b3212a975' },
            next: { revalidate: 300 }
          }
        );
        const data = await res.json();
        const fixture = data.response?.[0];
        if (fixture) {
          const status = fixture.fixture?.status?.short || 'NS';
          if (['1H', '2H', 'HT', 'ET', 'P', 'FT', 'AET', 'PEN', 'LIVE', 'BT'].includes(status)) {
            return NextResponse.json({ error: "Match is live or finished — cannot cancel" }, { status: 400 });
          }
          const kickoff = new Date(fixture.fixture?.date).getTime();
          const now = Date.now();
          if (now >= kickoff - 5 * 60 * 1000) {
            return NextResponse.json({ error: "Too late — match starts in less than 5 minutes" }, { status: 400 });
          }
        }
      } catch {
        // If we can't verify, allow cancel (safe default for user)
      }
    }

    // Delete the prediction
    const { error: deleteError } = await supabaseAdmin
      .from('predictions')
      .delete()
      .eq('id', prediction.id);

    if (deleteError) {
      console.error("Error deleting prediction:", deleteError);
      return NextResponse.json({ error: "Failed to cancel prediction" }, { status: 500 });
    }

    // Update user stats — decrement total_predictions
    const newTotal = Math.max(0, (user.total_predictions || 1) - 1);
    const userUpdates: any = { total_predictions: newTotal };

    // Refund booster if applicable (same day)
    const today = new Date().toISOString().split('T')[0];
    if (prediction.boosted && user.last_booster_date === today && user.boosters_used_today > 0) {
      userUpdates.boosters_used_today = user.boosters_used_today - 1;
    }

    await supabaseAdmin
      .from('users')
      .update(userUpdates)
      .eq('id', userId);

    return NextResponse.json({
      success: true,
      cancelled: matchId,
      boosterRefunded: !!prediction.boosted && userUpdates.boosters_used_today !== undefined
    });

  } catch (err) {
    console.error("DELETE prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, matchId, predictedResult, predictedScore, useBooster, homeTeam, awayTeam, marketFavorite } = body;

    // Validation
    if (!userId || !token || !matchId || !predictedResult || !predictedScore) {
      return NextResponse.json({ 
        error: "userId, token, matchId, predictedResult, and predictedScore required" 
      }, { status: 400 });
    }

    if (!["home", "draw", "away"].includes(predictedResult)) {
      return NextResponse.json({ 
        error: "predictedResult must be home, draw, or away" 
      }, { status: 400 });
    }

    if (!isValidScore(predictedScore)) {
      return NextResponse.json({ 
        error: "predictedScore must be in format '2-1'" 
      }, { status: 400 });
    }

    // Check if match has started
    if (hasMatchStarted(matchId)) {
      return NextResponse.json({ 
        error: "Cannot predict after match has started" 
      }, { status: 400 });
    }

    // Validate user token
    const { data: user, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', token) // token is the user ID
      .single();

    if (userError || !user || user.id !== userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Check booster usage — re-fetch fresh count to prevent race condition
    if (useBooster) {
      const { data: freshUser } = await supabaseAdmin
        .from('users')
        .select('boosters_used_today, last_booster_date')
        .eq('id', userId)
        .single();
      
      if (freshUser) {
        const todayCheck = new Date().toISOString().split('T')[0];
        const currentUsed = freshUser.last_booster_date === todayCheck ? freshUser.boosters_used_today : 0;
        if (currentUsed >= 2) {
          return NextResponse.json({ 
            error: "Maximum 2 boosters per day already used" 
          }, { status: 400 });
        }
      }
    }

    // Check for existing prediction
    const { data: existingPrediction, error: predError } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('user_id', userId)
      .eq('match_id', matchId)
      .single();

    const now = new Date().toISOString();
    const today = now.split('T')[0];

    if (existingPrediction) {
      // Update existing prediction
      const updateData: any = {
        predicted_result: predictedResult,
        predicted_score: predictedScore,
      };

      // Handle booster logic for updates
      if (useBooster && !existingPrediction.boosted) {
        if (!canUseBooster(user)) {
          return NextResponse.json({ 
            error: "Maximum 2 boosters per day already used" 
          }, { status: 400 });
        }
        updateData.boosted = true;

        // Update user's booster count
        const newBoostersUsed = user.last_booster_date === today ? user.boosters_used_today + 1 : 1;
        await supabaseAdmin
          .from('users')
          .update({
            boosters_used_today: newBoostersUsed,
            last_booster_date: today
          })
          .eq('id', userId);

      } else if (!useBooster && existingPrediction.boosted) {
        // Removing booster - give it back if same day
        updateData.boosted = false;
        if (user.last_booster_date === today && user.boosters_used_today > 0) {
          await supabaseAdmin
            .from('users')
            .update({
              boosters_used_today: user.boosters_used_today - 1
            })
            .eq('id', userId);
        }
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

      // Get updated user data to calculate remaining boosters
      const { data: updatedUser } = await supabaseAdmin
        .from('users')
        .select('boosters_used_today, last_booster_date')
        .eq('id', userId)
        .single();

      const remainingBoosters = (updatedUser?.last_booster_date === today) 
        ? 2 - (updatedUser?.boosters_used_today || 0)
        : 2;

      return NextResponse.json({
        success: true,
        prediction: updatedPrediction,
        boostersRemaining: remainingBoosters,
        updated: true
      });

    } else {
      // Create new prediction
      // Note: home_team and away_team columns may not exist yet.
      // If they don't exist, Supabase will reject the insert with those fields.
      // So we try with team names first, and fall back without them.
      const basePredictionData: any = {
        user_id: userId,
        match_id: matchId,
        predicted_result: predictedResult,
        predicted_score: predictedScore,
        boosted: useBooster || false,
        created_at: now,
        settled: false,
        points_earned: 0
      };

      const newPredictionData: any = {
        ...basePredictionData,
        ...(homeTeam && { home_team: homeTeam }),
        ...(awayTeam && { away_team: awayTeam }),
        ...(marketFavorite && { market_favorite: marketFavorite })
      };

      let newPrediction;
      let insertError;

      // Try insert with team name columns first
      const result1 = await supabaseAdmin
        .from('predictions')
        .insert(newPredictionData)
        .select()
        .single();

      if (result1.error && (homeTeam || awayTeam)) {
        // Columns may not exist yet — retry without team names
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

      // Update user stats
      const userUpdates: any = {
        total_predictions: user.total_predictions + 1
      };

      if (useBooster) {
        // Fresh read to prevent race condition
        const { data: freshBooster } = await supabaseAdmin
          .from('users')
          .select('boosters_used_today, last_booster_date')
          .eq('id', userId)
          .single();
        const currentUsed = freshBooster?.last_booster_date === today ? (freshBooster?.boosters_used_today || 0) : 0;
        userUpdates.boosters_used_today = currentUsed + 1;
        userUpdates.last_booster_date = today;
      }

      await supabaseAdmin
        .from('users')
        .update(userUpdates)
        .eq('id', userId);

      const remainingBoosters = userUpdates.boosters_used_today 
        ? 2 - userUpdates.boosters_used_today
        : 2;

      return NextResponse.json({
        success: true,
        prediction: newPrediction,
        boostersRemaining: remainingBoosters,
        created: true
      });
    }

  } catch (err) {
    console.error("POST prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}