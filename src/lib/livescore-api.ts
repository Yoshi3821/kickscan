interface MatchEvent {
  minute: number;
  extraMinute: number | null;
  type: "Goal" | "Card" | "subst" | "Var";
  detail: string; // "Normal Goal", "Yellow Card", "Red Card", "Penalty", "Own Goal", "Substitution 1"
  playerName: string;
  assistName: string | null;
  teamName: string;
  teamId: number;
}

interface LiveMatch {
  fixtureId: number;
  leagueId: number;
  leagueName: string;
  leagueLogo: string;
  leagueCountry: string;
  countryFlag: string;
  homeTeam: string;
  awayTeam: string;
  homeLogo: string;
  awayLogo: string;
  homeGoals: number | null;
  awayGoals: number | null;
  halftimeHome: number | null;
  halftimeAway: number | null;
  status: string; // "1H", "HT", "2H", "FT", "NS" etc
  minute: number | null;
  date: string;
  venue: string;
  city: string;
  isLive: boolean;
  events: MatchEvent[];
  yellowCards: { home: number; away: number };
  redCards: { home: number; away: number };
}

interface ApiFootballResponse {
  response: Array<{
    fixture: {
      id: number;
      date: string;
      status: {
        short: string;
        elapsed: number | null;
      };
      venue: {
        name: string;
        city: string;
      };
    };
    league: {
      id: number;
      name: string;
      country: string;
      logo: string;
      flag: string;
    };
    teams: {
      home: {
        id: number;
        name: string;
        logo: string;
      };
      away: {
        id: number;
        name: string;
        logo: string;
      };
    };
    goals: {
      home: number | null;
      away: number | null;
    };
    score: {
      halftime: {
        home: number | null;
        away: number | null;
      };
      fulltime: {
        home: number | null;
        away: number | null;
      };
    };
    events?: Array<{
      time: {
        elapsed: number;
        extra: number | null;
      };
      type: string;
      detail: string;
      player: {
        name: string;
      };
      assist?: {
        name: string;
      };
      team: {
        id: number;
        name: string;
      };
    }>;
  }>;
}

const API_KEY = '3408fed656308fb4ade76a6b3212a975';
const BASE_URL = 'https://v3.football.api-sports.io';

// Priority leagues for filtering
export const PRIORITY_LEAGUES = [
  39,   // Premier League
  2,    // UEFA Champions League
  140,  // La Liga
  135,  // Serie A
  78    // Bundesliga
];

const fetchFromAPI = async (endpoint: string, revalidate: number = 60): Promise<ApiFootballResponse> => {
  const url = `${BASE_URL}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': API_KEY,
      },
      next: { revalidate },
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API Football fetch error:', error);
    throw error;
  }
};

const transformMatch = (apiMatch: ApiFootballResponse['response'][0]): LiveMatch => {
  const isLive = ['1H', '2H', 'ET', 'BT'].includes(apiMatch.fixture.status.short);
  
  // Transform events
  const events: MatchEvent[] = (apiMatch.events || []).map(event => ({
    minute: event.time.elapsed,
    extraMinute: event.time.extra,
    type: event.type as "Goal" | "Card" | "subst" | "Var",
    detail: event.detail,
    playerName: event.player.name,
    assistName: event.assist?.name || null,
    teamName: event.team.name,
    teamId: event.team.id,
  }));

  // Count cards
  const yellowCards = { home: 0, away: 0 };
  const redCards = { home: 0, away: 0 };
  
  events.forEach(event => {
    if (event.type === "Card") {
      const isHome = event.teamId === apiMatch.teams.home.id;
      if (event.detail === "Yellow Card") {
        if (isHome) yellowCards.home++;
        else yellowCards.away++;
      } else if (event.detail === "Red Card") {
        if (isHome) redCards.home++;
        else redCards.away++;
      }
    }
  });
  
  return {
    fixtureId: apiMatch.fixture.id,
    leagueId: apiMatch.league.id,
    leagueName: apiMatch.league.name,
    leagueLogo: apiMatch.league.logo,
    leagueCountry: apiMatch.league.country,
    countryFlag: apiMatch.league.flag,
    homeTeam: apiMatch.teams.home.name,
    awayTeam: apiMatch.teams.away.name,
    homeLogo: apiMatch.teams.home.logo,
    awayLogo: apiMatch.teams.away.logo,
    homeGoals: apiMatch.goals.home,
    awayGoals: apiMatch.goals.away,
    halftimeHome: apiMatch.score.halftime.home,
    halftimeAway: apiMatch.score.halftime.away,
    status: apiMatch.fixture.status.short,
    minute: apiMatch.fixture.status.elapsed,
    date: apiMatch.fixture.date,
    venue: apiMatch.fixture.venue.name || 'Unknown Venue',
    city: apiMatch.fixture.venue.city || 'Unknown City',
    isLive,
    events,
    yellowCards,
    redCards,
  };
};

export async function getLiveMatches(): Promise<LiveMatch[]> {
  try {
    const data = await fetchFromAPI('/fixtures?live=all', 10); // 10 second cache for live data
    return data.response.map(transformMatch);
  } catch (error) {
    console.error('Error fetching live matches:', error);
    return [];
  }
}

export async function getTodayMatches(): Promise<LiveMatch[]> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
  
  try {
    const data = await fetchFromAPI(`/fixtures?date=${today}`, 300); // 5 minute cache for today's schedule
    return data.response.map(transformMatch);
  } catch (error) {
    console.error('Error fetching today matches:', error);
    return [];
  }
}

export async function getMatchesByDate(date: string): Promise<LiveMatch[]> {
  try {
    const data = await fetchFromAPI(`/fixtures?date=${date}`, 300); // 5 minute cache
    return data.response.map(transformMatch);
  } catch (error) {
    console.error(`Error fetching matches for ${date}:`, error);
    return [];
  }
}

// Helper function to filter matches by priority leagues
export function filterPriorityLeagues(matches: LiveMatch[]): LiveMatch[] {
  return matches.filter(match => PRIORITY_LEAGUES.includes(match.leagueId));
}

// Helper function to group matches by league
export function groupMatchesByLeague(matches: LiveMatch[]): Record<string, LiveMatch[]> {
  return matches.reduce((groups, match) => {
    const key = `${match.leagueId}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(match);
    return groups;
  }, {} as Record<string, LiveMatch[]>);
}

// Helper function to sort leagues by priority
export function sortLeaguesByPriority(groupedMatches: Record<string, LiveMatch[]>): [string, LiveMatch[]][] {
  const entries = Object.entries(groupedMatches);
  
  return entries.sort(([aKey], [bKey]) => {
    const aId = parseInt(aKey);
    const bId = parseInt(bKey);
    const aPriority = PRIORITY_LEAGUES.indexOf(aId);
    const bPriority = PRIORITY_LEAGUES.indexOf(bId);
    
    // Priority leagues first
    if (aPriority !== -1 && bPriority !== -1) {
      return aPriority - bPriority;
    }
    if (aPriority !== -1) return -1;
    if (bPriority !== -1) return 1;
    
    // Then alphabetically by league name
    const aName = entries.find(([key]) => key === aKey)?.[1]?.[0]?.leagueName || '';
    const bName = entries.find(([key]) => key === bKey)?.[1]?.[0]?.leagueName || '';
    return aName.localeCompare(bName);
  });
}

export type { LiveMatch, MatchEvent };