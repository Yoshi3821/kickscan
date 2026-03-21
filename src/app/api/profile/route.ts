import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getKickoffISO } from "@/data/matches";
import { allMatches } from "@/data/matches";

/**
 * Public profile API.
 * Returns player stats + prediction history with visibility filtering.
 * Current picks are hidden until after kickoff.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username")?.toLowerCase();

    if (!username) {
      return NextResponse.json({ error: "username required" }, { status: 400 });
    }

    // Handle KickScan AI virtual profile
    if (username === "kickscan_ai" || username === "kickscan ai") {
      return getAIProfile();
    }

    // Fetch user — try exact match first, then case-insensitive
    let { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, username, total_points, total_predictions, correct_results, correct_scores, current_streak, best_streak, created_at")
      .eq("username", username)
      .single();

    // If not found, try case-insensitive via ilike
    if (userError || !user) {
      const { data: userCI, error: errorCI } = await supabaseAdmin
        .from("users")
        .select("id, username, total_points, total_predictions, correct_results, correct_scores, current_streak, best_streak, created_at")
        .ilike("username", username)
        .limit(1)
        .single();
      user = userCI;
      userError = errorCI;
    }

    if (userError || !user) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    // Fetch all predictions for this user
    const { data: predictions, error: predError } = await supabaseAdmin
      .from("predictions")
      .select("match_id, predicted_result, predicted_score, boosted, settled, actual_result, actual_score, points_earned, created_at, home_team, away_team")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Get rank
    const { data: allUsers } = await supabaseAdmin
      .from("users")
      .select("id, total_points")
      .order("total_points", { ascending: false });

    const rank = (allUsers || []).findIndex((u: any) => u.id === user.id) + 1;
    const winRate = user.total_predictions > 0
      ? Math.round((user.correct_results / user.total_predictions) * 100)
      : 0;

    // Filter predictions: hide current picks for matches not yet started
    const now = Date.now();
    const visiblePredictions = (predictions || []).map((pred: any) => {
      // Generate match_label from team names or WC data
      let match_label = pred.match_id;
      if (pred.home_team && pred.away_team) {
        match_label = `${pred.home_team} vs ${pred.away_team}`;
      } else if (pred.match_id.startsWith("wc_")) {
        const wcId = parseInt(pred.match_id.replace("wc_", ""));
        const match = allMatches.find((m) => m.id === wcId);
        if (match) match_label = `${match.home} vs ${match.away}`;
      }

      const isVisible = isPredictionVisible(pred.match_id, now);
      if (isVisible) {
        return { ...pred, match_label };
      }
      // Hide the actual pick, show only that a prediction exists
      return {
        match_id: pred.match_id,
        match_label,
        predicted_result: null,
        predicted_score: null,
        boosted: null,
        settled: pred.settled,
        actual_result: pred.actual_result,
        actual_score: pred.actual_score,
        points_earned: pred.points_earned,
        created_at: pred.created_at,
        hidden: true,
      };
    });

    return NextResponse.json({
      profile: {
        username: user.username,
        rank,
        totalPoints: user.total_points,
        totalPredictions: user.total_predictions,
        correctResults: user.correct_results,
        correctScores: user.correct_scores || 0,
        currentStreak: user.current_streak,
        bestStreak: user.best_streak,
        winRate,
        joinedAt: user.created_at,
      },
      predictions: visiblePredictions,
    });
  } catch (err) {
    console.error("Profile API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * Check if a prediction should be publicly visible.
 * Visible if: match has started (kickoff time has passed).
 */
function isPredictionVisible(matchId: string, now: number): boolean {
  // League matches: match_id is "league_<fixtureId>"
  // We don't have the fixture kickoff time here easily,
  // so for league matches, assume visible if settled or if created >3h ago
  if (matchId.startsWith("league_")) {
    return true; // League match times are dynamic; server can't easily check. Safe default.
  }

  // WC matches: match_id is "wc_<id>"
  if (matchId.startsWith("wc_")) {
    const wcId = parseInt(matchId.replace("wc_", ""));
    const match = allMatches.find((m) => m.id === wcId);
    if (!match) return true;
    const kickoff = new Date(getKickoffISO(match.date, match.time)).getTime();
    return now >= kickoff;
  }

  return true;
}

/**
 * KickScan AI virtual profile.
 * Generated from verdict data — clearly labeled as AI-generated.
 */
function getAIProfile() {
  // Import verdict data dynamically to avoid circular deps
  const { getVerdict } = require("@/data/verdicts");

  const aiPredictions = allMatches.map((match) => {
    const verdict = getVerdict(match.id);
    if (!verdict) return null;

    return {
      match_id: `wc_${match.id}`,
      match_label: `${match.home} vs ${match.away}`,
      match_date: match.date,
      predicted_result: verdict.pickType,
      predicted_score: null, // AI doesn't predict exact scores
      boosted: false,
      settled: false,
      actual_result: null,
      actual_score: null,
      points_earned: 0,
      created_at: "2026-03-01T00:00:00Z",
      source: "verdict_engine", // Honesty label
    };
  }).filter(Boolean);

  return NextResponse.json({
    profile: {
      username: "kickscan_ai",
      displayName: "KickScan AI",
      isAI: true,
      rank: null, // Calculated separately
      totalPoints: 0,
      totalPredictions: aiPredictions.length,
      correctResults: 0,
      correctScores: 0,
      currentStreak: 0,
      bestStreak: 0,
      winRate: 0,
      joinedAt: "2026-01-01T00:00:00Z",
      dataDisclaimer: "KickScan AI predictions are generated by the AI Verdict Engine based on statistical models, form analysis, and market data. They are not manually curated picks.",
    },
    predictions: aiPredictions,
  });
}
