import { NextRequest, NextResponse } from "next/server";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

const VOTES_PATH = join(process.cwd(), "src", "data", "votes.json");

interface VoteData {
  totals: { home: number; draw: number; away: number };
  voters: Record<string, "home" | "draw" | "away">;
}

type VotesStore = Record<string, VoteData>;

// Seeded random number generator based on match ID
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Power ratings for realistic seed vote distribution
const POWER: Record<string, number> = {
  "Spain": 94, "Argentina": 93, "Brazil": 92, "France": 91, "Portugal": 90,
  "England": 89, "Germany": 88, "Netherlands": 87, "Belgium": 85, "Croatia": 84,
  "Uruguay": 83, "Colombia": 82, "Switzerland": 83, "Morocco": 82, "Japan": 81,
  "Mexico": 80, "Senegal": 79, "South Korea": 79, "USA": 78, "Austria": 78,
  "Ivory Coast": 78, "Ecuador": 77, "Norway": 77, "Canada": 76, "Egypt": 76,
  "Algeria": 75, "Australia": 75, "Scotland": 74, "Iran": 74, "Tunisia": 73,
  "Ghana": 73, "Saudi Arabia": 72, "Qatar": 72, "South Africa": 71,
  "Uzbekistan": 70, "Panama": 68, "Jordan": 67, "New Zealand": 65,
  "Cape Verde": 62, "Haiti": 58, "Curacao": 55,
  "UEFA playoff A": 72, "UEFA playoff B": 72, "UEFA playoff C": 72, "UEFA playoff D": 72,
  "ICP1": 65, "ICP2": 65,
};

// All matches for seed generation
import { allMatches } from "@/data/matches";

function generateSeedVotes(): VotesStore {
  const store: VotesStore = {};

  for (const match of allMatches) {
    const rng = seededRandom(match.id * 7919 + 42);
    const hp = POWER[match.home] || 70;
    const ap = POWER[match.away] || 70;
    const diff = hp - ap;

    // Skew votes toward favorites (fans tend to pick favorites more than odds suggest)
    let homePct = 0.45 + diff * 0.015;
    let drawPct = 0.20 - Math.abs(diff) * 0.004;
    let awayPct = 1 - homePct - drawPct;

    homePct = Math.max(0.10, Math.min(0.80, homePct));
    drawPct = Math.max(0.08, Math.min(0.25, drawPct));
    awayPct = Math.max(0.10, Math.min(0.80, awayPct));
    const total = homePct + drawPct + awayPct;
    homePct /= total;
    drawPct /= total;
    awayPct /= total;

    // Random total between 50-150
    const totalVotes = Math.floor(rng() * 100) + 50;
    const homeVotes = Math.round(totalVotes * homePct);
    const drawVotes = Math.round(totalVotes * drawPct);
    const awayVotes = totalVotes - homeVotes - drawVotes;

    store[`match_${match.id}`] = {
      totals: {
        home: Math.max(1, homeVotes),
        draw: Math.max(1, drawVotes),
        away: Math.max(1, awayVotes),
      },
      voters: {},
    };
  }

  return store;
}

function readVotes(): VotesStore {
  try {
    if (existsSync(VOTES_PATH)) {
      const raw = readFileSync(VOTES_PATH, "utf-8");
      return JSON.parse(raw);
    }
  } catch {
    // File corrupted or missing, regenerate
  }
  const seeded = generateSeedVotes();
  writeVotes(seeded);
  return seeded;
}

function writeVotes(store: VotesStore): void {
  try {
    const dir = join(process.cwd(), "src", "data");
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    writeFileSync(VOTES_PATH, JSON.stringify(store, null, 2));
  } catch (err) {
    console.error("Failed to write votes:", err);
  }
}

function getPercentages(totals: { home: number; draw: number; away: number }) {
  const total = totals.home + totals.draw + totals.away;
  if (total === 0) return { home: 33.3, draw: 33.3, away: 33.4 };
  return {
    home: Math.round((totals.home / total) * 1000) / 10,
    draw: Math.round((totals.draw / total) * 1000) / 10,
    away: Math.round((totals.away / total) * 1000) / 10,
  };
}

// Get visitor IP from request headers (works on Vercel)
function getVisitorIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

// Combine IP + fingerprint for robust identification
function getVoterId(request: NextRequest, clientFingerprint?: string): string {
  const ip = getVisitorIP(request);
  if (clientFingerprint) {
    return `${ip}_${clientFingerprint}`;
  }
  return `ip_${ip}`;
}

// Check if this voter already voted (check both IP-only and IP+fingerprint)
function findExistingVote(voters: Record<string, "home" | "draw" | "away">, ip: string, fingerprint?: string): { voterId: string; vote: "home" | "draw" | "away" } | null {
  // Check exact match (IP + fingerprint)
  if (fingerprint) {
    const exactId = `${ip}_${fingerprint}`;
    if (voters[exactId]) return { voterId: exactId, vote: voters[exactId] };
  }
  
  // Check IP-only match (catches same person with different browser/fingerprint)
  const ipId = `ip_${ip}`;
  if (voters[ipId]) return { voterId: ipId, vote: voters[ipId] };
  
  // Check any voter ID that starts with this IP
  for (const [vid, v] of Object.entries(voters)) {
    if (vid.startsWith(ip + "_") || vid === `ip_${ip}`) {
      return { voterId: vid, vote: v };
    }
  }
  
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get("matchId");
  const visitorId = searchParams.get("visitorId");

  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  const ip = getVisitorIP(request);
  const store = readVotes();
  const key = `match_${matchId}`;
  const matchVotes = store[key] || { totals: { home: 0, draw: 0, away: 0 }, voters: {} };
  const total = matchVotes.totals.home + matchVotes.totals.draw + matchVotes.totals.away;

  // Check if this IP already voted (regardless of fingerprint)
  const existing = findExistingVote(matchVotes.voters, ip, visitorId || undefined);

  return NextResponse.json({
    totals: matchVotes.totals,
    total,
    percentages: getPercentages(matchVotes.totals),
    userVote: existing?.vote || (visitorId ? matchVotes.voters[visitorId] || null : null),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchId, vote, visitorId } = body;

    if (!matchId || !vote) {
      return NextResponse.json({ error: "matchId and vote required" }, { status: 400 });
    }

    if (!["home", "draw", "away"].includes(vote)) {
      return NextResponse.json({ error: "vote must be home, draw, or away" }, { status: 400 });
    }

    // Check if voting is locked (match has started)
    // For WC matches (numeric IDs 1-72), check schedule
    const numericId = Number(matchId);
    if (!isNaN(numericId) && numericId >= 1 && numericId <= 72) {
      const { allMatches } = await import("@/data/matches");
      const match = allMatches.find(m => m.id === numericId);
      if (match) {
        // Parse match date - WC matches have dates like "June 11" with times like "3:00 PM ET"
        const wcDate = new Date("2026-06-11T19:00:00Z"); // Default to tournament start
        if (new Date() > wcDate) {
          // During tournament, check if this specific match has started
          // For now, lock all votes 1 hour before the general kickoff window
        }
      }
    }
    
    // For league matches (league_XXXXX), check fixture date from the key
    if (String(matchId).startsWith("league_")) {
      // League match voting locks are handled client-side for now
      // Server-side lock will be added when we have fixture times stored
    }

    const ip = getVisitorIP(request);
    const voterId = getVoterId(request, visitorId);
    const store = readVotes();
    const key = `match_${matchId}`;

    if (!store[key]) {
      store[key] = { totals: { home: 0, draw: 0, away: 0 }, voters: {} };
    }

    const matchVotes = store[key];
    
    // Check if this IP already voted under any voter ID
    const existing = findExistingVote(matchVotes.voters, ip, visitorId);
    
    if (existing) {
      // Change existing vote
      matchVotes.totals[existing.vote]--;
      // Remove old voter entry
      delete matchVotes.voters[existing.voterId];
    }

    matchVotes.totals[vote as "home" | "draw" | "away"]++;
    matchVotes.voters[voterId] = vote;

    writeVotes(store);

    const total = matchVotes.totals.home + matchVotes.totals.draw + matchVotes.totals.away;

    return NextResponse.json({
      success: true,
      totals: matchVotes.totals,
      total,
      percentages: getPercentages(matchVotes.totals),
      userVote: vote,
    });
  } catch (err) {
    console.error("Vote error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
