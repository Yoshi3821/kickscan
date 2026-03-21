const API_KEY = "3408fed656308fb4ade76a6b3212a975";
const BASE = "https://v3.football.api-sports.io";

export interface LeagueFixture {
  id: number;
  league: { id: number; name: string; country: string; logo: string; };
  date: string;
  home: { id: number; name: string; logo: string; };
  away: { id: number; name: string; logo: string; };
  venue: { name: string; city: string; };
  status: string; // "NS" | "1H" | "2H" | "FT" | "HT" etc.
  goalsHome: number | null;
  goalsAway: number | null;
}

export interface TeamForm {
  form: string; // "WWDLW"
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

export interface H2HResult {
  home: string;
  away: string;
  homeGoals: number;
  awayGoals: number;
  date: string;
}

export interface FixtureOdds {
  bookmaker: string;
  home: number;
  draw: number;
  away: number;
}

export interface InjuryInfo {
  player: string;
  team: string;
  reason: string;
}

// League configurations
export const LEAGUES = [
  { id: 39, name: "Premier League", country: "England", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", oddsKey: "soccer_epl" },
  { id: 2, name: "Champions League", country: "Europe", flag: "🇪🇺", oddsKey: "soccer_uefa_champs_league" },
  { id: 140, name: "La Liga", country: "Spain", flag: "🇪🇸", oddsKey: "soccer_spain_la_liga" },
  { id: 135, name: "Serie A", country: "Italy", flag: "🇮🇹", oddsKey: "soccer_italy_serie_a" },
  { id: 78, name: "Bundesliga", country: "Germany", flag: "🇩🇪", oddsKey: "soccer_germany_bundesliga" },
];

// Helper function to make API calls with caching
async function apiCall(endpoint: string): Promise<any> {
  const url = `${BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'x-apisports-key': API_KEY
      },
      next: { revalidate: 3600 } // 1 hour cache
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status}`);
    }

    const data = await response.json();
    return data.response || [];
  } catch (error) {
    console.error('API call failed:', error);
    return [];
  }
}

// Fetch upcoming fixtures for a league (includes today's matches)
export async function getLeagueFixtures(leagueId: number, next: number = 10): Promise<LeagueFixture[]> {
  const year = new Date().getFullYear();
  const today = new Date().toISOString().split('T')[0];

  // Fetch next upcoming + today's matches in parallel
  const [nextData, todayData] = await Promise.all([
    apiCall(`/fixtures?league=${leagueId}&season=${year}&next=${next}`)
      .then(d => d || [])
      .catch(() => apiCall(`/fixtures?league=${leagueId}&season=${year - 1}&next=${next}`).catch(() => [])),
    apiCall(`/fixtures?league=${leagueId}&date=${today}&season=${year}`)
      .then(d => d || [])
      .catch(() => apiCall(`/fixtures?league=${leagueId}&date=${today}&season=${year - 1}`).catch(() => []))
  ]);

  // Merge and deduplicate by fixture ID
  const seen = new Set<number>();
  const merged: any[] = [];
  for (const item of [...(todayData || []), ...(nextData || [])]) {
    const id = item?.fixture?.id;
    if (id && !seen.has(id)) {
      seen.add(id);
      merged.push(item);
    }
  }
  const data = merged;
  
  return data.map((item: any) => ({
    id: item.fixture.id,
    league: {
      id: item.league.id,
      name: item.league.name,
      country: item.league.country,
      logo: item.league.logo,
    },
    date: item.fixture.date,
    home: {
      id: item.teams.home.id,
      name: item.teams.home.name,
      logo: item.teams.home.logo,
    },
    away: {
      id: item.teams.away.id,
      name: item.teams.away.name,
      logo: item.teams.away.logo,
    },
    venue: {
      name: item.fixture.venue.name,
      city: item.fixture.venue.city,
    },
    status: item.fixture.status.short,
    goalsHome: item.goals.home,
    goalsAway: item.goals.away,
  }));
}

// Fetch all upcoming fixtures for all major leagues
export async function getAllLeagueFixtures(limit: number = 50): Promise<LeagueFixture[]> {
  // Fetch ALL leagues in PARALLEL for speed
  const perLeague = Math.max(3, Math.floor(limit / LEAGUES.length));
  const results = await Promise.allSettled(
    LEAGUES.map(league => getLeagueFixtures(league.id, perLeague))
  );
  
  const allFixtures: LeagueFixture[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") {
      allFixtures.push(...result.value);
    }
  }
  
  // Sort by date
  allFixtures.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return allFixtures.slice(0, limit);
}

// Fetch team statistics/form
export async function getTeamForm(teamId: number, leagueId: number, season: number = new Date().getFullYear()): Promise<TeamForm | null> {
  try {
    const url = `${BASE}/teams/statistics?team=${teamId}&league=${leagueId}&season=${season}`;
    const response = await fetch(url, {
      headers: { 'x-apisports-key': API_KEY },
      next: { revalidate: 3600 }
    });
    const json = await response.json();
    const stats = json.response;
    
    if (!stats || !stats.form) return null;
    
    const form = stats.form || "NNNNN";
  
    return {
      form: form.slice(-5),
      played: stats.fixtures?.played?.total || 0,
      wins: stats.fixtures?.wins?.total || 0,
      draws: stats.fixtures?.draws?.total || 0,
      losses: stats.fixtures?.loses?.total || 0,
      goalsFor: stats.goals?.for?.total?.total || 0,
      goalsAgainst: stats.goals?.against?.total?.total || 0,
    };
  } catch {
    return null;
  }
}

// Fetch H2H between two teams
export async function getH2H(team1Id: number, team2Id: number, last: number = 5): Promise<H2HResult[]> {
  const data = await apiCall(`/fixtures/headtohead?h2h=${team1Id}-${team2Id}&last=${last}`);
  
  return data.map((item: any) => ({
    home: item.teams.home.name,
    away: item.teams.away.name,
    homeGoals: item.goals.home || 0,
    awayGoals: item.goals.away || 0,
    date: item.fixture.date,
  }));
}

// Fetch injuries for a fixture
export async function getInjuries(fixtureId: number): Promise<InjuryInfo[]> {
  const data = await apiCall(`/injuries?fixture=${fixtureId}`);
  
  return data.map((item: any) => ({
    player: item.player.name,
    team: item.team.name,
    reason: item.player.reason,
  }));
}

// Fetch odds from API-Football (use this instead of The Odds API to save quota)
export async function getFixtureOdds(fixtureId: number): Promise<FixtureOdds[]> {
  const data = await apiCall(`/odds?fixture=${fixtureId}&bet=1`); // bet=1 is Match Winner
  
  if (!data || data.length === 0) return [];
  
  const odds: FixtureOdds[] = [];
  
  for (const fixture of data) {
    for (const bookmaker of fixture.bookmakers) {
      const outcomes = bookmaker.bets[0]?.values || [];
      if (outcomes.length >= 3) {
        odds.push({
          bookmaker: bookmaker.name,
          home: parseFloat(outcomes.find((o: any) => o.value === "Home")?.odd || "1.50"),
          draw: parseFloat(outcomes.find((o: any) => o.value === "Draw")?.odd || "3.00"),
          away: parseFloat(outcomes.find((o: any) => o.value === "Away")?.odd || "2.50"),
        });
      }
    }
  }
  
  return odds;
}

// Get fixture by ID
export async function getFixtureById(fixtureId: number): Promise<LeagueFixture | null> {
  const data = await apiCall(`/fixtures?id=${fixtureId}`);
  
  if (!data || data.length === 0) return null;
  
  const item = data[0];
  return {
    id: item.fixture.id,
    league: {
      id: item.league.id,
      name: item.league.name,
      country: item.league.country,
      logo: item.league.logo,
    },
    date: item.fixture.date,
    home: {
      id: item.teams.home.id,
      name: item.teams.home.name,
      logo: item.teams.home.logo,
    },
    away: {
      id: item.teams.away.id,
      name: item.teams.away.name,
      logo: item.teams.away.logo,
    },
    venue: {
      name: item.fixture.venue.name,
      city: item.fixture.venue.city,
    },
    status: item.fixture.status.short,
    goalsHome: item.goals.home,
    goalsAway: item.goals.away,
  };
}

// Get league info by ID
export function getLeagueInfo(leagueId: number) {
  return LEAGUES.find(l => l.id === leagueId);
}