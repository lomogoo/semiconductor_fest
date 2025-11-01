-- Create survey_responses table for new survey schema
CREATE TABLE IF NOT EXISTS survey_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,

  -- Q1: 属性
  affiliation TEXT NOT NULL,

  -- Q2: 性別
  gender TEXT NOT NULL,

  -- Q3: 参加したきっかけ
  participation_trigger TEXT NOT NULL,

  -- Q4: 参加した感想
  satisfaction TEXT NOT NULL,

  -- Q5: 良かった企画 (複数回答可)
  good_programs TEXT[] NOT NULL DEFAULT '{}',

  -- Q6: 知らなかった企業 (複数回答可)
  unknown_companies TEXT[] NOT NULL DEFAULT '{}',

  -- Q7: 良かった企業 (複数回答可)
  good_companies TEXT[] NOT NULL DEFAULT '{}',

  -- Q8: 働いてみたい企業 (複数回答可)
  desired_companies TEXT[] NOT NULL DEFAULT '{}',

  -- Q9: 働きたい理由 (任意、複数回答可)
  work_reasons TEXT[] DEFAULT '{}',
  work_reasons_other TEXT,

  -- Q10: その他感想 (任意)
  other_feedback TEXT,

  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure one survey per user
  UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_survey_responses_user_id ON survey_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_submitted_at ON survey_responses(submitted_at);

-- Enable RLS
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for Edge Functions)
CREATE POLICY "Allow service role full access to survey_responses"
  ON survey_responses FOR ALL
  USING (true);

-- Users can read their own responses
CREATE POLICY "Users can read their own survey responses"
  ON survey_responses FOR SELECT
  USING (auth.uid()::text = user_id);
