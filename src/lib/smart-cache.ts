// Smart caching for API-Football with tiered refresh rates
import { supabaseAdmin } from './supabase';

interface CacheEntry {
  id: string;
  data_type: 'odds' | 'live_scores' | 'fixtures';
  fixture_id: number | null;
  data: any;
  last_updated: string;
  expires_at: string;
  match_date: string | null;
}

interface RefreshConfig {
  intervalMinutes: number;
  description: string;
}

// Tiered refresh strategy based on match proximity
export function getRefreshConfig(matchDate: Date): RefreshConfig {
  const now = new Date();
  const hoursUntilMatch = (matchDate.getTime() - now.getTime()) / (1000 * 60 * 60);

  if (hoursUntilMatch > 7 * 24) {
    return { intervalMinutes: 24 * 60, description: '>7 days: daily' };
  } else if (hoursUntilMatch > 48) {
    return { intervalMinutes: 6 * 60, description: '2-7 days: 6h' };
  } else if (hoursUntilMatch > 6) {
    return { intervalMinutes: 2 * 60, description: '6-48h: 2h' };
  } else if (hoursUntilMatch > 0) {
    return { intervalMinutes: 45, description: 'last 6h: 45min' };
  } else {
    return { intervalMinutes: 30, description: 'post-match: 30min' };
  }
}

// Get cached data or determine if refresh is needed
export async function getCacheEntry(
  dataType: 'odds' | 'live_scores' | 'fixtures',
  fixtureId?: number
): Promise<{ data: any; needsRefresh: boolean; config: RefreshConfig }> {
  try {
    const cacheKey = fixtureId ? `${dataType}_${fixtureId}` : dataType;
    
    const { data: entry } = await supabaseAdmin
      .from('api_cache')
      .select('*')
      .eq('id', cacheKey)
      .single();

    const now = new Date();

    if (!entry) {
      return {
        data: null,
        needsRefresh: true,
        config: { intervalMinutes: 60, description: 'no cache' }
      };
    }

    const expiresAt = new Date(entry.expires_at);
    const matchDate = entry.match_date ? new Date(entry.match_date) : new Date();
    const config = getRefreshConfig(matchDate);

    return {
      data: entry.data,
      needsRefresh: now > expiresAt,
      config
    };
  } catch (error) {
    console.error('Cache lookup error:', error);
    return {
      data: null,
      needsRefresh: true,
      config: { intervalMinutes: 60, description: 'cache error' }
    };
  }
}

// Store data in cache with smart expiration
export async function setCacheEntry(
  dataType: 'odds' | 'live_scores' | 'fixtures',
  data: any,
  fixtureId?: number,
  matchDate?: Date
): Promise<void> {
  try {
    const cacheKey = fixtureId ? `${dataType}_${fixtureId}` : dataType;
    const now = new Date();
    const config = matchDate ? getRefreshConfig(matchDate) : { intervalMinutes: 60, description: 'default' };
    const expiresAt = new Date(now.getTime() + config.intervalMinutes * 60 * 1000);

    const entry: Partial<CacheEntry> = {
      id: cacheKey,
      data_type: dataType,
      fixture_id: fixtureId || null,
      data,
      last_updated: now.toISOString(),
      expires_at: expiresAt.toISOString(),
      match_date: matchDate?.toISOString() || null
    };

    await supabaseAdmin
      .from('api_cache')
      .upsert(entry);

  } catch (error) {
    console.error('Cache store error:', error);
  }
}

// Clean up expired cache entries (run via cron)
export async function cleanupCache(): Promise<number> {
  try {
    const { data, error } = await supabaseAdmin
      .from('api_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id');

    if (error) throw error;
    
    return data?.length || 0;
  } catch (error) {
    console.error('Cache cleanup error:', error);
    return 0;
  }
}

// Get quota usage from recent API calls
export async function getQuotaUsage(hours: number = 24): Promise<{
  totalCalls: number;
  oddsCalls: number;
  liveScoresCalls: number;
  fixturesCalls: number;
}> {
  try {
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    const { data } = await supabaseAdmin
      .from('api_cache')
      .select('data_type')
      .gte('last_updated', since.toISOString());

    const usage = {
      totalCalls: data?.length || 0,
      oddsCalls: data?.filter(d => d.data_type === 'odds').length || 0,
      liveScoresCalls: data?.filter(d => d.data_type === 'live_scores').length || 0,
      fixturesCalls: data?.filter(d => d.data_type === 'fixtures').length || 0
    };

    return usage;
  } catch (error) {
    console.error('Quota usage error:', error);
    return { totalCalls: 0, oddsCalls: 0, liveScoresCalls: 0, fixturesCalls: 0 };
  }
}