import { NextResponse } from 'next/server';
import { getLiveMatches, getTodayMatches } from '@/lib/livescore-api';

export const dynamic = 'force-dynamic';
export const revalidate = 5; // Cache for 10 seconds

export async function GET() {
  try {
    // Fetch both live matches and today's full schedule
    const [liveMatches, todayMatches] = await Promise.all([
      getLiveMatches(),
      getTodayMatches()
    ]);

    // Combine and deduplicate (live matches are also in today's matches)
    const matchMap = new Map();
    
    // Add today's matches first
    todayMatches.forEach(match => {
      matchMap.set(match.fixtureId, match);
    });
    
    // Override with live match data (in case of more recent data)
    liveMatches.forEach(match => {
      matchMap.set(match.fixtureId, { ...match, isLive: true });
    });

    const allMatches = Array.from(matchMap.values());
    
    // Sort by: live matches first, then by kick-off time
    allMatches.sort((a, b) => {
      // Live matches first
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      
      // Then by date/time
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    const response = {
      matches: allMatches,
      liveCount: liveMatches.length,
      totalCount: allMatches.length,
      lastUpdated: new Date().toISOString()
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=300',
      },
    });
    
  } catch (error) {
    console.error('Live scores API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch live scores',
        matches: [],
        liveCount: 0,
        totalCount: 0,
        lastUpdated: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}