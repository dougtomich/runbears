-- RunBears.com — Supabase Table Setup
-- Paste this entire file into: Supabase Dashboard → SQL Editor → New Query → Run

CREATE TABLE IF NOT EXISTS sightings (
  id                bigint generated always as identity primary key,
  created_at        timestamptz default now(),
  species           text        not null,
  state             text        not null,
  location          text        not null,
  sighting_datetime text,
  distance          text,
  behavior          text,
  notes             text
);

-- Allow anyone to read sightings (public feed)
ALTER TABLE sightings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read"
  ON sightings FOR SELECT
  USING (true);

-- Allow anyone to submit a sighting (public form)
CREATE POLICY "public insert"
  ON sightings FOR INSERT
  WITH CHECK (true);
