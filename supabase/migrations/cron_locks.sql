-- Settlement cron lock table + RPC
-- Run this in Supabase SQL Editor before deploying

-- 1. Create lock table
CREATE TABLE IF NOT EXISTS cron_locks (
  id TEXT PRIMARY KEY,
  locked_at TIMESTAMPTZ,
  locked_by TEXT
);

-- 2. Insert the settlement lock row
INSERT INTO cron_locks (id, locked_at, locked_by)
VALUES ('settlement', NULL, NULL)
ON CONFLICT (id) DO NOTHING;

-- 3. Atomic lock acquisition function
CREATE OR REPLACE FUNCTION acquire_settle_lock(p_run_id TEXT, p_expire_minutes INT DEFAULT 4)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
  rows_updated INT;
BEGIN
  UPDATE cron_locks
  SET locked_at = NOW(), locked_by = p_run_id
  WHERE id = 'settlement'
    AND (locked_at IS NULL OR locked_at < NOW() - (p_expire_minutes || ' minutes')::INTERVAL);

  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
