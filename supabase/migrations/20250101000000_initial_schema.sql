-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  user_number INTEGER UNIQUE NOT NULL,
  registration_type TEXT NOT NULL DEFAULT 'anonymous',
  points INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  redeemable_points INTEGER NOT NULL DEFAULT 0,
  survey_completed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User stamps (tracking which stamps/booths user has acquired)
CREATE TABLE IF NOT EXISTS user_stamps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stamp_id TEXT NOT NULL,
  acquired_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, stamp_id)
);

-- User rewards (tracking reward redemptions)
CREATE TABLE IF NOT EXISTS user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reward_type TEXT NOT NULL,
  points_spent INTEGER NOT NULL,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_stamps_user_id ON user_stamps(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stamps_stamp_id ON user_stamps(stamp_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_id ON user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_users_user_number ON users(user_number);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stamps ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rewards ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
-- Allow anonymous users to read all users (for leaderboard/percentile calculations)
CREATE POLICY "Allow anonymous read access to users"
  ON users FOR SELECT
  USING (true);

-- Allow service role to insert/update users
CREATE POLICY "Allow service role full access to users"
  ON users FOR ALL
  USING (true);

-- RLS Policies for user_stamps table
-- Allow users to read their own stamps
CREATE POLICY "Users can read their own stamps"
  ON user_stamps FOR SELECT
  USING (true);

-- Allow service role to insert stamps
CREATE POLICY "Allow service role full access to stamps"
  ON user_stamps FOR ALL
  USING (true);

-- RLS Policies for user_rewards table
-- Allow users to read their own rewards
CREATE POLICY "Users can read their own rewards"
  ON user_rewards FOR SELECT
  USING (true);

-- Allow service role to insert rewards
CREATE POLICY "Allow service role full access to rewards"
  ON user_rewards FOR ALL
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
