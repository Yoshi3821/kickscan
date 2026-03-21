import { getAllLeagueFixtures, LEAGUES } from "@/lib/league-api";
import { generateAutoVerdict } from "@/lib/auto-verdict";
import { NextResponse } from "next/server";

export const revalidate = 300; // 5 min — needs to be fresh for live scores

const ODDS_API_KEY = "2d76c480178eddba35634870e3420803";
const ODDS_LEAGUES = [
  { key: "soccer_epl", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://media.api-sports.io/football/leagues/39.png" },
  { key: "soccer_spain_la_liga", name: "La Liga", flag: "🇪🇸", logo: "https://media.api-sports.io/football/leagues/140.png" },
  { key: "soccer_italy_serie_a", name: "Serie A", flag: "🇮🇹", logo: "https://media.api-sports.io/football/leagues/135.png" },
  { key: "soccer_germany_bundesliga", name: "Bundesliga", flag: "🇩🇪", logo: "https://media.api-sports.io/football/leagues/78.png" },
  { key: "soccer_uefa_champs_league", name: "Champions League", flag: "🇪🇺", logo: "https://media.api-sports.io/football/leagues/2.png" },
];

// Team name aliases: Odds API name → canonical short name for fuzzy matching
const TEAM_ALIASES: Record<string, string> = {
  "brighton and hove albion": "brighton",
  "tsg hoffenheim": "hoffenheim",
  "1899 hoffenheim": "hoffenheim",
  "wolverhampton wanderers": "wolves",
  "wolverhampton": "wolves",
  "tottenham hotspur": "tottenham",
  "nottingham forest": "nott forest",
  "west ham united": "west ham",
  "newcastle united": "newcastle",
  "manchester united": "man united",
  "manchester city": "man city",
  "leeds united": "leeds",
  "leicester city": "leicester",
  "aston villa": "aston villa",
  "borussia dortmund": "dortmund",
  "borussia monchengladbach": "monchengladbach",
  "borussia mönchengladbach": "monchengladbach",
  "bayer 04 leverkusen": "leverkusen",
  "bayer leverkusen": "leverkusen",
  "bayern munich": "bayern",
  "bayern münchen": "bayern",
  "fc bayern münchen": "bayern",
  "eintracht frankfurt": "frankfurt",
  "rb leipzig": "rb leipzig",
  "vfb stuttgart": "stuttgart",
  "vfl wolfsburg": "wolfsburg",
  "sc freiburg": "freiburg",
  "fsv mainz 05": "mainz",
  "1. fc köln": "koln",
  "fc köln": "koln",
  "1. fc heidenheim": "heidenheim",
  "fc st. pauli": "st. pauli",
  "atletico madrid": "atletico",
  "atlético madrid": "atletico",
  "atlético de madrid": "atletico",
  "real sociedad": "real sociedad",
  "real betis": "real betis",
  "athletic bilbao": "athletic",
  "athletic club": "athletic",
  "celta vigo": "celta",
  "rc celta": "celta",
  "rayo vallecano": "rayo",
  "deportivo alavés": "alaves",
  "deportivo alaves": "alaves",
  "internazionale": "inter",
  "inter milan": "inter",
  "ac milan": "milan",
  "as roma": "roma",
  "ss lazio": "lazio",
  "ssc napoli": "napoli",
  "hellas verona": "verona",
  "paris saint-germain": "psg",
  "paris saint germain": "psg",
  "olympique marseille": "marseille",
  "olympique lyonnais": "lyon",
  "olympique de marseille": "marseille",
  "as monaco": "monaco",
};

function normalizeTeamName(name: string): string {
  const lower = name.toLowerCase().trim();
  if (TEAM_ALIASES[lower]) return TEAM_ALIASES[lower];
  // Strip common suffixes/prefixes
  return lower
    .replace(/^fc\s+/, "")
    .replace(/\s+fc$/, "")
    .replace(/\s+cf$/, "")
    .replace(/\s+sc$/, "")
    .trim();
}

// Market data per match: h2h odds + totals + BTTS + consensus
interface MarketData {
  home: number;
  draw: number;
  away: number;
  totalLine?: number;
  overOdds?: number;
  underOdds?: number;
  bttsYes?: number;
  bttsNo?: number;
  // Derived market intelligence
  homeProb?: number;     // implied probability %
  drawProb?: number;
  awayProb?: number;
  overProb?: number;     // over line probability %
  bttsProb?: number;     // BTTS Yes probability %
  bookmakerCount?: number;
  consensusLevel?: "strong" | "moderate" | "split";  // how much bookmakers agree
  marketFavorite?: string; // "home" | "draw" | "away"
}

// Fetch all league odds in one batch (called once, cached 2h)
// Now fetches h2h + totals + BTTS for score modelling
async function fetchBatchOdds(): Promise<Map<string, MarketData>> {
  const oddsMap = new Map<string, MarketData>();
  
  const results = await Promise.allSettled(
    ODDS_LEAGUES.map(async (league) => {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${league.key}/odds?apiKey=${ODDS_API_KEY}&regions=uk,eu&markets=h2h,totals,btts&oddsFormat=decimal`,
        { next: { revalidate: 7200 } }
      );
      if (!res.ok) return [];
      return res.json();
    })
  );
  
  for (const result of results) {
    if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
    for (const match of result.value) {
      let homeTotal = 0, drawTotal = 0, awayTotal = 0, h2hCount = 0;
      let homeMin = 99, homeMax = 0;
      let overTotal = 0, underTotal = 0, totalsCount = 0, totalLine = 2.5;
      let bttsYesTotal = 0, bttsNoTotal = 0, bttsCount = 0;

      for (const bm of (match.bookmakers || [])) {
        // H2H market
        const h2h = bm.markets?.find((m: any) => m.key === "h2h");
        if (h2h) {
          const homePrice = h2h.outcomes?.find((o: any) => o.name === match.home_team)?.price;
          const awayPrice = h2h.outcomes?.find((o: any) => o.name === match.away_team)?.price;
          const drawPrice = h2h.outcomes?.find((o: any) => o.name === "Draw")?.price;
          if (homePrice && awayPrice && drawPrice) {
            homeTotal += homePrice;
            drawTotal += drawPrice;
            awayTotal += awayPrice;
            if (homePrice < homeMin) homeMin = homePrice;
            if (homePrice > homeMax) homeMax = homePrice;
            h2hCount++;
          }
        }

        // Totals market (over/under)
        const totals = bm.markets?.find((m: any) => m.key === "totals");
        if (totals) {
          const over = totals.outcomes?.find((o: any) => o.name === "Over");
          const under = totals.outcomes?.find((o: any) => o.name === "Under");
          if (over?.price && under?.price) {
            overTotal += over.price;
            underTotal += under.price;
            if (over.point) totalLine = over.point;
            totalsCount++;
          }
        }

        // BTTS market
        const btts = bm.markets?.find((m: any) => m.key === "btts");
        if (btts) {
          const yes = btts.outcomes?.find((o: any) => o.name === "Yes")?.price;
          const no = btts.outcomes?.find((o: any) => o.name === "No")?.price;
          if (yes && no) {
            bttsYesTotal += yes;
            bttsNoTotal += no;
            bttsCount++;
          }
        }
      }

      if (h2hCount > 0) {
        const data: MarketData = {
          home: Math.round((homeTotal / h2hCount) * 100) / 100,
          draw: Math.round((drawTotal / h2hCount) * 100) / 100,
          away: Math.round((awayTotal / h2hCount) * 100) / 100,
        };
        if (totalsCount > 0) {
          data.totalLine = totalLine;
          data.overOdds = Math.round((overTotal / totalsCount) * 100) / 100;
          data.underOdds = Math.round((underTotal / totalsCount) * 100) / 100;
        }
        if (bttsCount > 0) {
          data.bttsYes = Math.round((bttsYesTotal / bttsCount) * 100) / 100;
          data.bttsNo = Math.round((bttsNoTotal / bttsCount) * 100) / 100;
        }

        // Derived: implied probabilities (overround removed)
        const rawHome = 1 / data.home;
        const rawDraw = 1 / data.draw;
        const rawAway = 1 / data.away;
        const overround = rawHome + rawDraw + rawAway;
        data.homeProb = Math.round((rawHome / overround) * 100);
        data.drawProb = Math.round((rawDraw / overround) * 100);
        data.awayProb = 100 - data.homeProb - data.drawProb;

        // Derived: O/U probability
        if (data.overOdds && data.underOdds) {
          const rawOver = 1 / data.overOdds;
          const rawUnder = 1 / data.underOdds;
          data.overProb = Math.round((rawOver / (rawOver + rawUnder)) * 100);
        }

        // Derived: BTTS probability
        if (data.bttsYes && data.bttsNo) {
          const rawBttsY = 1 / data.bttsYes;
          const rawBttsN = 1 / data.bttsNo;
          data.bttsProb = Math.round((rawBttsY / (rawBttsY + rawBttsN)) * 100);
        }

        // Derived: market favorite
        data.marketFavorite = data.homeProb >= data.awayProb && data.homeProb >= data.drawProb
          ? "home" : data.awayProb >= data.homeProb && data.awayProb >= data.drawProb
          ? "away" : "draw";

        // Derived: bookmaker consensus (based on odds spread)
        data.bookmakerCount = h2hCount;
        const homeSpreadPct = homeMin > 0 ? ((homeMax - homeMin) / homeMin) * 100 : 0;
        // Tight spread (<10%) = strong consensus, 10-25% = moderate, >25% = split
        if (h2hCount >= 3 && homeSpreadPct < 10) {
          data.consensusLevel = "strong";
        } else if (homeSpreadPct < 25) {
          data.consensusLevel = "moderate";
        } else {
          data.consensusLevel = "split";
        }

        const exactKey = `${match.home_team}|||${match.away_team}`.toLowerCase();
        const normKey = `${normalizeTeamName(match.home_team)}|||${normalizeTeamName(match.away_team)}`;
        oddsMap.set(exactKey, data);
        if (normKey !== exactKey) oddsMap.set(normKey, data);
      }
    }
  }
  
  return oddsMap;
}

async function getOddsApiFallback(): Promise<any[]> {
  const allMatches: any[] = [];
  
  const results = await Promise.allSettled(
    ODDS_LEAGUES.map(async (league) => {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${league.key}/odds?apiKey=${ODDS_API_KEY}&regions=uk&markets=h2h&oddsFormat=decimal`,
        { next: { revalidate: 7200 } }
      );
      if (!res.ok) return [];
      const data = await res.json();
      return data.slice(0, 3).map((m: any) => {
        const homeOdds = m.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === m.home_team)?.price || 2.0;
        const awayOdds = m.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === m.away_team)?.price || 3.0;
        const drawOdds = m.bookmakers?.[0]?.markets?.[0]?.outcomes?.find((o: any) => o.name === "Draw")?.price || 3.5;
        
        const total = 1/homeOdds + 1/drawOdds + 1/awayOdds;
        const homePct = Math.round((1/homeOdds/total) * 100);
        const awayPct = Math.round((1/awayOdds/total) * 100);
        const drawPct = 100 - homePct - awayPct;
        
        const pick = homePct >= awayPct ? `${m.home_team} Win` : `${m.away_team} Win`;
        const conf = Math.max(homePct, awayPct);
        let rec = "LEAN";
        if (conf > 60) rec = "BET";
        if (conf < 40) rec = "SKIP";
        
        return {
          id: m.id,
          leagueName: league.name,
          leagueLogo: league.logo,
          leagueFlag: league.flag,
          homeName: m.home_team,
          awayName: m.away_team,
          homeLogo: "",
          awayLogo: "",
          date: m.commence_time,
          recommendation: rec,
          pick: pick,
          valueRating: conf > 55 ? 4 : conf > 45 ? 3 : 2,
          riskLevel: conf > 60 ? "LOW" : conf > 45 ? "MEDIUM" : "HIGH",
          confidencePct: conf,
          predictedScore: `${Math.round(homePct/25)}-${Math.round(awayPct/30)}`,
        };
      });
    })
  );
  
  for (const result of results) {
    if (result.status === "fulfilled") allMatches.push(...result.value);
  }
  
  allMatches.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return allMatches.slice(0, 6);
}

// Fetch today's live/finished fixtures from API-Football
async function getTodayFixtures(): Promise<any[]> {
  const today = new Date().toISOString().split('T')[0];
  const LEAGUE_IDS = [39, 140, 135, 78, 2]; // EPL, La Liga, Serie A, Bundesliga, UCL
  const allFixtures: any[] = [];
  
  for (const leagueId of LEAGUE_IDS) {
    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?league=${leagueId}&date=${today}&season=${new Date().getFullYear()}`,
        {
          headers: { 'x-apisports-key': '3408fed656308fb4ade76a6b3212a975' },
          next: { revalidate: 300 } // 5 min cache for live data
        }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.response) {
          for (const item of data.response) {
            const status = item.fixture?.status?.short || '';
            // Include live, HT, finished, and not started
            if (['1H', '2H', 'HT', 'ET', 'P', 'FT', 'AET', 'PEN', 'NS'].includes(status)) {
              allFixtures.push(item);
            }
          }
        }
      }
    } catch {}
  }
  return allFixtures;
}

export async function GET() {
  try {
    // Fetch odds + today's fixtures in parallel
    const oddsMapPromise = fetchBatchOdds().catch(() => new Map());
    const todayFixturesPromise = getTodayFixtures().catch(() => []);
    
    // Try API-Football for upcoming
    const fixtures = await getAllLeagueFixtures(12);
    const oddsMap = await oddsMapPromise;
    const todayFixtures = await todayFixturesPromise;
    
    if (fixtures.length > 0 || todayFixtures.length > 0) {
      // Build upcoming results
      const upcomingIds = new Set<number>();
      const results = fixtures.slice(0, 8).map((fixture) => {
        upcomingIds.add(fixture.id);
        const league = LEAGUES.find(l => l.id === fixture.league.id);
        
        const exactKey = `${fixture.home.name}|||${fixture.away.name}`.toLowerCase();
        const normKey = `${normalizeTeamName(fixture.home.name)}|||${normalizeTeamName(fixture.away.name)}`;
        const matchOdds = oddsMap.get(exactKey) || oddsMap.get(normKey) || null;
        
        // Convert market data to FixtureOdds format + pass market extras
        const fixtureOdds = matchOdds ? [{ bookmaker: "market_avg", home: matchOdds.home, draw: matchOdds.draw, away: matchOdds.away }] : [];
        const marketExtras = matchOdds ? {
          totalLine: matchOdds.totalLine,
          overOdds: matchOdds.overOdds,
          underOdds: matchOdds.underOdds,
          bttsYes: matchOdds.bttsYes,
          bttsNo: matchOdds.bttsNo,
        } : undefined;
        
        const verdict = generateAutoVerdict(fixture, null, null, [], [], fixtureOdds, marketExtras);
        
        return {
          id: fixture.id,
          leagueName: fixture.league.name,
          leagueLogo: fixture.league.logo,
          leagueFlag: league?.flag || "⚽",
          homeName: fixture.home.name,
          awayName: fixture.away.name,
          homeLogo: fixture.home.logo,
          awayLogo: fixture.away.logo,
          date: fixture.date,
          recommendation: verdict.recommendation,
          pick: verdict.pick,
          valueRating: verdict.valueRating,
          riskLevel: verdict.riskLevel,
          confidencePct: verdict.confidencePct,
          predictedScore: verdict.predictedScore,
          scoreExplanation: verdict.scoreExplanation,
          alternateScore: verdict.alternateScore,
          longshotScore: verdict.longshotScore,
          avgOdds: matchOdds ? { home: matchOdds.home, draw: matchOdds.draw, away: matchOdds.away } : null,
          marketIntel: matchOdds ? {
            homeProb: matchOdds.homeProb,
            drawProb: matchOdds.drawProb,
            awayProb: matchOdds.awayProb,
            overProb: matchOdds.overProb,
            totalLine: matchOdds.totalLine,
            bttsProb: matchOdds.bttsProb,
            bookmakerCount: matchOdds.bookmakerCount,
            consensusLevel: matchOdds.consensusLevel,
            marketFavorite: matchOdds.marketFavorite,
          } : null,
          matchStatus: 'NS',
        };
      });

      // Add today's live/finished fixtures that aren't already in upcoming
      for (const item of todayFixtures) {
        const fixtureId = item.fixture?.id;
        if (!fixtureId || upcomingIds.has(fixtureId)) continue;
        
        const status = item.fixture?.status?.short || 'NS';
        if (status === 'NS') continue; // Skip not-started (already in upcoming)
        
        const leagueObj = LEAGUES.find(l => l.id === item.league?.id);
        const exactKey = `${item.teams?.home?.name}|||${item.teams?.away?.name}`.toLowerCase();
        const normKey = `${normalizeTeamName(item.teams?.home?.name || '')}|||${normalizeTeamName(item.teams?.away?.name || '')}`;
        
        results.push({
          id: fixtureId,
          leagueName: item.league?.name || 'League',
          leagueLogo: item.league?.logo || '',
          leagueFlag: leagueObj?.flag || '⚽',
          homeName: item.teams?.home?.name || 'Home',
          awayName: item.teams?.away?.name || 'Away',
          homeLogo: item.teams?.home?.logo || '',
          awayLogo: item.teams?.away?.logo || '',
          date: item.fixture?.date || new Date().toISOString(),
          recommendation: 'SKIP',
          pick: '',
          valueRating: 1,
          riskLevel: 'MEDIUM',
          confidencePct: 0,
          predictedScore: '',
          avgOdds: oddsMap.get(exactKey) || oddsMap.get(normKey) || null,
          matchStatus: status,
          liveScore: {
            home: item.goals?.home ?? 0,
            away: item.goals?.away ?? 0,
            minute: item.fixture?.status?.elapsed ?? 0,
            status: status,
          },
        } as any);
      }

      // Sort: live first, then upcoming by date, then finished last
      const statusOrder: Record<string, number> = { '1H': 0, '2H': 0, 'HT': 0, 'ET': 0, 'P': 0, 'NS': 1, 'FT': 2, 'AET': 2, 'PEN': 2 };
      results.sort((a, b) => {
        const aOrder = statusOrder[a.matchStatus || 'NS'] ?? 1;
        const bOrder = statusOrder[b.matchStatus || 'NS'] ?? 1;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });

      return NextResponse.json(results);
    }
    
    // Fallback: use The Odds API
    const fallback = await getOddsApiFallback();
    // Attach odds to fallback matches too
    const fallbackWithOdds = fallback.map((m: any) => {
      const exactKey = `${m.homeName}|||${m.awayName}`.toLowerCase();
      const normKey = `${normalizeTeamName(m.homeName)}|||${normalizeTeamName(m.awayName)}`;
      return { ...m, avgOdds: oddsMap.get(exactKey) || oddsMap.get(normKey) || null };
    });
    return NextResponse.json(fallbackWithOdds);
  } catch {
    // Last resort fallback
    try {
      const fallback = await getOddsApiFallback();
      return NextResponse.json(fallback);
    } catch {
      return NextResponse.json([]);
    }
  }
}
