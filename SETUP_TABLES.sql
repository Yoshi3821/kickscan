-- KickScan Private Groups Tables
-- Run this in Supabase SQL Editor

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_by UUID REFERENCES users(id),
  competition TEXT NOT NULL DEFAULT 'wc2026',
  max_members INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create group_members table  
CREATE TABLE IF NOT EXISTS group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Grant permissions
GRANT ALL ON groups TO anon, authenticated, service_role;
GRANT ALL ON group_members TO anon, authenticated, service_role;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_groups_code ON groups(code);
CREATE INDEX IF NOT EXISTS idx_groups_competition ON groups(competition);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);