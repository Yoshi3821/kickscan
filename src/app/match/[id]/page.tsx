import { allMatches } from "@/data/matches";
import { getMatchAnalysis } from "@/data/analyses";
import { fetchMatchOdds, matchApiToLocal } from "@/lib/odds";
import MatchClient from "./MatchClient";
import AiChat from "@/components/AiChat";
import Link from "next/link";

export const revalidate = 7200;

export function generateStaticParams() {
  return allMatches.map((match) => ({
    id: String(match.id),
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = allMatches.find((m) => m.id === Number(id));
  if (!match) return { title: "Match Not Found | KickScan" };
  return {
    title: `${match.home} vs ${match.away} — AI Analysis | KickScan`,
    description: `AI prediction, fan votes, and live odds for ${match.home} vs ${match.away} at the 2026 FIFA World Cup. Group ${match.group} match at ${match.venue}.`,
  };
}

export default async function MatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const matchId = Number(id);
  const match = allMatches.find((m) => m.id === matchId);

  if (!match) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Match Not Found</h1>
          <p className="text-gray-400 mb-6">This match doesn&apos;t exist.</p>
          <Link href="/matches" className="text-cyan-400 hover:text-cyan-300 transition">
            ← View all matches
          </Link>
        </div>
      </div>
    );
  }

  const analysis = getMatchAnalysis(matchId);

  if (!analysis) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Analysis Unavailable</h1>
          <Link href="/matches" className="text-cyan-400 hover:text-cyan-300 transition">
            ← View all matches
          </Link>
        </div>
      </div>
    );
  }

  // Fetch live odds
  let bookmakers: { key: string; name: string; home: number; draw: number; away: number; lastUpdate: string }[] = [];
  try {
    const oddsData = await fetchMatchOdds();
    const merged = matchApiToLocal(oddsData.matchOdds, [match]);
    if (merged[0]?.liveOdds) {
      bookmakers = merged[0].liveOdds.bookmakers;
    }
  } catch {
    // Use empty bookmakers if API fails
  }

  // If no live odds, use generated odds from matches.ts
  if (bookmakers.length === 0) {
    const { getAllMatchesWithOdds } = await import("@/data/matches");
    const matchWithOdds = getAllMatchesWithOdds().find(m => m.id === matchId);
    if (matchWithOdds) {
      bookmakers = matchWithOdds.bookmakers.map(b => ({
        key: b.name.toLowerCase().replace(/\s/g, ""),
        name: b.name,
        home: b.home,
        draw: b.draw,
        away: b.away,
        lastUpdate: new Date().toISOString(),
      }));
    }
  }

  return (
    <main className="min-h-screen bg-dot-pattern">
      {/* Back navigation */}
      <div className="max-w-5xl mx-auto px-4 pt-6">
        <Link
          href="/matches"
          className="inline-flex items-center gap-1 text-sm text-gray-400 hover:text-cyan-400 transition"
        >
          ← All Matches
        </Link>
      </div>

      <MatchClient match={match} analysis={analysis} bookmakers={bookmakers} />

      <AiChat
        matchId={matchId}
        home={match.home}
        away={match.away}
        homeFlag={match.homeFlag}
        awayFlag={match.awayFlag}
        analysis={analysis}
        odds={bookmakers}
      />
    </main>
  );
}
