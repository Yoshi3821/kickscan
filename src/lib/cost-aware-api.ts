// Cost-aware API fetching for odds and live scores
import { getCacheEntry, setCacheEntry, getRefreshConfig } from './smart-cache';

const API_KEY = '3408fed656308fb4ade76a6b3212a975';
const BASE_URL = 'https://v3.football.api-sports.io';

interface OddsData {
  fixtureId: number;
  bookmakers: Array<{
    name: string;
    home: number;
    draw: number;
    away: number;
    lastUpdate: string;
  }>;
  averageOdds: {
    home: number;
    draw: number;
    away: number;
  };
  lastUpdated: string;
}

interface LiveScoreData {
  fixtureId: number;
  status: string;
  minute: number | null;
  homeGoals: number | null;
  awayGoals: number | null;
  events: Array<{
    minute: number;
    type: string;
    detail: string;
    player: string;
    team: string;
  }>;
  lastUpdated: string;
}

// Fetch odds for a specific fixture with caching
export async function fetchFixtureOdds(
  fixtureId: number, 
  matchDate: Date,
  forceRefresh: boolean = false
): Promise<OddsData | null> {
  try {
    // Check cache first
    const cached = await getCacheEntry('odds', fixtureId);
    
    if (cached.data && !cached.needsRefresh && !forceRefresh) {
      console.log(`Using cached odds for fixture ${fixtureId} (${cached.config.description})`);
      return cached.data;
    }

    // Check if we should skip due to quota concerns
    const config = getRefreshConfig(matchDate);
    if (!shouldFetchNow(matchDate, config)) {
      console.log(`Skipping odds fetch for fixture ${fixtureId} - quota optimization`);
      return cached.data;
    }

    // Fetch fresh data
    console.log(`Fetching fresh odds for fixture ${fixtureId} (${config.description})`);
    
    const response = await fetch(`${BASE_URL}/odds?fixture=${fixtureId}&bookmaker=10`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Odds API error for fixture ${fixtureId}: ${response.status}`);
      return cached.data;
    }

    const apiData = await response.json();
    
    if (!apiData.response || apiData.response.length === 0) {
      console.log(`No odds available for fixture ${fixtureId}`);
      return null;
    }

    // Transform API response to our format
    const fixture = apiData.response[0];
    const bookmakers = fixture.bookmakers.map((bm: any) => {
      const h2h = bm.bets.find((bet: any) => bet.name === "Match Winner");
      const odds = h2h?.values || [];
      
      return {
        name: bm.name,
        home: parseFloat(odds.find((o: any) => o.value === "Home")?.odd || "0"),
        draw: parseFloat(odds.find((o: any) => o.value === "Draw")?.odd || "0"),
        away: parseFloat(odds.find((o: any) => o.value === "Away")?.odd || "0"),
        lastUpdate: new Date().toISOString()
      };
    }).filter((bm: any) => bm.home > 0 && bm.draw > 0 && bm.away > 0);

    // Calculate average odds
    const avgHome = bookmakers.reduce((sum: number, bm: any) => sum + bm.home, 0) / bookmakers.length;
    const avgDraw = bookmakers.reduce((sum: number, bm: any) => sum + bm.draw, 0) / bookmakers.length;
    const avgAway = bookmakers.reduce((sum: number, bm: any) => sum + bm.away, 0) / bookmakers.length;

    const oddsData: OddsData = {
      fixtureId,
      bookmakers,
      averageOdds: {
        home: Math.round(avgHome * 100) / 100,
        draw: Math.round(avgDraw * 100) / 100,
        away: Math.round(avgAway * 100) / 100,
      },
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    await setCacheEntry('odds', oddsData, fixtureId, matchDate);
    
    return oddsData;

  } catch (error) {
    console.error(`Error fetching odds for fixture ${fixtureId}:`, error);
    return null;
  }
}

// Fetch live score for a specific fixture with caching
export async function fetchFixtureLiveScore(
  fixtureId: number,
  matchDate: Date,
  forceRefresh: boolean = false
): Promise<LiveScoreData | null> {
  try {
    // For live matches, use shorter cache
    const isLive = Math.abs(new Date().getTime() - matchDate.getTime()) < 3 * 60 * 60 * 1000; // Within 3 hours
    const cacheMinutes = isLive ? 2 : 30;
    
    const cached = await getCacheEntry('live_scores', fixtureId);
    
    if (cached.data && !cached.needsRefresh && !forceRefresh) {
      console.log(`Using cached live score for fixture ${fixtureId}`);
      return cached.data;
    }

    // Fetch fresh data
    console.log(`Fetching fresh live score for fixture ${fixtureId}`);
    
    const response = await fetch(`${BASE_URL}/fixtures?id=${fixtureId}`, {
      headers: {
        'x-apisports-key': API_KEY,
      },
    });

    if (!response.ok) {
      console.error(`Live score API error for fixture ${fixtureId}: ${response.status}`);
      return cached.data;
    }

    const apiData = await response.json();
    
    if (!apiData.response || apiData.response.length === 0) {
      return null;
    }

    // Transform API response
    const fixture = apiData.response[0];
    
    const liveScoreData: LiveScoreData = {
      fixtureId,
      status: fixture.fixture.status.short,
      minute: fixture.fixture.status.elapsed,
      homeGoals: fixture.goals.home,
      awayGoals: fixture.goals.away,
      events: (fixture.events || []).map((event: any) => ({
        minute: event.time.elapsed,
        type: event.type,
        detail: event.detail,
        player: event.player?.name || '',
        team: event.team.name
      })),
      lastUpdated: new Date().toISOString()
    };

    // Cache the result
    await setCacheEntry('live_scores', liveScoreData, fixtureId, matchDate);
    
    return liveScoreData;

  } catch (error) {
    console.error(`Error fetching live score for fixture ${fixtureId}:`, error);
    return null;
  }
}

// Get final odds snapshot for prediction settlement
export async function getFinalOddsSnapshot(fixtureId: number): Promise<{
  home: number;
  draw: number;
  away: number;
} | null> {
  try {
    const cached = await getCacheEntry('odds', fixtureId);
    
    if (cached.data) {
      return cached.data.averageOdds;
    }

    // If no cached odds, return null (should not happen for matches with predictions)
    console.warn(`No cached odds found for final snapshot of fixture ${fixtureId}`);
    return null;

  } catch (error) {
    console.error(`Error getting final odds snapshot for fixture ${fixtureId}:`, error);
    return null;
  }
}

// Batch fetch odds for multiple fixtures (cost-efficient)
export async function batchFetchOdds(fixtures: Array<{
  id: number;
  date: Date;
}>): Promise<Record<number, OddsData>> {
  const results: Record<number, OddsData> = {};
  
  // Group by refresh priority
  const highPriority = fixtures.filter(f => {
    const config = getRefreshConfig(f.date);
    return config.intervalMinutes <= 60; // Last 6 hours or critical matches
  });
  
  const lowPriority = fixtures.filter(f => {
    const config = getRefreshConfig(f.date);
    return config.intervalMinutes > 60;
  });

  // Process high priority first
  for (const fixture of highPriority) {
    try {
      const odds = await fetchFixtureOdds(fixture.id, fixture.date);
      if (odds) {
        results[fixture.id] = odds;
      }
      
      // Rate limiting - wait between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Batch odds fetch error for fixture ${fixture.id}:`, error);
    }
  }

  // Process low priority with more aggressive caching
  for (const fixture of lowPriority) {
    try {
      const cached = await getCacheEntry('odds', fixture.id);
      if (cached.data && !cached.needsRefresh) {
        results[fixture.id] = cached.data;
      } else if (shouldFetchNow(fixture.date, getRefreshConfig(fixture.date))) {
        const odds = await fetchFixtureOdds(fixture.id, fixture.date);
        if (odds) {
          results[fixture.id] = odds;
        }
        
        // Longer delay for low priority
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error(`Batch odds fetch error for fixture ${fixture.id}:`, error);
    }
  }

  return results;
}

// Helper function to determine if we should make an API call now
function shouldFetchNow(matchDate: Date, config: { intervalMinutes: number }): boolean {
  const now = new Date();
  const timeSinceMatch = Math.abs(now.getTime() - matchDate.getTime());
  const hoursFromMatch = timeSinceMatch / (1000 * 60 * 60);
  
  // Always fetch for matches happening soon or recently finished
  if (hoursFromMatch <= 3) {
    return true;
  }
  
  // For distant matches, only fetch during business hours to save quota
  const hour = now.getUTCHours();
  const isBusinessHours = hour >= 8 && hour <= 22;
  
  if (config.intervalMinutes >= 360 && !isBusinessHours) { // 6+ hours interval
    return false;
  }
  
  return true;
}

export type { OddsData, LiveScoreData };