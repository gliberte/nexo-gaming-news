ALTER TABLE public.published_news ADD COLUMN IF NOT EXISTS tweet text;
ALTER TABLE public.published_news ADD COLUMN IF NOT EXISTS instagram_caption text;
