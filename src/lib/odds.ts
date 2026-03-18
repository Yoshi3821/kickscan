import { allMatches, getFlag } from "@/data/matches";

const API_KEY = "3867fcd18cb17e163f3cb5242d92ba45";
const MATCH_ODDS_URL = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds?apiKey=${API_KEY}&regions=uk,eu,us&markets=h2h&oddsFormat=decimal`;
const WINNER_ODDS_URL = `https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup_winner/odds?apiKey=${API_KEY}&regions=uk,eu&markets=outrights&oddsFormat=decimal`;

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
