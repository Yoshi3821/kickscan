import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface LeaderboardEntry {
  rank: number;
  username: string;
  totalPoints: number;
  predictions: number;
  winRate: number;
  streak: number;
  isAI: boolean;
}

// KickScan AI virtual participant — always present in leaderboard
const KICKSCAN_AI: Omit<LeaderboardEntry, 'rank'> = {
  username: "kickscan_ai",
  totalPoints: 0, // Will accumulate once WC matches are settled
  predictions: 72,
  winRate: 0,
  streak: 0,
  isAI: true,
};

function injectAI(leaderboard: LeaderboardEntry[]): LeaderboardEntry[] {
  // Only inject if not already present from DB
  const hasAI = leaderboard.some(e => e.isAI || e.username === "kickscan_ai" || e.username === "kickscan ai");
  if (hasAI) return leaderboard;

  // Insert AI by points, then re-rank
  const all = [...leaderboard.map(e => ({ ...e })), { ...KICKSCAN_AI, rank: 0 }];
  all.sort((a, b) => b.totalPoints - a.totalPoints);
  return all.map((e, i) => ({ ...e, rank: i + 1 }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const competition = searchParams.get('competition');

    if (competition === 'wc2026') {
      // WC 2026 leaderboard - calculate from predictions table
      const { data: wcStats, error } = await supabaseAdmin
        .from('predictions')
        .select(`
          user_id,
          points_earned,
          users!inner(username)
        `)
        .like('match_id', 'wc_%')
        .not('points_earned', 'is', null);

      if (error) {
        console.error("Error fetching WC leaderboard:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Group by user and sum points
      const userPoints = new Map();
      (wcStats || []).forEach((prediction: any) => {
        const userId = prediction.user_id;
        const username = prediction.users.username;
        const points = prediction.points_earned || 0;

        if (!userPoints.has(userId)) {
          userPoints.set(userId, { 
            username, 
            totalPoints: 0, 
            predictions: 0,
            correctResults: 0 
          });
        }

        const user = userPoints.get(userId);
        user.totalPoints += points;
        user.predictions += 1;
        if (points > 0) user.correctResults += 1;
      });

      // Convert to leaderboard format and sort
      const leaderboard: LeaderboardEntry[] = Array.from(userPoints.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((user, index) => ({
          rank: index + 1,
          username: user.username,
          totalPoints: user.totalPoints,
          predictions: user.predictions,
          winRate: user.predictions > 0 ? Math.round((user.correctResults / user.predictions) * 100) : 0,
          streak: 0, // Not calculated for competition-specific
          isAI: user.username === "kickscan ai"
        }));

      return NextResponse.json({
        leaderboard: injectAI(leaderboard),
        totalPlayers: leaderboard.length + 1
      });

    } else if (competition === 'league') {
      // League leaderboard - calculate from predictions table
      const { data: leagueStats, error } = await supabaseAdmin
        .from('predictions')
        .select(`
          user_id,
          points_earned,
          users!inner(username)
        `)
        .like('match_id', 'league_%')
        .not('points_earned', 'is', null);

      if (error) {
        console.error("Error fetching League leaderboard:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Group by user and sum points
      const userPoints = new Map();
      (leagueStats || []).forEach((prediction: any) => {
        const userId = prediction.user_id;
        const username = prediction.users.username;
        const points = prediction.points_earned || 0;

        if (!userPoints.has(userId)) {
          userPoints.set(userId, { 
            username, 
            totalPoints: 0, 
            predictions: 0,
            correctResults: 0 
          });
        }

        const user = userPoints.get(userId);
        user.totalPoints += points;
        user.predictions += 1;
        if (points > 0) user.correctResults += 1;
      });

      // Convert to leaderboard format and sort
      const leaderboard: LeaderboardEntry[] = Array.from(userPoints.values())
        .sort((a, b) => b.totalPoints - a.totalPoints)
        .map((user, index) => ({
          rank: index + 1,
          username: user.username,
          totalPoints: user.totalPoints,
          predictions: user.predictions,
          winRate: user.predictions > 0 ? Math.round((user.correctResults / user.predictions) * 100) : 0,
          streak: 0, // Not calculated for competition-specific
          isAI: user.username === "kickscan ai"
        }));

      return NextResponse.json({
        leaderboard: injectAI(leaderboard),
        totalPlayers: leaderboard.length + 1
      });

    } else {
      // Overall leaderboard (existing functionality)
      const { data: users, error } = await supabaseAdmin
        .from('users')
        .select('username, total_points, total_predictions, correct_results, current_streak')
        .order('total_points', { ascending: false })
        .limit(50);

      if (error) {
        console.error("Error fetching leaderboard:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      if (!users || users.length === 0) {
        return NextResponse.json({
          leaderboard: [],
          totalPlayers: 0
        });
      }

      // Generate leaderboard entries
      const leaderboard: LeaderboardEntry[] = users.map((user, index) => {
        const winRate = user.total_predictions > 0 
          ? Math.round((user.correct_results / user.total_predictions) * 100) 
          : 0;

        return {
          rank: index + 1,
          username: user.username,
          totalPoints: user.total_points,
          predictions: user.total_predictions,
          winRate,
          streak: user.current_streak,
          isAI: user.username === "kickscan ai"
        };
      });

      return NextResponse.json({
        leaderboard: injectAI(leaderboard),
        totalPlayers: users.length + 1
      });
    }

  } catch (err) {
    console.error("Leaderboard error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}