import { allMatches, groups } from "@/data/matches";
import {
  fetchMatchOdds,
  matchApiToLocal,
  type LiveMatchOdds,
} from "@/lib/odds";
import OddsClient from "./OddsClient";

export const revalidate = 7200;

export default async function OddsPage() {
  const oddsData = await fetchMatchOdds();
  const merged = matchApiToLocal(oddsData.matchOdds, allMatches);

  // Serialize for client component
  const matchesWithLiveOdds = merged.map(({ match, liveOdds }) => ({
    ...match,
    liveOdds: liveOdds
      ? {
          bookmakers: liveOdds.bookmakers.map((bm) => ({
            key: bm.key,
            name: bm.name,
            home: bm.home,
            draw: bm.draw,
            away: bm.away,
            lastUpdate: bm.lastUpdate,
          })),
          lastUpdated: liveOdds.lastUpdated,
        }
      : null,
  }));

  const liveMatchCount = matchesWithLiveOdds.filter(
    (m) => m.liveOdds !== null
  ).length;
  const bookmakerCount = new Set(
    oddsData.matchOdds.flatMap((m) => m.bookmakers.map((b) => b.key))
  ).size;

  return (
    <OddsClient
      matches={matchesWithLiveOdds}
      fetchedAt={oddsData.fetchedAt}
      liveMatchCount={liveMatchCount}
      bookmakerCount={bookmakerCount}
    />
  );
}
