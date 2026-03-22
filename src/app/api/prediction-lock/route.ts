// API route for prediction lock management
import { NextRequest, NextResponse } from 'next/server';
import { checkPredictionLock } from '@/lib/odds-manager';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchId = searchParams.get('matchId');

  try {
    if (!matchId) {
      return NextResponse.json(
        { error: 'matchId required' },
        { status: 400 }
      );
    }

    const lockStatus = await checkPredictionLock(matchId);

    return NextResponse.json({
      success: true,
      isLocked: lockStatus.isLocked,
      lockTime: lockStatus.lockTime?.toISOString(),
      timeRemaining: lockStatus.timeRemaining || 0,
      timeRemainingMinutes: lockStatus.timeRemaining ? Math.ceil(lockStatus.timeRemaining / (1000 * 60)) : 0
    });

  } catch (error) {
    console.error('Prediction lock check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// For bulk lock status checks
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matchIds } = body;

    if (!Array.isArray(matchIds)) {
      return NextResponse.json(
        { error: 'matchIds array required' },
        { status: 400 }
      );
    }

    const lockStatuses: Record<string, {
      isLocked: boolean;
      lockTime?: string;
      timeRemaining: number;
      timeRemainingMinutes: number;
    }> = {};

    for (const matchId of matchIds) {
      try {
        const lockStatus = await checkPredictionLock(matchId);
        lockStatuses[matchId] = {
          isLocked: lockStatus.isLocked,
          lockTime: lockStatus.lockTime?.toISOString(),
          timeRemaining: lockStatus.timeRemaining || 0,
          timeRemainingMinutes: lockStatus.timeRemaining ? Math.ceil(lockStatus.timeRemaining / (1000 * 60)) : 0
        };
      } catch (error) {
        console.error(`Error checking lock for match ${matchId}:`, error);
        lockStatuses[matchId] = {
          isLocked: false,
          timeRemaining: 0,
          timeRemainingMinutes: 0
        };
      }
    }

    return NextResponse.json({
      success: true,
      lockStatuses
    });

  } catch (error) {
    console.error('Bulk prediction lock check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}