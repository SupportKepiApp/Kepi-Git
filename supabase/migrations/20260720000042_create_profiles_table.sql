/*
# Create profiles table for user trial/subscription tracking

1. Purpose
   - Stores each user's subscription plan (trial/monthly/yearly), trial start date,
     and subscription expiry date. The frontend reads this to determine access status
     (trial / active / expired) and to gate the paywall.

2. New Tables
   - `profiles`
     - `id` (uuid, primary key, references auth.users) — one row per authenticated user
     - `email` (text, nullable) — cached email for display
     - `plan` (text, not null, default 'trial') — current subscription plan
     - `trial_started_at` (timestamptz, default now()) — when the 20-day trial began
     - `expires_at` (timestamptz, nullable) — when a paid subscription expires
     - `created_at` (timestamptz, default now())

3. Security
   - RLS enabled on `profiles`.
   - Each authenticated user can only read and update their own row (auth.uid() = id).
   - INSERT policy allows a user to insert their own profile row (auth.uid() = id).

4. Important Notes
   - The `plan` column defaults to 'trial' so new users automatically start the trial.
   - The `trial_started_at` defaults to now() so the 20-day countdown starts immediately.
   - The frontend's loadProfile() inserts a row when none exists; the defaults ensure
     the user is immediately in 'trial' status with 20 days remaining.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  plan text NOT NULL DEFAULT 'trial',
  trial_started_at timestamptz NOT NULL DEFAULT now(),
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
