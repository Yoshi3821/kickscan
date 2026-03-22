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
  
  return user.boosters_used_today < 1;
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, token, matchId, predictedResult, predictedScore, useBooster, homeTeam, awayTeam, marketFavorite } = body;

    // Validation
    if (!userId || !token || !matchId || !predictedResult) {
      return NextResponse.json({ 
        error: "userId, token, matchId, and predictedResult required" 
      }, { status: 400 });
    }

    // TODO: Re-enable prediction locking after odds data is populated
    // const { checkPredictionLock } = await import('@/lib/odds-manager');
    // const lockStatus = await checkPredictionLock(matchId);
    // if (lockStatus.isLocked) {
    //   return NextResponse.json({
    //     error: "Predictions are locked for this match (less than 5 minutes until kickoff)"
    //   }, { status: 400 });
    // }

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

    // Check booster usage
    if (useBooster) {
      const { data: freshUser } = await supabaseAdmin
        .from('users')
        .select('boosters_used_today, last_booster_date')
        .eq('id', userId)
        .single();
      
      if (freshUser) {
        const todayCheck = new Date().toISOString().split('T')[0];
        const currentUsed = freshUser.last_booster_date === todayCheck ? freshUser.boosters_used_today : 0;
        if (currentUsed >= 1) {
          return NextResponse.json({ 
            error: "Maximum 1 booster per day already used" 
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
        predicted_score: predictedScore || '',
        correct_score_entered: !!(predictedScore && predictedScore.trim()),
      };

      // Handle booster logic for updates
      if (useBooster && !existingPrediction.boosted) {
        if (!canUseBooster(user)) {
          return NextResponse.json({ 
            error: "Maximum 1 booster per day already used" 
          }, { status: 400 });
        }
        updateData.boosted = true;
        updateData.booster_used = true;

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
        const todayCheck = new Date().toISOString().split('T')[0];
        if (user.last_booster_date === todayCheck && user.boosters_used_today > 0) {
          await supabaseAdmin
            .from('users')
            .update({
              boosters_used_today: user.boosters_used_today - 1
            })
            .eq('id', userId);
        }
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

      const remainingBoosters = Math.max(0, 1 - (user.boosters_used_today || 0));

      return NextResponse.json({
        prediction: updatedPrediction,
        boostersRemaining: remainingBoosters,
        updated: true
      });

    } else {
      // Create new prediction
      const basePredictionData: any = {
        user_id: userId,
        match_id: matchId,
        predicted_result: predictedResult,
        predicted_score: predictedScore || '',
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

      // Update user's total predictions only
      const { error: userUpdateError } = await supabaseAdmin
        .from('users')
        .update({ 
          total_predictions: (user.total_predictions || 0) + 1 
        })
        .eq('id', userId);

      if (userUpdateError) {
        console.error("Error updating user stats:", userUpdateError);
      }

      const remainingBoosters = 1;

      return NextResponse.json({
        prediction: newPrediction,
        boostersRemaining: remainingBoosters,
        created: true
      });
    }

  } catch (err) {
    console.error("POST prediction error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}}l server error" }, { status: 500 });
  }
}}r error" }, { status: 500 });
  }
}}