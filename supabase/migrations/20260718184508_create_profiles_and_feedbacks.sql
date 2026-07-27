/*
# Create profiles and feedbacks tables

1. New Tables
- `profiles`
  - `id` (uuid, primary key, references auth.users) — one row per user
  - `email` (text) — user email cached for display
  - `trial_started_at` (timestamptz) — when the 10-day trial began
  - `plan` (text, default 'trial') — one of: trial, monthly, yearly, expired
  - `purchase_token` (text, nullable) — Google Play purchase token after verified purchase
  - `expires_at` (timestamptz, nullable) — subscription expiry date
  - `created_at` (timestamptz, default now())
- `feedbacks`
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users) — owner
  - `email` (text) — user email at time of feedback
  - `message` (text) — feedback body
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on both tables.
- profiles: owner-scoped CRUD (authenticated users manage only their own row).
- feedbacks: authenticated users can insert their own; read/update/delete their own.
- Note: profiles.id doubles as the foreign key to auth.users, so SELECT policy uses auth.uid() = id.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  trial_started_at timestamptz NOT NULL DEFAULT now(),
  plan text NOT NULL DEFAULT 'trial',
  purchase_token text,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS feedbacks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL DEFAULT '',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_feedbacks" ON feedbacks;
CREATE POLICY "select_own_feedbacks" ON feedbacks FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_feedbacks" ON feedbacks;
CREATE POLICY "insert_own_feedbacks" ON feedbacks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_feedbacks" ON feedbacks;
CREATE POLICY "update_own_feedbacks" ON feedbacks FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_feedbacks" ON feedbacks;
CREATE POLICY "delete_own_feedbacks" ON feedbacks FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
