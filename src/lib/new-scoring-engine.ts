// New odds-based scoring engine
import { supabaseAdmin } from './supabase';

interface MatchResult {
  homeGoals: number;
  awayGoals: number;
  result: 'home' | 'draw' | 'away';
}

interface PredictionToScore {
  id: string;
  userId: string;
  matchId: string;
  predictedResult: 'home' | 'draw' | 'away';
  predictedScore: string;
  boosterUsed: boolean;
  correctScoreEntered: boolean;
  lockedHomeOdds: number;
  lockedDrawOdds: number;
  lockedAwayOdds: number;
}

// Calculate 1X2 points based on odds bands
export function calculate1X2Points(odds: number): number {
  if (odds >= 1.01 && odds <= 1.29) return 1;
  if (odds >= 1.30 && odds <= 1.49) return 2;
  if (odds >= 1.50 && odds <= 1.74) return 3;
  if (odds >= 1.75 && odds <= 1.99) return 4;
  if (odds >= 2.00 && odds <= 2.29) return 5;
  if (odds >= 2.30 && odds <= 2.69) return 6;
  if (odds >= 2.70 && odds <= 3.19) return 7;
  if (odds >= 3.20 && odds <= 3.79) return 8;
  if (odds >= 3.80 && odds <= 4.49) return 9;
  if (odds >= 4.50 && odds <= 5.49) return 10;
  if (odds >= 5.50) return 11;
  return 0;
}

// Calculate correct score bonus based on total goals
export function calculateCSBonus(totalGoals: number): number {
  if (totalGoals === 0) return 4;
  if (totalGoals >= 1 && totalGoals <= 3) return 3;
  if (totalGoals >= 4 && totalGoals <= 6) return 5;
  if (totalGoals >= 7) return 7;
  return 0;
}

// Get points band description for display
export function getPointsBandDescription(odds: number): string {
  if (odds >= 1.01 && odds <= 1.29) return '1.01-1.29 = 1pt';
  if (odds >= 1.30 && odds <= 1.49) return '1.30-1.49 = 2pts';
  if (odds >= 1.50 && odds <= 1.74) return '1.50-1.74 = 3pts';
  if (odds >= 1.75 && odds <= 1.99) return '1.75-1.99 = 4pts';
  if (odds >= 2.00 && odds <= 2.29) return '2.00-2.29 = 5pts';
  if (odds >= 2.30 && odds <= 2.69) return '2.30-2.69 = 6pts';
  if (odds >= 2.70 && odds <= 3.19) return '2.70-3.19 = 7pts';
  if (odds >= 3.20 && odds <= 3.79) return '3.20-3.79 = 8pts';
  if (odds >= 3.80 && odds <= 4.49) return '3.80-4.49 = 9pts';
  if (odds >= 4.50 && odds <= 5.49) return '4.50-5.49 = 10pts';
  if (odds >= 5.50) return '5.50+ = 11pts';
  return 'Invalid odds';
}

// Parse score string to goals
function parseScore(scoreStr: string): { home: number; away: number } {
  const parts = scoreStr.split('-');
  return {
    home: parseInt(parts[0]) || 0,
    away: parseInt(parts[1]) || 0
  };
}

// Determine match result from score
function getMatchResult(homeGoals: number, awayGoals: number): 'home' | 'draw' | 'away' {
  if (homeGoals > awayGoals) return 'home';
  if (homeGoals < awayGoals) return 'away';
  return 'draw';
}

// Score a single prediction
export async function scorePrediction(
  prediction: PredictionToScore,
  actualResult: MatchResult
): Promise<{
  final1X2Points: number;
  finalCSPoints: number;
  finalTotalPoints: number;
  pointsBand: string;
}> {
  
  // 1. Calculate 1X2 points
  let final1X2Points = 0;
  let selectedOdds = 0;

  if (prediction.predictedResult === actualResult.result) {
    // Correct 1X2 prediction
    switch (prediction.predictedResult) {
      case 'home':
        selectedOdds = prediction.lockedHomeOdds;
        break;
      case 'draw':
        selectedOdds = prediction.lockedDrawOdds;
        break;
      case 'away':
        selectedOdds = prediction.lockedAwayOdds;
        break;
    }
    
    const basePoints = calculate1X2Points(selectedOdds);
    final1X2Points = prediction.boosterUsed ? basePoints * 2 : basePoints;
  } else {
    // Wrong 1X2 prediction
    final1X2Points = -1;
  }

  // 2. Calculate CS points
  let finalCSPoints = 0;

  if (prediction.correctScoreEntered) {
    const predictedGoals = parseScore(prediction.predictedScore);
    const actualGoals = { home: actualResult.homeGoals, away: actualResult.awayGoals };
    
    if (predictedGoals.home === actualGoals.home && predictedGoals.away === actualGoals.away) {
      // Correct score
      const totalGoals = actualGoals.home + actualGoals.away;
      finalCSPoints = calculateCSBonus(totalGoals);
    } else {
      // Wrong score
      finalCSPoints = -1;
    }
  }
  // If no CS entered, finalCSPoints = 0 (no penalty)

  // 3. Calculate total
  const finalTotalPoints = final1X2Points + finalCSPoints;

  // 4. Get points band description
  const pointsBand = selectedOdds > 0 ? getPointsBandDescription(selectedOdds) : 'N/A';

  return {
    final1X2Points,
    finalCSPoints,
    finalTotalPoints,
    pointsBand
  };
}

// Lock odds for a match (capture from API)
export async function lockMatchOdds(matchId: string, fixtureId: number): Promise<boolean> {
  try {
    // Get current odds from cache
    const { data: oddsCache } = await supabaseAdmin
      .from('match_odds_cache')
      .select('*')
      .eq('fixture_id', fixtureId)
      .single();

    if (!oddsCache || oddsCache.is_locked) {
      console.log(`Match ${matchId} odds already locked or not found`);
      return false;
    }

    // Lock the odds
    const { error } = await supabaseAdmin
      .from('match_odds_cache')
      .update({
        is_locked: true,
        locked_at: new Date().toISOString()
      })
      .eq('fixture_id', fixtureId);

    if (error) {
      console.error('Error locking odds:', error);
      return false;
    }

    console.log(`Locked odds for match ${matchId} at ${new Date().toISOString()}`);
    return true;

  } catch (error) {
    console.error('Error in lockMatchOdds:', error);
    return false;
  }
}

// Settle match and score all predictions
export async function settleMatch(
  matchId: string,
  actualScore: string,
  fixtureId?: number
): Promise<{
  settledCount: number;
  totalPointsAwarded: number;
  errors: string[];
}> {
  try {
    const actualGoals = parseScore(actualScore);
    const actualResult: MatchResult = {
      homeGoals: actualGoals.home,
      awayGoals: actualGoals.away,
      result: getMatchResult(actualGoals.home, actualGoals.away)
    };

    // Get locked odds for this match
    const { data: oddsCache } = await supabaseAdmin
      .from('match_odds_cache')
      .select('*')
      .eq('match_id', matchId)
      .single();

    if (!oddsCache) {
      return {
        settledCount: 0,
        totalPointsAwarded: 0,
        errors: [`No locked odds found for match ${matchId}`]
      };
    }

    // Get all unsettled predictions for this match
    const { data: predictions } = await supabaseAdmin
      .from('predictions')
      .select('*')
      .eq('match_id', matchId)
      .eq('settled', false);

    if (!predictions || predictions.length === 0) {
      return {
        settledCount: 0,
        totalPointsAwarded: 0,
        errors: [`No unsettled predictions found for match ${matchId}`]
      };
    }

    let settledCount = 0;
    let totalPointsAwarded = 0;
    const errors: string[] = [];

    for (const pred of predictions) {
      try {
        // Derive correctScoreEntered from predicted_score:
        // Only "N-N" (both sides numeric) counts as active CS bet.
        // "", "x-x", "2-x", "x-1", null → NO CS bet.
        const hasActiveCS = /^\d+-\d+$/.test((pred.predicted_score || '').trim());

        const predictionData: PredictionToScore = {
          id: pred.id,
          userId: pred.user_id,
          matchId: pred.match_id,
          predictedResult: pred.predicted_result,
          predictedScore: pred.predicted_score || '',
          boosterUsed: pred.boosted || false,
          correctScoreEntered: hasActiveCS,
          lockedHomeOdds: oddsCache.average_home_odds,
          lockedDrawOdds: oddsCache.average_draw_odds,
          lockedAwayOdds: oddsCache.average_away_odds
        };

        const scoring = await scorePrediction(predictionData, actualResult);

        // Update prediction with scoring results
        await supabaseAdmin
          .from('predictions')
          .update({
            settled: true,
            actual_result: actualResult.result,
            actual_score: actualScore,
            locked_home_odds: oddsCache.average_home_odds,
            locked_draw_odds: oddsCache.average_draw_odds,
            locked_away_odds: oddsCache.average_away_odds,
            locked_points_band: scoring.pointsBand,
            final_1x2_points: scoring.final1X2Points,
            final_cs_points: scoring.finalCSPoints,
            final_total_points: scoring.finalTotalPoints,
            points_earned: scoring.finalTotalPoints, // Keep for compatibility
            scored_at: new Date().toISOString()
          })
          .eq('id', pred.id);

        // Update user total points
        await supabaseAdmin.rpc('update_user_points_atomic', {
          user_id: pred.user_id,
          points_to_add: scoring.finalTotalPoints,
          is_correct: scoring.final1X2Points > 0
        });

        settledCount++;
        totalPointsAwarded += scoring.finalTotalPoints;

      } catch (error) {
        errors.push(`Error scoring prediction ${pred.id}: ${error}`);
        console.error('Error scoring prediction:', error);
      }
    }

    return {
      settledCount,
      totalPointsAwarded,
      errors
    };

  } catch (error) {
    console.error('Error in settleMatch:', error);
    return {
      settledCount: 0,
      totalPointsAwarded: 0,
      errors: [`Settlement error: ${error}`]
    };
  }
}