CREATE TYPE content_status AS ENUM ('pending', 'draft_ready', 'published', 'rejected');

CREATE TABLE content_pipeline (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    draft_content TEXT,
    status content_status DEFAULT 'pending' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_content_pipeline_source_url ON content_pipeline(source_url);
