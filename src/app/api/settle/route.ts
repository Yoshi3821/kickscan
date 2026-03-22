import { NextRequest, NextResponse } from 'next/server';
import { runSettlement } from '@/lib/settle-engine';

/**
 * Manual settlement endpoint — kept as backup/helper.
 * GET /api/settle — runs settlement without lock (manual trigger is fine to overlap)
 */
export async function GET(request: NextRequest) {
  try {
    const result = await runSettlement();

    return NextResponse.json({
      settled: result.settled,
      checked: result.checked,
      finishedFixtures: result.finishedFixtures,
    });
  } catch (error: any) {
    console.error('Settlement error:', error);
    return NextResponse.json({ error: 'Settlement failed' }, { status: 500 });
  }
}
