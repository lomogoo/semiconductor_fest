-- Enable RLS for survey_responses table
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role full access (for Edge Functions)
CREATE POLICY "Allow service role full access to survey_responses"
  ON survey_responses FOR ALL
  USING (true);

-- Policy: Users can only read their own survey responses
CREATE POLICY "Users can read their own survey responses"
  ON survey_responses FOR SELECT
  USING (auth.uid()::text = user_id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at);
