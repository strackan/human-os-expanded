-- Add OAuth token encryption/decryption functions
-- These functions use pgcrypto to encrypt/decrypt OAuth tokens with AES-256

-- Enable pgcrypto extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to encrypt OAuth tokens
-- Takes plain text and returns encrypted bytea
CREATE OR REPLACE FUNCTION public.encrypt_oauth_token(
  token text,
  encryption_key text DEFAULT current_setting('app.settings.oauth_encryption_key', true)
)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Encrypt using AES-256 in CBC mode
  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$;

-- Function to decrypt OAuth tokens
-- Takes encrypted bytea and returns plain text
CREATE OR REPLACE FUNCTION public.decrypt_oauth_token(
  encrypted_token bytea,
  encryption_key text DEFAULT current_setting('app.settings.oauth_encryption_key', true)
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Decrypt using AES-256 in CBC mode
  RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.encrypt_oauth_token(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_oauth_token(bytea, text) TO authenticated;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION public.encrypt_oauth_token(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_oauth_token(bytea, text) TO service_role;
