-- Migration to add fields for the Next.js web application
ALTER TABLE published_news 
ADD COLUMN IF NOT EXISTS web_article TEXT,
ADD COLUMN IF NOT EXISTS youtube_url TEXT;
