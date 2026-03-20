import { allMatches, getFlag } from "@/data/matches";

const API_KEY = "2d76c480178eddba35634870e3420803";
const MATCH_ODDS_URL = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds?apiKey=${API_KEY}&regions=uk,eu,us&markets=h2h&oddsFormat=decimal`;
const WINNER_ODDS_URL = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup_winner/odds?apiKey=${API_KEY}&regions=uk,eu&markets=outrights&oddsFormat=decimal`;

// League sport keys for The Odds API
const LEAGUE_SPORTS = {
  39: 'soccer_epl', // Premier League
  2: 'soccer_uefa_champs_league', // Champions League
  140: 'soccer_spain_la_liga', // La Liga
  135: 'soccer_italy_serie_a', // Serie A
  78: 'soccer_germany_bundesliga', // Bundesliga
} as const;

// Preferred bookmakers in priority order
const PREFERRED_BOOKMAKERS = [
  "bet365",
  "williamhill",
  "paddypower",
  "pinnacle",
  "betfair_ex_eu",
  "betfair_sb_uk",
  "betway",
  "unibet_eu",
  "unibet_uk",
  "skybet",
  "sport888",
  "ladbrokes_uk",
  "matchbook",
  "betfair",
  "betvictor",
  "coral",
  "boylesports",
];

const BOOKMAKER_DISPLAY_NAMES: Record<string, string> = {
  bet365: "Bet365",
  williamhill: "William Hill",
  paddypower: "Paddy Power",
  pinnacle: "Pinnacle",
  betfair_ex_eu: "Betfair Exchange",
  betfair_sb_uk: "Betfair Sportsbook",
  betway: "Betway",
  unibet_eu: "Unibet",
  unibet_uk: "Unibet UK",
  skybet: "Sky Bet",
  sport888: "888sport",
  ladbrokes_uk: "Ladbrokes",
  matchbook: "Matchbook",
  betfair: "Betfair",
  betvictor: "BetVictor",
  coral: "Coral",
  boylesports: "BoyleSports",
};

export interface LiveOddsBookmaker {
  key: string;
  name: string;
  home: number;
  draw: number;
  away: number;
  lastUpdate: string;
}

export interface LiveMatchOdds {
  id: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  bookmakers: LiveOddsBookmaker[];
  lastUpdated: string;
}

export interface OutrightOdds {
  team: string;
  flag: string;
  odds: number;
  bookmaker: string;
  bookmakerKey: string;
}

export interface OddsData {
  matchOdds: LiveMatchOdds[];
  fetchedAt: string;
}

export interface WinnerOddsData {
  outrightOdds: OutrightOdds[];
  fetchedAt: string;
  bookmakerCount: number;
}

function getDisplayName(key: string, title: string): string {
  return BOOKMAKER_DISPLAY_NAMES[key] || title;
}

function selectTopBookmakers(
  bookmakers: Array<{
    key: string;
    title: string;
    last_update: string;
    markets: Array<{
      key: string;
      outcomes: Array<{ name: string; price: number }>;
    }>;
  }>,
  limit = 10
): LiveOddsBookmaker[] {
  // Sort bookmakers: preferred ones first, then by name
  const sorted = [...bookmakers].sort((a, b) => {
    const aIdx = PREFERRED_BOOKMAKERS.indexOf(a.key);
    const bIdx = PREFERRED_BOOKMAKERS.indexOf(b.key);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.title.localeCompare(b.title);
  });

  const selected = sorted.slice(0, limit);

  return selected.map((bm) => {
    const h2h = bm.markets.find((m) => m.key === "h2h");
    const outcomes = h2h?.outcomes || [];

    // The API returns outcomes by team name, need to map to home/draw/away
    const homeOutcome = outcomes.find(
      (o) => o.name !== "Draw" && outcomes.indexOf(o) === 0
    );
    const awayOutcome = outcomes.find(
      (o) => o.name !== "Draw" && outcomes.indexOf(o) !== 0
    );
    const drawOutcome = outcomes.find((o) => o.name === "Draw");

    return {
      key: bm.key,
      name: getDisplayName(bm.key, bm.title),
      home: homeOutcome?.price || 0,
      draw: drawOutcome?.price || 0,
      away: awayOutcome?.price || 0,
      lastUpdate: bm.last_update,
    };
  });
}

export async function fetchMatchOdds(): Promise<OddsData> {
  try {
    const res = await fetch(MATCH_ODDS_URL, {
      next: { revalidate: 7200 }, // 2 hours
    });

    if (!res.ok) {
      console.error(`Odds API error: ${res.status} ${res.statusText}`);
      return { matchOdds: [], fetchedAt: new Date().toISOString() };
    }

    const data = await res.json();

    const matchOdds: LiveMatchOdds[] = data.map(
      (match: {
        id: string;
        home_team: string;
        away_team: string;
        commence_time: string;
        bookmakers: Array<{
          key: string;
          title: string;
          last_update: string;
          markets: Array<{
            key: string;
            outcomes: Array<{ name: string; price: number }>;
          }>;
        }>;
      }) => {
        const bookmakers = selectTopBookmakers(match.bookmakers);

        // Fix home/away mapping using team names from API
        const correctedBookmakers = bookmakers.map((bm) => {
          const originalBm = match.bookmakers.find(
            (ob) => ob.key === bm.key
          );
          const h2h = originalBm?.markets.find((m) => m.key === "h2h");
          const outcomes = h2h?.outcomes || [];

          const homePrice =
            outcomes.find((o) => o.name === match.home_team)?.price || 0;
          const awayPrice =
            outcomes.find((o) => o.name === match.away_team)?.price || 0;
          const drawPrice =
            outcomes.find((o) => o.name === "Draw")?.price || 0;

          return {
            ...bm,
            home: homePrice,
            draw: drawPrice,
            away: awayPrice,
          };
        });

        // Find latest update time from bookmakers
        const lastUpdated =
          match.bookmakers.reduce((latest, bm) => {
            return bm.last_update > latest ? bm.last_update : latest;
          }, "") || new Date().toISOString();

        return {
          id: match.id,
          homeTeam: match.home_team,
          awayTeam: match.away_team,
          commenceTime: match.commence_time,
          bookmakers: correctedBookmakers,
          lastUpdated,
        };
      }
    );

    return {
      matchOdds,
      fetchedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Failed to fetch match odds:", error);
    return { matchOdds: [], fetchedAt: new Date().toISOString() };
  }
}

export async function fetchWinnerOdds(): Promise<WinnerOddsData> {
  try {
    const res = await fetch(WINNER_ODDS_URL, {
      next: { revalidate: 3600 }, // 1 hour
    });

    if (!res.ok) {
      console.error(`Winner Odds API error: ${res.status} ${res.statusText}`);
      return { outrightOdds: [], fetchedAt: new Date().toISOString(), bookmakerCount: 0 };
    }

    const data = await res.json();

    // Aggregate across all bookmakers — find the best (lowest) odds for each team
    const teamBestOdds: Record<
      string,
      { odds: number; bookmaker: string; bookmakerKey: string }
    > = {};

    let bookmakerCount = 0;
    const bookmakerSet = new Set<string>();

    if (Array.isArray(data) && data.length > 0) {
      // Winner endpoint returns array with one item containing bookmakers
      const event = data[0];
      for (const bm of event.bookmakers || []) {
        bookmakerSet.add(bm.key);
        const outrights = bm.markets?.find(
          (m: { key: string }) => m.key === "outrights"
        );
        if (!outrights) continue;

        for (const outcome of outrights.outcomes || []) {
          const existing = teamBestOdds[outcome.name];
          if (!existing || outcome.price < existing.odds) {
            teamBestOdds[outcome.name] = {
              odds: outcome.price,
              bookmaker: getDisplayName(bm.key, bm.title),
              bookmakerKey: bm.key,
            };
          }
        }
      }
      bookmakerCount = bookmakerSet.size;
    }

    const outrightOdds: OutrightOdds[] = Object.entries(teamBestOdds)
      .map(([team, data]) => ({
        team,
        flag: getFlag(team),
        odds: data.odds,
        bookmaker: data.bookmaker,
        bookmakerKey: data.bookmakerKey,
      }))
      .sort((a, b) => a.odds - b.odds);

    return {
      outrightOdds,
      fetchedAt: new Date().toISOString(),
      bookmakerCount,
    };
  } catch (error) {
    console.error("Failed to fetch winner odds:", error);
    return { outrightOdds: [], fetchedAt: new Date().toISOString(), bookmakerCount: 0 };
  }
}

// Match API data to our local match data
export function matchApiToLocal(
  liveOdds: LiveMatchOdds[],
  localMatches: typeof allMatches
) {
  // Create a lookup by team names
  const liveByTeams = new Map<string, LiveMatchOdds>();
  for (const lo of liveOdds) {
    const key = `${lo.homeTeam}__${lo.awayTeam}`.toLowerCase();
    liveByTeams.set(key, lo);
    // Also try reverse since API home/away might differ from our data
    const reverseKey = `${lo.awayTeam}__${lo.homeTeam}`.toLowerCase();
    liveByTeams.set(reverseKey, lo);
  }

  return localMatches.map((match) => {
    const key = `${match.home}__${match.away}`.toLowerCase();
    const live = liveByTeams.get(key);
    return { match, liveOdds: live || null };
  });
}

// Fetch league odds from The Odds API
export async function fetchLeagueOdds(leagueId: number): Promise<LiveMatchOdds[]> {
  const sportKey = LEAGUE_SPORTS[leagueId as keyof typeof LEAGUE_SPORTS];
  if (!sportKey) {
    console.log(`No sport key found for league ${leagueId}`);
    return [];
  }

  try {
    const url = `https://api.the-odds-api.com/v4/sports/${sportKey}/odds?apiKey=${API_KEY}&regions=uk,eu,us&markets=h2h&oddsFormat=decimal`;
    
    const res = await fetch(url, {
      next: { revalidate: 3600 }, // 1 hour cache
    });

    if (!res.ok) {
      console.error(`League Odds API error for ${sportKey}: ${res.status} ${res.statusText}`);
      return [];
    }

    const data = await res.json();

    return data.map((match: any) => {
      const bookmakers = selectTopBookmakers(match.bookmakers);

      // Fix home/away mapping using team names from API
      const correctedBookmakers = bookmakers.map((bm) => {
        const originalBm = match.bookmakers.find((ob: any) => ob.key === bm.key);
        const h2h = originalBm?.markets.find((m: any) => m.key === "h2h");
        const outcomes = h2h?.outcomes || [];

        const homePrice = outcomes.find((o: any) => o.name === match.home_team)?.price || 0;
        const awayPrice = outcomes.find((o: any) => o.name === match.away_team)?.price || 0;
        const drawPrice = outcomes.find((o: any) => o.name === "Draw")?.price || 0;

        return {
          ...bm,
          home: homePrice,
          draw: drawPrice,
          away: awayPrice,
        };
      });

      const lastUpdated = match.bookmakers.reduce((latest: string, bm: any) => {
        return bm.last_update > latest ? bm.last_update : latest;
      }, "") || new Date().toISOString();

      return {
        id: match.id,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        commenceTime: match.commence_time,
        bookmakers: correctedBookmakers,
        lastUpdated,
      };
    });
  } catch (error) {
    console.error(`Failed to fetch league odds for ${sportKey}:`, error);
    return [];
  }
}

// Fetch all league odds
export async function fetchAllLeagueOdds(): Promise<Record<number, LiveMatchOdds[]>> {
  const leagueOdds: Record<number, LiveMatchOdds[]> = {};
  
  for (const [leagueId, sportKey] of Object.entries(LEAGUE_SPORTS)) {
    try {
      const odds = await fetchLeagueOdds(Number(leagueId));
      leagueOdds[Number(leagueId)] = odds;
    } catch (error) {
      console.error(`Failed to fetch odds for league ${leagueId}:`, error);
      leagueOdds[Number(leagueId)] = [];
    }
  }
  
  return leagueOdds;
}
