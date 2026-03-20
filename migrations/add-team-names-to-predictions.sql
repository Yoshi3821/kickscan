-- Migration: Add home_team and away_team columns to predictions table
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- Safe to run multiple times (IF NOT EXISTS)

ALTER TABLE predictions ADD COLUMN IF NOT EXISTS home_team text;
ALTER TABLE predictions ADD COLUMN IF NOT EXISTS away_team text;

-- Verify
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'predictions' 
AND column_name IN ('home_team', 'away_team');
