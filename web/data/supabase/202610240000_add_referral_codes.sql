ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by TEXT;

CREATE INDEX IF NOT EXISTS users_referred_by_idx ON users (referred_by);
