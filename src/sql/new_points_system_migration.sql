-- NEW POINTS SYSTEM MIGRATION
-- Run this to implement the odds-based scoring system

-- 1. Create proper archive table first
CREATE TABLE IF NOT EXISTS predictions_archive (
  id SERIAL PRIMARY KEY,
  original_id INTEGER,
  user_id TEXT,
  match_id TEXT,
  predicted_result TEXT,
  predicted_score TEXT,
  boosted BOOLEAN,
  created_at TIMESTAMP,
  settled BOOLEAN,
  actual_result TEXT,
  actual_score TEXT,
  points_earned INTEGER,
  home_team TEXT,
  away_team TEXT,
  market_favorite TEXT,
  archived_at TIMESTAMP DEFAULT NOW(),
  archive_reason TEXT DEFAULT 'scoring_system_change'
);

-- 2. Archive existing predictions
INSERT INTO predictions_archive (
  original_id, user_id, match_id, predicted_result, predicted_score,
  boosted, created_at, settled, actual_result, actual_score, points_earned,
  home_team, away_team, market_favorite
)
SELECT 
  id, user_id, match_id, predicted_result, predicted_score,
  boosted, created_at, settled, actual_result, actual_score, points_earned,
  home_team, away_team, market_favorite
FROM predictions;

-- 3. Add new columns to predictions table
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS locked_home_odds DECIMAL(5,2);
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS locked_draw_odds DECIMAL(5,2);
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS locked_away_odds DECIMAL(5,2);
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS lock_timestamp TIMESTAMP;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS correct_score_entered BOOLEAN DEFAULT false;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS booster_used BOOLEAN DEFAULT false;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS locked_points_band TEXT;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS final_1x2_points INTEGER DEFAULT 0;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS final_cs_points INTEGER DEFAULT 0;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS final_total_points INTEGER DEFAULT 0;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS scored_at TIMESTAMP;

-- 4. Update booster system to 1 per day
ALTER TABLE users ALTER COLUMN boosters_used_today SET DEFAULT 0;

-- 5. Create match odds cache table
CREATE TABLE IF NOT EXISTS match_odds_cache (
  fixture_id INTEGER PRIMARY KEY,
  match_id TEXT,
  home_team TEXT,
  away_team TEXT,
  kickoff_time TIMESTAMP,
  average_home_odds DECIMAL(5,2),
  average_draw_odds DECIMAL(5,2),
  average_away_odds DECIMAL(5,2),
  bookmaker_count INTEGER DEFAULT 0,
  locked_at TIMESTAMP,
  is_locked BOOLEAN DEFAULT false,
  last_updated TIMESTAMP DEFAULT NOW(),
  source TEXT DEFAULT 'api'
);

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_predictions_lock_timestamp ON predictions(lock_timestamp);
CREATE INDEX IF NOT EXISTS idx_predictions_scored_at ON predictions(scored_at);
CREATE INDEX IF NOT EXISTS idx_match_odds_cache_match_id ON match_odds_cache(match_id);
CREATE INDEX IF NOT EXISTS idx_match_odds_cache_kickoff_time ON match_odds_cache(kickoff_time);
CREATE INDEX IF NOT EXISTS idx_match_odds_cache_locked ON match_odds_cache(is_locked);

-- 7. Clear existing predictions for fresh start
TRUNCATE predictions;

-- 8. Reset all user points to 20
UPDATE users SET 
  total_points = 20,
  boosters_used_today = 0,
  correct_results = 0,
  correct_scores = 0,
  current_streak = 0,
  best_streak = 0,
  total_predictions = 0;

-- 9. Create points calculation function
CREATE OR REPLACE FUNCTION calculate_1x2_points(odds DECIMAL)
RETURNS INTEGER AS $$
BEGIN
  CASE 
    WHEN odds >= 1.01 AND odds <= 1.29 THEN RETURN 1;
    WHEN odds >= 1.30 AND odds <= 1.49 THEN RETURN 2;
    WHEN odds >= 1.50 AND odds <= 1.74 THEN RETURN 3;
    WHEN odds >= 1.75 AND odds <= 1.99 THEN RETURN 4;
    WHEN odds >= 2.00 AND odds <= 2.29 THEN RETURN 5;
    WHEN odds >= 2.30 AND odds <= 2.69 THEN RETURN 6;
    WHEN odds >= 2.70 AND odds <= 3.19 THEN RETURN 7;
    WHEN odds >= 3.20 AND odds <= 3.79 THEN RETURN 8;
    WHEN odds >= 3.80 AND odds <= 4.49 THEN RETURN 9;
    WHEN odds >= 4.50 AND odds <= 5.49 THEN RETURN 10;
    WHEN odds >= 5.50 THEN RETURN 11;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 10. Create CS bonus calculation function
CREATE OR REPLACE FUNCTION calculate_cs_bonus(total_goals INTEGER)
RETURNS INTEGER AS $$
BEGIN
  CASE 
    WHEN total_goals = 0 THEN RETURN 4;
    WHEN total_goals >= 1 AND total_goals <= 3 THEN RETURN 3;
    WHEN total_goals >= 4 AND total_goals <= 6 THEN RETURN 5;
    WHEN total_goals >= 7 THEN RETURN 7;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- 11. Create function to get points band description
CREATE OR REPLACE FUNCTION get_points_band_description(odds DECIMAL)
RETURNS TEXT AS $$
BEGIN
  CASE 
    WHEN odds >= 1.01 AND odds <= 1.29 THEN RETURN '1.01-1.29 = 1pt';
    WHEN odds >= 1.30 AND odds <= 1.49 THEN RETURN '1.30-1.49 = 2pts';
    WHEN odds >= 1.50 AND odds <= 1.74 THEN RETURN '1.50-1.74 = 3pts';
    WHEN odds >= 1.75 AND odds <= 1.99 THEN RETURN '1.75-1.99 = 4pts';
    WHEN odds >= 2.00 AND odds <= 2.29 THEN RETURN '2.00-2.29 = 5pts';
    WHEN odds >= 2.30 AND odds <= 2.69 THEN RETURN '2.30-2.69 = 6pts';
    WHEN odds >= 2.70 AND odds <= 3.19 THEN RETURN '2.70-3.19 = 7pts';
    WHEN odds >= 3.20 AND odds <= 3.79 THEN RETURN '3.20-3.79 = 8pts';
    WHEN odds >= 3.80 AND odds <= 4.49 THEN RETURN '3.80-4.49 = 9pts';
    WHEN odds >= 4.50 AND odds <= 5.49 THEN RETURN '4.50-5.49 = 10pts';
    WHEN odds >= 5.50 THEN RETURN '5.50+ = 11pts';
    ELSE RETURN 'Invalid odds';
  END CASE;
END;
$$ LANGUAGE plpgsql;