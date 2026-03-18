import { NextRequest, NextResponse } from "next/server";
import { allMatches } from "@/data/matches";
import { getMatchAnalysis } from "@/data/analyses";
import { generateChatResponse } from "@/lib/chat-engine";

// Simple in-memory rate limiting (resets on cold start — fine for MVP)
const rateLimits = new Map<string, { date: string; count: number }>();

const DAILY_LIMIT = 5;

function checkRateLimit(visitorId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split("T")[0];
  const entry = rateLimits.get(visitorId);

  if (!entry || entry.date !== today) {
    rateLimits.set(visitorId, { date: today, count: 1 });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  rateLimits.set(visitorId, entry);
  return { allowed: true, remaining: DAILY_LIMIT - entry.count };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, question, visitorId } = body;

    if (!matchId || !question || !visitorId) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, question, visitorId" },
        { status: 400 }
      );
    }

    // Rate limit check
    const { allowed, remaining } = checkRateLimit(visitorId);
    if (!allowed) {
      return NextResponse.json(
        {
          answer: "You've used all 5 free questions today. Come back tomorrow! 🔒",
          questionsRemaining: 0,
          rateLimited: true,
        },
        { status: 200 }
      );
    }

    // Get match data
    const match = allMatches.find((m) => m.id === Number(matchId));
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const analysis = getMatchAnalysis(Number(matchId));
    if (!analysis) {
      return NextResponse.json({ error: "Analysis not available" }, { status: 404 });
    }

    // Get odds data
    let odds: { key: string; name: string; home: number; draw: number; away: number }[] = [];
    try {
      const { getAllMatchesWithOdds } = await import("@/data/matches");
      const matchWithOdds = getAllMatchesWithOdds().find((m) => m.id === Number(matchId));
      if (matchWithOdds) {
        odds = matchWithOdds.bookmakers.map((b) => ({
          key: b.name.toLowerCase().replace(/\s/g, ""),
          name: b.name,
          home: b.home,
          draw: b.draw,
          away: b.away,
        }));
      }
    } catch {
      // No odds available
    }

    // Generate response
    const answer = generateChatResponse(question, {
      home: match.home,
      away: match.away,
      homeFlag: match.homeFlag,
      awayFlag: match.awayFlag,
      group: match.group,
      date: match.date,
      time: match.time,
      venue: match.venue,
      city: match.city,
      analysis,
      odds,
    });

    return NextResponse.json({
      answer,
      questionsRemaining: remaining,
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
