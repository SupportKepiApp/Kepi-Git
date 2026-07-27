/*
# Add email column and RLS policies to feedbacks table

1. Changes to existing tables
   - `feedbacks`: add `email` (text, nullable) column to store the user's email
     alongside their user_id, so feedback can be identified by email in the dashboard.

2. Security
   - RLS is already enabled on `feedbacks` but no policies exist.
   - Add INSERT policy: authenticated users can insert their own feedback
     (auth.uid() = user_id).
   - No SELECT/UPDATE/DELETE policy needed — only the admin (via Supabase dashboard
     with service role) reads feedbacks. Users only submit, never read back.

3. Important Notes
   - The `user_id` column already exists and references auth.users.
   - The frontend will send user_id and email from the authenticated session.
   - The email column makes it easy to see who sent feedback in the Supabase dashboard
     without joining to auth.users.
*/

ALTER TABLE feedbacks ADD COLUMN IF NOT EXISTS email text;

DROP POLICY IF EXISTS "insert_own_feedback" ON feedbacks;
CREATE POLICY "insert_own_feedback" ON feedbacks FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
