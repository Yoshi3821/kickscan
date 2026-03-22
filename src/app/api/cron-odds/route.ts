// Cron job for automatic odds management
import { NextRequest, NextResponse } from 'next/server';
import { bulkRefreshOdds, lockOddsIfNeeded } from '@/lib/odds-manager';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const authHeader = request.headers.get('authorization');
  
  // Simple auth check - you can use a cron secret
  const cronSecret = process.env.CRON_SECRET || 'your-cron-secret';
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const action = searchParams.get('action') || 'refresh';
    
    switch (action) {
      case 'refresh':
        return await handleOddsRefresh();
      
      case 'lock':
        return await handleOddsLocking();
        
      case 'both':
        const refreshResult = await handleOddsRefresh();
        const lockResult = await handleOddsLocking();
        
        return NextResponse.json({
          success: true,
          refresh: refreshResult,
          lock: lockResult
        });
        
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Cron odds error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleOddsRefresh() {
  try {
    // Get all matches that might need odds refresh
    const { data: matches } = await supabaseAdmin
      .from('match_odds_cache')
      .select('fixture_id, kickoff_time, is_locked, last_updated')
      .eq('is_locked', false)
      .gte('kickoff_time', new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()) // Not older than 3 hours
      .order('kickoff_time', { ascending: true });

    if (!matches || matches.length === 0) {
      return {
        success: true,
        message: 'No matches need odds refresh',
        updated: 0
      };
    }

    const fixtureIds = matches.map(m => m.fixture_id);
    const { updated, errors } = await bulkRefreshOdds(fixtureIds);

    return NextResponse.json({
      success: true,
      message: `Refreshed odds for ${updated} out of ${matches.length} matches`,
      updated,
      total: matches.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Odds refresh error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to refresh odds'
    });
  }
}

async function handleOddsLocking() {
  try {
    // Get matches that might need locking (within 10 minutes of kickoff)
    const { data: matches } = await supabaseAdmin
      .from('match_odds_cache')
      .select('fixture_id, match_id, kickoff_time, is_locked')
      .eq('is_locked', false)
      .gte('kickoff_time', new Date().toISOString())
      .lte('kickoff_time', new Date(Date.now() + 10 * 60 * 1000).toISOString()); // Next 10 minutes

    if (!matches || matches.length === 0) {
      return {
        success: true,
        message: 'No matches need odds locking',
        locked: 0
      };
    }

    let locked = 0;
    const errors = [];

    for (const match of matches) {
      try {
        const wasLocked = await lockOddsIfNeeded(match.fixture_id);
        if (wasLocked) {
          locked++;
          console.log(`Locked odds for match ${match.match_id} (fixture ${match.fixture_id})`);
        }
      } catch (error) {
        errors.push(`Error locking match ${match.match_id}: ${error}`);
      }
    }

    return {
      success: true,
      message: `Locked odds for ${locked} out of ${matches.length} matches`,
      locked,
      total: matches.length,
      errors: errors.length > 0 ? errors : undefined
    };

  } catch (error) {
    console.error('Odds locking error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to lock odds'
    });
  }
}

// Manual trigger endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, fixtureIds } = body;

    switch (action) {
      case 'refresh-specific':
        if (!Array.isArray(fixtureIds)) {
          return NextResponse.json({ error: 'fixtureIds array required' }, { status: 400 });
        }
        
        const { updated, errors } = await bulkRefreshOdds(fixtureIds);
        
        return NextResponse.json({
          success: true,
          updated,
          total: fixtureIds.length,
          errors
        });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    console.error('Manual cron trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}