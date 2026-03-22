import { NextRequest, NextResponse } from 'next/server';
import { acquireLock, releaseLock, runSettlement } from '@/lib/settle-engine';

/**
 * Cron-triggered settlement endpoint.
 * Schedule: every 5 minutes via Vercel Cron
 * 
 * Security: Vercel automatically sends CRON_SECRET header for cron jobs.
 * We verify it to block external callers.
 * 
 * Lock: Uses cron_locks table to prevent concurrent runs.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const runId = crypto.randomUUID();

  // Verify cron secret (Vercel sends this automatically for cron jobs)
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${cronSecret}`) {
      console.warn(`[cron-settle] Unauthorized attempt at ${new Date().toISOString()}`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  console.log(`[cron-settle] Run ${runId} started at ${new Date().toISOString()}`);

  // Try to acquire lock
  const locked = await acquireLock(runId);
  if (!locked) {
    console.log(`[cron-settle] Run ${runId} skipped — another run is active`);
    return NextResponse.json({
      status: 'skipped',
      reason: 'another settlement run is active',
      runId,
    });
  }

  try {
    const result = await runSettlement();
    const duration = Date.now() - startTime;

    console.log(
      `[cron-settle] Run ${runId} complete: settled=${result.settled}, checked=${result.checked}, fixtures=${result.finishedFixtures}, errors=${result.errors.length}, duration=${duration}ms`
    );

    if (result.errors.length > 0) {
      console.error(`[cron-settle] Run ${runId} errors:`, result.errors);
    }

    return NextResponse.json({
      status: 'ok',
      runId,
      ...result,
      durationMs: duration,
    });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    console.error(`[cron-settle] Run ${runId} FAILED after ${duration}ms:`, error.message);

    return NextResponse.json(
      {
        status: 'error',
        runId,
        error: error.message,
        durationMs: duration,
      },
      { status: 500 }
    );
  } finally {
    await releaseLock(runId);
  }
}
