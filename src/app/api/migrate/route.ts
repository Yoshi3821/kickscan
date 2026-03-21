import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

/**
 * GET /api/migrate — one-time migration to add market_favorite column
 * Safe to call multiple times — checks if column exists first.
 * Delete this endpoint after migration is confirmed.
 */
export async function GET() {
  try {
    // Try to add the column — if it already exists, Postgres will error (which we catch)
    const { error } = await supabaseAdmin.rpc('exec_sql', {
      query: "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS market_favorite TEXT;"
    });

    // If rpc doesn't exist, try raw query via insert trick
    if (error) {
      // Alternative: just try inserting with the field — if column doesn't exist, 
      // the predict API fallback handles it. But let's try a direct approach.
      
      // Test if column exists by querying it
      const { error: testError } = await supabaseAdmin
        .from('predictions')
        .select('market_favorite')
        .limit(1);
      
      if (testError && testError.message?.includes('market_favorite')) {
        // Column doesn't exist — we need manual migration
        return NextResponse.json({
          status: "manual_migration_needed",
          message: "Please run this SQL in Supabase Dashboard → SQL Editor:",
          sql: "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS market_favorite TEXT;",
          error: testError.message
        });
      }
      
      // Column exists or query succeeded
      return NextResponse.json({
        status: "ok",
        message: "market_favorite column already exists or was just created"
      });
    }

    return NextResponse.json({
      status: "migrated",
      message: "market_favorite column added successfully"
    });

  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      message: err.message || "Unknown error",
      sql: "ALTER TABLE predictions ADD COLUMN IF NOT EXISTS market_favorite TEXT;"
    });
  }
}
