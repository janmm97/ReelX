-- user_connections: stores One Auth connection keys per user per platform
CREATE TABLE IF NOT EXISTS user_connections (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform       TEXT NOT NULL,
  connection_key TEXT UNIQUE NOT NULL,
  created_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_user_connections_user_id ON user_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_connections_platform ON user_connections(platform);

-- video_jobs: tracks multi-chunk InfiniteTalk jobs
CREATE TABLE IF NOT EXISTS video_jobs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status            TEXT NOT NULL DEFAULT 'pending',
  total_chunks      INTEGER NOT NULL,
  completed_chunks  INTEGER NOT NULL DEFAULT 0,
  chunk_task_ids    TEXT[] NOT NULL,
  chunk_video_urls  TEXT[],
  final_video_url   TEXT,
  prompt            TEXT,
  created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Storage bucket for all video assets (audio chunks, segments, finals)
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-assets', 'video-assets', false)
ON CONFLICT (id) DO NOTHING;
