-- Migration 019: Add email verification code fields
-- Adds support for 6-digit verification codes with expiration

-- Add verification_code and verification_code_expires_at columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS verification_code VARCHAR(6),
  ADD COLUMN IF NOT EXISTS verification_code_expires_at TIMESTAMPTZ;

-- Create index on verification_code for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_code ON users(verification_code) 
  WHERE verification_code IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.verification_code IS '6-digit code sent to user for email verification';
COMMENT ON COLUMN users.verification_code_expires_at IS 'Expiration timestamp for the verification code (typically 10 minutes)';

