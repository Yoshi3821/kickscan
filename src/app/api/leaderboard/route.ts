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

// Seeded/placeholder accounts to exclude from production leaderboards
const BLOCKED_USERNAMES = new Set([
  "betmaster99", "cr7forever", "dragonking", "footballgeek", "goalhunter",
  "penaltyking", "strikerace", "winstreak", "messigoat", "neymarjr",
  "ronaldofan", "haalandfan", "mbappefan", "salahking", "brunogoat",
  "messifanatic", "scoreprophet", "tacticsmaster", "wcfan2026",
]);

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
      // WC 2026 leaderboard - show ALL registered users (even with 0 pts)
      // This creates pre-tournament engagement
      
      // Get all registered users
      const { data: allUsers, error: usersError } = await supabaseAdmin
        .from('users')
        .select('id, username, created_at')
        .order('created_at', { ascending: true })
        .limit(100);

      if (usersError) {
        console.error("Error fetching users for WC leaderboard:", usersError);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      // Get WC prediction stats
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
        console.error("Error fetching WC predictions:", error);
      }

      // Build points map from WC predictions
      const userPoints = new Map();
      (wcStats || []).forEach((prediction: any) => {
        const userId = prediction.user_id;
        const points = prediction.points_earned || 0;

        if (!userPoints.has(userId)) {
          userPoints.set(userId, { totalPoints: 0, predictions: 0, correctResults: 0 });
        }

        const stats = userPoints.get(userId);
        stats.totalPoints += points;
        stats.predictions += 1;
        if (points > 0) stats.correctResults += 1;
      });

      // Merge all users with their WC stats (0 pts if no predictions)
      // Filter out seeded/placeholder accounts
      const leaderboard: LeaderboardEntry[] = (allUsers || [])
        .filter((user: any) => !BLOCKED_USERNAMES.has(user.username?.toLowerCase()))
        .map((user: any) => {
          const stats = userPoints.get(user.id) || { totalPoints: 0, predictions: 0, correctResults: 0 };
          return {
            rank: 0,
            username: user.username,
            totalPoints: stats.totalPoints,
            predictions: stats.predictions,
            winRate: stats.predictions > 0 ? Math.round((stats.correctResults / stats.predictions) * 100) : 0,
            streak: 0,
            isAI: user.username === "kickscan ai"
          };
        })
        .sort((a: LeaderboardEntry, b: LeaderboardEntry) => {
          if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
          return a.username.localeCompare(b.username); // Alphabetical tiebreak
        })
        .map((entry: LeaderboardEntry, index: number) => ({ ...entry, rank: index + 1 }));

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

      // Convert to leaderboard format, filter blocked, and sort
      const leaderboard: LeaderboardEntry[] = Array.from(userPoints.values())
        .filter((user) => !BLOCKED_USERNAMES.has(user.username?.toLowerCase()))
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

      // Generate leaderboard entries — filter blocked accounts
      const leaderboard: LeaderboardEntry[] = (users || [])
        .filter((user: any) => !BLOCKED_USERNAMES.has(user.username?.toLowerCase()))
        .map((user: any, index: number) => {
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