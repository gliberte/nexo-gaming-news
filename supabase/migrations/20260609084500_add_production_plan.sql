-- Migration to add production_plan JSONB column to published_news table
ALTER TABLE published_news 
ADD COLUMN IF NOT EXISTS production_plan JSONB;
