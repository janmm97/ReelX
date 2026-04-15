-- Add kind column to images table to distinguish blend results from text-to-image
ALTER TABLE images
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'image'
    CHECK (kind IN ('image', 'blend'));

-- Existing rows automatically receive kind = 'image' via the DEFAULT
-- No RLS changes needed — existing policies cover all kinds equally
