import { getAllLeagueFixtures, LEAGUES } from "@/lib/league-api";
import { generateAutoVerdict } from "@/lib/auto-verdict";
import { NextResponse } from "next/server";

export const revalidate = 3600;

const ODDS_API_KEY = "2d76c480178eddba35634870e3420803";
const ODDS_LEAGUES = [
  { key: "soccer_epl", name: "Premier League", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", logo: "https://media.api-sports.io/football/leagues/39.png" },
  { key: "soccer_spain_la_liga", name: "La Liga", flag: "🇪🇸", logo: "https://media.api-sports.io/football/leagues/140.png" },
  { key: "soccer_italy_serie_a", name: "Serie A", flag: "🇮🇹", logo: "https://media.api-sports.io/football/leagues/135.png" },
  { key: "soccer_germany_bundesliga", name: "Bundesliga", flag: "🇩🇪", logo: "https://media.api-sports.io/football/leagues/78.png" },
  { key: "soccer_uefa_champs_league", name: "Champions League", flag: "🇪🇺", logo: "https://media.api-sports.io/football/leagues/2.png" },
];

// Fetch all league odds in one batch (called once, cached 2h)
async function fetchBatchOdds(): Promise<Map<string, { home: number; draw: number; away: number }>> {
  const oddsMap = new Map<string, { home: number; draw: number; away: number }>();
  
  const results = await Promise.allSettled(
    ODDS_LEAGUES.map(async (league) => {
      const res = await fetch(
        `https://api.the-odds-api.com/v4/sports/${league.key}/odds?apiKey=${ODDS_API_KEY}&regions=uk,eu&markets=h2h&oddsFormat=decimal`,
        { next: { revalidate: 7200 } }
      );
      if (!res.ok) return [];
      return res.json();
    })
  );
  
  for (const result of results) {
    if (result.status !== "fulfilled" || !Array.isArray(result.value)) continue;
    for (const match of result.value) {
      // Average odds across all bookmakers
      let homeTotal = 0, drawTotal = 0, awayTotal = 0, count = 0;
      for (const bm of (match.bookmakers || [])) {
        const h2h = bm.markets?.find((m: any) => m.key === "h2h");
        if (!h2h) continue;
        const homePrice = h2h.outcomes?.find((o: any) => o.name === match.home_team)?.price;
        const awayPrice = h2h.outcomes?.find((o: any) => o.name === match.away_team)?.price;
        const drawPrice = h2h.outcomes?.find((o: any) => o.name === "Draw")?.price;
        if (homePrice && awayPrice && drawPrice) {
          homeTotal += homePrice;
          drawTotal += drawPrice;
          awayTotal += awayPrice;
          count++;
        }
      }
      if (count > 0) {
        // Key by normalized team names for matching
        const key = `${match.home_team}|||${match.away_team}`.toLowerCase();
        oddsMap.set(key, {
          home: Math.round((homeTotal / count) * 100) / 100,
          draw: Math.round((drawTotal / count) * 100) / 100,
          away: Math.round((awayTotal / count) * 100) / 100,
        });
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

export async function GET() {
  try {
    // Fetch odds in parallel (one batch call, cached 2h)
    const oddsMapPromise = fetchBatchOdds().catch(() => new Map());
    
    // Try API-Football first
    const fixtures = await getAllLeagueFixtures(12);
    const oddsMap = await oddsMapPromise;
    
    if (fixtures.length > 0) {
      const results = fixtures.slice(0, 6).map((fixture) => {
        const verdict = generateAutoVerdict(fixture, null, null, [], [], []);
        const league = LEAGUES.find(l => l.id === fixture.league.id);
        
        // Match odds by team names
        const oddsKey = `${fixture.home.name}|||${fixture.away.name}`.toLowerCase();
        const matchOdds = oddsMap.get(oddsKey) || null;
        
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
          avgOdds: matchOdds,
        };
      });
      return NextResponse.json(results);
    }
    
    // Fallback: use The Odds API
    const fallback = await getOddsApiFallback();
    // Attach odds to fallback matches too
    const fallbackWithOdds = fallback.map((m: any) => {
      const oddsKey = `${m.homeName}|||${m.awayName}`.toLowerCase();
      return { ...m, avgOdds: oddsMap.get(oddsKey) || null };
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
