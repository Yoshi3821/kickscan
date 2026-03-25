-- Add fixture_date column to predictions table
-- Used for booster enforcement: 1 booster per fixture date per user
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS fixture_date text;

-- Index for fast booster lookup: "does this user have a boosted prediction on this date?"
CREATE INDEX IF NOT EXISTS idx_predictions_booster_date 
  ON predictions (user_id, fixture_date, boosted) 
  WHERE boosted = true;

-- Backfill existing predictions with fixture dates derived from match_id
-- WC matches: derive from match data (handled by app code on next save)
-- League matches: derive from created_at date as best guess
UPDATE predictions 
SET fixture_date = created_at::date::text 
WHERE fixture_date IS NULL;
