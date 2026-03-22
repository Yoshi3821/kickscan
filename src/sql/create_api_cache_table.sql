-- Create API cache table for cost-aware caching
CREATE TABLE IF NOT EXISTS api_cache (
  id TEXT PRIMARY KEY,
  data_type TEXT NOT NULL CHECK (data_type IN ('odds', 'live_scores', 'fixtures')),
  fixture_id INTEGER,
  data JSONB NOT NULL,
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_api_cache_data_type ON api_cache(data_type);
CREATE INDEX IF NOT EXISTS idx_api_cache_fixture_id ON api_cache(fixture_id);
CREATE INDEX IF NOT EXISTS idx_api_cache_expires_at ON api_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_cache_match_date ON api_cache(match_date);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_api_cache_updated_at ON api_cache;
CREATE TRIGGER update_api_cache_updated_at
  BEFORE UPDATE ON api_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add quota tracking table
CREATE TABLE IF NOT EXISTS api_quota_log (
  id SERIAL PRIMARY KEY,
  endpoint TEXT NOT NULL,
  fixture_id INTEGER,
  response_size INTEGER,
  status_code INTEGER,
  error_message TEXT,
  called_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_quota_log_called_at ON api_quota_log(called_at);
CREATE INDEX IF NOT EXISTS idx_api_quota_log_endpoint ON api_quota_log(endpoint);