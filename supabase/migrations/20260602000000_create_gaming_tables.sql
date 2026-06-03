CREATE TABLE published_news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    platform TEXT,
    x_published BOOLEAN DEFAULT FALSE,
    ig_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_published_news_source_url ON published_news(source_url);
