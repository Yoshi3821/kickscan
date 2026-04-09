import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { allMatches, wcFixtureIdMap } from "@/data/matches";
import { checkOddsApiRateLimit, logOddsApiUsage } from "@/lib/odds-api-monitor";

const ODDS_API_KEY = "2d76c480178eddba35634870e3420803";
const API_FOOTBALL_KEY = "3408fed656308fb4ade76a6b3212a975";

// The Odds API sport keys for qualifier matches
const QUALIFIER_SPORT = "soccer_fifa_world_cup_qualifiers_europe";
const FRIENDLY_SPORT = "soccer_international_friendlies";

// Team name mapping: The Odds API names → our match names
const TEAM_NAME_MAP: Record<string, string> = {
  "Italy": "Italy",
  "Northern Ireland": "Northern Ireland",
  "Wales": "Wales",
  "Bosnia and Herzegovina": "Bosnia & Herzegovina",
  "Bosnia & Herzegovina": "Bosnia & Herzegovina",
  "Ukraine": "Ukraine",
  "Sweden": "Sweden",
  "Poland": "Poland",
  "Albania": "Albania",
  "Turkey": "Turkey",
  "Romania": "Romania",
  "Slovakia": "Slovakia",
  "Kosovo": "Kosovo",
  "Denmark": "Denmark",
  "North Macedonia": "North Macedonia",
  "Czech Republic": "Czechia",
  "Czechia": "Czechia",
  "Republic of Ireland": "Rep. of Ireland",
  "Rep. of Ireland": "Rep. of Ireland",
  "Ireland": "Rep. of Ireland",
  "New Caledonia": "New Caledonia",
  "Jamaica": "Jamaica",
  "Bolivia": "Bolivia",
  "Suriname": "Suriname",
  "Brazil": "Brazil",
  "France": "France",
  "Colombia": "Colombia",
  "Croatia": "Croatia",
  "England": "England",
  "Uruguay": "Uruguay",
  "Switzerland": "Switzerland",
  "Germany": "Germany",
  "Spain": "Spain",
  "Serbia": "Serbia",
  "Argentina": "Argentina",
  "Mauritania": "Mauritania",
  "Saudi Arabia": "Saudi Arabia",
  "Egypt": "Egypt",
  "USA": "USA",
  "United States": "USA",
  "Belgium": "Belgium",
  "Mexico": "Mexico",
  "Portugal": "Portugal",
  "Ghana": "Ghana",
  "Japan": "Japan",
  "Zambia": "Zambia",
  "Algeria": "Algeria",
};

function normalizeTeamName(name: string): string {
  return TEAM_NAME_MAP[name] || name;
}

// Build reverse lookup: "home|away" → wc match id
const wcMatchLookup: Record<string, number> = {};
for (const match of allMatches) {
  if (match.group === "WCQ" || match.group === "FRI") {
    const key = `${match.home}|${match.away}`;
    wcMatchLookup[key] = match.id;
  }
}

export async function GET() {
  const results: { matchId: string; source: string; odds: { home: number; draw: number; away: number } }[] = [];
  const errors: string[] = [];

  // 1. Fetch from The Odds API for qualifiers
  for (const sport of [QUALIFIER_SPORT, FRIENDLY_SPORT]) {
    try {
      const url = `https://api.the-odds-api.com/v4/sports/${sport}/odds?apiKey=${ODDS_API_KEY}&regions=uk,eu,us&markets=h2h&oddsFormat=decimal`;
      const res = await fetch(url, { next: { revalidate: 3600 } });
      
      // Monitor rate limits
      const remaining = checkOddsApiRateLimit(res);
      logOddsApiUsage(`wc-playoff-odds/${sport}`, remaining);
      
      if (!res.ok) {
        errors.push(`Odds API ${sport}: ${res.status}`);
        continue;
      }
      const events = await res.json();

      for (const event of events) {
        const home = normalizeTeamName(event.home_team);
        const away = normalizeTeamName(event.away_team);
        const key = `${home}|${away}`;
        const matchId = wcMatchLookup[key];

        if (!matchId) continue;

        // Average odds across bookmakers
        let totalHome = 0, totalDraw = 0, totalAway = 0, count = 0;
        for (const bk of event.bookmakers || []) {
          const h2h = bk.markets?.find((m: any) => m.key === "h2h");
          if (!h2h) continue;
          const outcomes = h2h.outcomes || [];
          const homeOdds = outcomes.find((o: any) => normalizeTeamName(o.name) === home)?.price;
          const awayOdds = outcomes.find((o: any) => normalizeTeamName(o.name) === away)?.price;
          const drawOdds = outcomes.find((o: any) => o.name === "Draw")?.price;
          if (homeOdds && drawOdds && awayOdds) {
            totalHome += homeOdds;
            totalDraw += drawOdds;
            totalAway += awayOdds;
            count++;
          }
        }

        if (count > 0) {
          const odds = {
            home: Math.round((totalHome / count) * 100) / 100,
            draw: Math.round((totalDraw / count) * 100) / 100,
            away: Math.round((totalAway / count) * 100) / 100,
          };

          results.push({ matchId: `wc_${matchId}`, source: "odds-api", odds });

          // Store in cache
          try {
            await supabaseAdmin.from("match_odds_cache").upsert({
              match_id: `wc_${matchId}`,
              average_home_odds: odds.home,
              average_draw_odds: odds.draw,
              average_away_odds: odds.away,
              bookmaker_count: count,
              updated_at: new Date().toISOString(),
            }, { onConflict: "match_id" });
          } catch (e: any) {
            errors.push(`Cache error wc_${matchId}: ${e.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`Odds API fetch error (${sport}): ${e.message}`);
    }
  }

  // 2. Fetch from API-Football for matches with fixture IDs (friendlies + qualifiers fallback)
  const missingMatchIds = allMatches
    .filter(m => (m.group === "WCQ" || m.group === "FRI") && !results.find(r => r.matchId === `wc_${m.id}`))
    .map(m => m.id);

  for (const wcId of missingMatchIds) {
    const fixtureId = wcFixtureIdMap[wcId];
    if (!fixtureId) continue;

    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/odds?fixture=${fixtureId}&bookmaker=8`,
        {
          headers: { "x-apisports-key": API_FOOTBALL_KEY },
          next: { revalidate: 3600 },
        }
      );
      const data = await res.json();
      const bets = data.response?.[0]?.bookmakers?.[0]?.bets;
      const h2h = bets?.find((b: any) => b.id === 1);
      if (h2h) {
        const values = h2h.values || [];
        const homeOdds = parseFloat(values.find((v: any) => v.value === "Home")?.odd || "0");
        const drawOdds = parseFloat(values.find((v: any) => v.value === "Draw")?.odd || "0");
        const awayOdds = parseFloat(values.find((v: any) => v.value === "Away")?.odd || "0");

        if (homeOdds > 0 && drawOdds > 0 && awayOdds > 0) {
          const odds = { home: homeOdds, draw: drawOdds, away: awayOdds };
          results.push({ matchId: `wc_${wcId}`, source: "api-football", odds });

          try {
            await supabaseAdmin.from("match_odds_cache").upsert({
              match_id: `wc_${wcId}`,
              average_home_odds: odds.home,
              average_draw_odds: odds.draw,
              average_away_odds: odds.away,
              bookmaker_count: 1,
              updated_at: new Date().toISOString(),
            }, { onConflict: "match_id" });
          } catch (e: any) {
            errors.push(`Cache error wc_${wcId}: ${e.message}`);
          }
        }
      }
    } catch (e: any) {
      errors.push(`API-Football error for fixture ${fixtureId}: ${e.message}`);
    }
  }

  return NextResponse.json({
    success: true,
    fetched: results.length,
    results,
    errors: errors.length > 0 ? errors : undefined,
  });
}
