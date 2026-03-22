// Odds management with API integration and locking
import { supabaseAdmin } from './supabase';

const API_KEY = '3408fed656308fb4ade76a6b3212a975';
const BASE_URL = 'https://v3.football.api-sports.io';

interface BookmakerOdds {
  name: string;
  home: number;
  draw: number;
  away: number;
}

interface MatchOdds {
  fixtureId: number;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  kickoffTime: Date;
  bookmakers: BookmakerOdds[];
  averageOdds: {
    home: number;
    draw: number;
    away: number;
  };
  isLocked: boolean;
  lastUpdated: Date;
}

// Calculate average odds from multiple bookmakers
function calculateAverageOdds(bookmakers: BookmakerOdds[]): {
  home: number;
  draw: number;
  away: number;
} {
  if (bookmakers.length === 0) {
    return { home: 0, draw: 0, away: 0 };
  }

  const totals = bookmakers.reduce(
    (acc, bm) => ({
      home: acc.home + bm.home,
      draw: acc.draw + bm.draw,
      away: acc.away + bm.away,
    }),
    { home: 0, draw: 0, away: 0 }
  );

  const count = bookmakers.length;
  
  return {
    home: Math.round((totals.home / count) * 100) / 100,
    draw: Math.round((totals.draw / count) * 100) / 100,
    away: Math.round((totals.away / count) * 100) / 100,
  };
}

// Determine refresh interval based on match proximity
export function getRefreshInterval(kickoffTime: Date): number {
  const now = new Date();
  const hoursUntilKickoff = (kickoffTime.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilKickoff > 7 * 24) return 24 * 60; // 24 hours
  if (hoursUntilKickoff > 48) return 6 * 60;      // 6 hours
  if (hoursUntilKickoff > 6) return 2 * 60;       // 2 hours
  if (hoursUntilKickoff > 0) return 45;           // 45 minutes
  return 30; // Post-match
}

// Check if odds should be refreshed
export function shouldRefreshOdds(lastUpdated: Date, kickoffTime: Date): boolean {
  const intervalMinutes = getRefreshInterval(kickoffTime);
  const timeSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60);
  return timeSinceUpdate >= intervalMinutes;
}

// Fetch odds from API-Football
export async function fetchOddsFromAPI(fixtureId: number): Promise<BookmakerOdds[]> {
  try {
    const response = await fetch(
      `${BASE_URL}/odds?fixture=${fixtureId}&bookmaker=10`,
      {
        headers: {
          'x-apisports-key': API_KEY,
        },
      }
    );

    if (!response.ok) {
      console.error(`Odds API error for fixture ${fixtureId}: ${response.status}`);
      return [];
    }

    const data = await response.json();

    if (!data.response || data.response.length === 0) {
      console.log(`No odds data for fixture ${fixtureId}`);
      return [];
    }

    const fixture = data.response[0];
    const bookmakers: BookmakerOdds[] = [];

    for (const bookmaker of fixture.bookmakers || []) {
      const h2hBet = bookmaker.bets.find((bet: any) => bet.name === "Match Winner");
      if (!h2hBet || !h2hBet.values) continue;

      const homeOdd = h2hBet.values.find((v: any) => v.value === "Home")?.odd;
      const drawOdd = h2hBet.values.find((v: any) => v.value === "Draw")?.odd;
      const awayOdd = h2hBet.values.find((v: any) => v.value === "Away")?.odd;

      if (homeOdd && drawOdd && awayOdd) {
        bookmakers.push({
          name: bookmaker.name,
          home: parseFloat(homeOdd),
          draw: parseFloat(drawOdd),
          away: parseFloat(awayOdd),
        });
      }
    }

    console.log(`Fetched odds for fixture ${fixtureId}: ${bookmakers.length} bookmakers`);
    return bookmakers;

  } catch (error) {
    console.error(`Error fetching odds for fixture ${fixtureId}:`, error);
    return [];
  }
}

// Update match odds in database
export async function updateMatchOdds(
  fixtureId: number,
  matchId: string,
  homeTeam: string,
  awayTeam: string,
  kickoffTime: Date,
  bookmakers: BookmakerOdds[]
): Promise<boolean> {
  try {
    const averageOdds = calculateAverageOdds(bookmakers);
    
    const { error } = await supabaseAdmin
      .from('match_odds_cache')
      .upsert({
        fixture_id: fixtureId,
        match_id: matchId,
        home_team: homeTeam,
        away_team: awayTeam,
        kickoff_time: kickoffTime.toISOString(),
        average_home_odds: averageOdds.home,
        average_draw_odds: averageOdds.draw,
        average_away_odds: averageOdds.away,
        bookmaker_count: bookmakers.length,
        last_updated: new Date().toISOString(),
        source: 'api'
      });

    if (error) {
      console.error('Error updating match odds:', error);
      return false;
    }

    return true;

  } catch (error) {
    console.error('Error in updateMatchOdds:', error);
    return false;
  }
}

// Get odds for a match (from cache or API)
export async function getMatchOdds(
  fixtureId: number,
  forceRefresh: boolean = false
): Promise<MatchOdds | null> {
  try {
    // Check cache first
    const { data: cached } = await supabaseAdmin
      .from('match_odds_cache')
      .select('*')
      .eq('fixture_id', fixtureId)
      .single();

    if (cached && !forceRefresh) {
      const kickoffTime = new Date(cached.kickoff_time);
      const lastUpdated = new Date(cached.last_updated);
      
      // Check if refresh is needed
      if (!cached.is_locked && shouldRefreshOdds(lastUpdated, kickoffTime)) {
        // Refresh needed but don't wait for it
        fetchOddsFromAPI(fixtureId).then(bookmakers => {
          if (bookmakers.length > 0) {
            updateMatchOdds(
              fixtureId,
              cached.match_id,
              cached.home_team,
              cached.away_team,
              kickoffTime,
              bookmakers
            );
          }
        });
      }

      // Return cached data
      return {
        fixtureId: cached.fixture_id,
        matchId: cached.match_id,
        homeTeam: cached.home_team,
        awayTeam: cached.away_team,
        kickoffTime,
        bookmakers: [], // Don't load individual bookmaker data for performance
        averageOdds: {
          home: cached.average_home_odds,
          draw: cached.average_draw_odds,
          away: cached.average_away_odds,
        },
        isLocked: cached.is_locked,
        lastUpdated,
      };
    }

    return null;

  } catch (error) {
    console.error('Error getting match odds:', error);
    return null;
  }
}

// Lock odds 5 minutes before kickoff
export async function lockOddsIfNeeded(fixtureId: number): Promise<boolean> {
  try {
    const { data: cached } = await supabaseAdmin
      .from('match_odds_cache')
      .select('kickoff_time, is_locked')
      .eq('fixture_id', fixtureId)
      .single();

    if (!cached || cached.is_locked) {
      return false;
    }

    const kickoffTime = new Date(cached.kickoff_time);
    const lockTime = new Date(kickoffTime.getTime() - 5 * 60 * 1000); // 5 minutes before
    const now = new Date();

    if (now >= lockTime) {
      const { error } = await supabaseAdmin
        .from('match_odds_cache')
        .update({
          is_locked: true,
          locked_at: now.toISOString()
        })
        .eq('fixture_id', fixtureId);

      if (error) {
        console.error('Error locking odds:', error);
        return false;
      }

      console.log(`Locked odds for fixture ${fixtureId} at ${now.toISOString()}`);
      return true;
    }

    return false;

  } catch (error) {
    console.error('Error in lockOddsIfNeeded:', error);
    return false;
  }
}

// Check if predictions should be locked for a match
export async function checkPredictionLock(matchId: string): Promise<{
  isLocked: boolean;
  lockTime?: Date;
  timeRemaining?: number;
}> {
  try {
    const { data: cached } = await supabaseAdmin
      .from('match_odds_cache')
      .select('kickoff_time, is_locked')
      .eq('match_id', matchId)
      .single();

    if (!cached) {
      return { isLocked: false };
    }

    const kickoffTime = new Date(cached.kickoff_time);
    const lockTime = new Date(kickoffTime.getTime() - 5 * 60 * 1000); // 5 minutes before
    const now = new Date();
    const timeRemaining = lockTime.getTime() - now.getTime();

    return {
      isLocked: now >= lockTime,
      lockTime,
      timeRemaining: Math.max(0, timeRemaining)
    };

  } catch (error) {
    console.error('Error checking prediction lock:', error);
    return { isLocked: false };
  }
}

// Bulk refresh odds for multiple matches (cost-efficient)
export async function bulkRefreshOdds(fixtureIds: number[]): Promise<{
  updated: number;
  errors: string[];
}> {
  let updated = 0;
  const errors: string[] = [];

  for (const fixtureId of fixtureIds) {
    try {
      // Check if refresh is needed
      const odds = await getMatchOdds(fixtureId);
      if (!odds) continue;

      if (odds.isLocked) continue; // Skip locked odds

      const shouldRefresh = shouldRefreshOdds(odds.lastUpdated, odds.kickoffTime);
      if (!shouldRefresh) continue;

      // Fetch and update
      const bookmakers = await fetchOddsFromAPI(fixtureId);
      if (bookmakers.length > 0) {
        const success = await updateMatchOdds(
          fixtureId,
          odds.matchId,
          odds.homeTeam,
          odds.awayTeam,
          odds.kickoffTime,
          bookmakers
        );
        
        if (success) {
          updated++;
        }
      }

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      errors.push(`Error refreshing odds for fixture ${fixtureId}: ${error}`);
    }
  }

  return { updated, errors };
}

export type { MatchOdds, BookmakerOdds };