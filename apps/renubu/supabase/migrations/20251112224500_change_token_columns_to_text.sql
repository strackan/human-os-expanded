-- Change oauth_tokens columns from bytea to text
-- Since we're now using base64-encoded strings instead of binary encryption

ALTER TABLE public.oauth_tokens
  ALTER COLUMN access_token_encrypted TYPE text,
  ALTER COLUMN refresh_token_encrypted TYPE text;
