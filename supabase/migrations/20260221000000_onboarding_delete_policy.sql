-- Add DELETE policy so users can reset their own onboarding sessions

CREATE POLICY "Users can delete own onboarding sessions"
  ON onboarding_sessions FOR DELETE
  USING (auth.uid() = user_id);
