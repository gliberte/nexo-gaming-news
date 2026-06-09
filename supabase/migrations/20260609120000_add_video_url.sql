-- Migration to add video_url field to published_news
ALTER TABLE published_news 
ADD COLUMN IF NOT EXISTS video_url TEXT;
