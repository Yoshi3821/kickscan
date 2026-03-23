-- Fix duplicate predictions

-- 1. Remove duplicates (keep the latest one per user+match)
DELETE FROM predictions
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, match_id) id
  FROM predictions
  ORDER BY user_id, match_id, created_at DESC
);

-- 2. Add unique constraint to prevent future duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_predictions_user_match_unique 
ON predictions(user_id, match_id);
