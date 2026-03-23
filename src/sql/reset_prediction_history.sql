-- RESET ALL USER PREDICTION HISTORY
-- This archives existing predictions and resets user stats for clean restart

-- 1. Create archive table for existing predictions (if not exists)
CREATE TABLE IF NOT EXISTS predictions_archive_old_system (
    id uuid,
    user_id uuid,
    match_id text,
    predicted_result text,
    predicted_score text,
    boosted boolean,
    created_at timestamptz,
    settled boolean,
    actual_result text,
    actual_score text,
    points_earned integer,
    archived_at timestamptz DEFAULT now(),
    archive_reason text DEFAULT 'System reset - new scoring system'
);

-- 2. Archive all existing predictions
INSERT INTO predictions_archive_old_system (
    id, user_id, match_id, predicted_result, predicted_score, 
    boosted, created_at, settled, actual_result, actual_score, points_earned
)
SELECT 
    id, user_id, match_id, predicted_result, predicted_score,
    boosted, created_at, settled, actual_result, actual_score, points_earned
FROM predictions;

-- 3. Delete all predictions from live table
DELETE FROM predictions;

-- 4. Reset all user prediction stats to zero
UPDATE users SET
    total_predictions = 0,
    correct_results = 0,
    correct_scores = 0,
    current_streak = 0,
    best_streak = 0,
    boosters_used_today = 0,
    last_booster_date = null
WHERE total_predictions > 0 OR correct_results > 0 OR correct_scores > 0;

-- 5. Verification queries (run after the above)
-- SELECT COUNT(*) as "Archived predictions" FROM predictions_archive_old_system;
-- SELECT COUNT(*) as "Live predictions (should be 0)" FROM predictions;
-- SELECT COUNT(*) as "Users with reset stats" FROM users WHERE total_predictions = 0 AND correct_results = 0;
-- SELECT username, total_predictions, correct_results FROM users WHERE total_predictions > 0 OR correct_results > 0;