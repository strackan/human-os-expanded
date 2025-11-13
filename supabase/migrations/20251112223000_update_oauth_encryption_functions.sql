-- Update OAuth token encryption/decryption functions
-- Remove DEFAULT values to ensure compatibility with PostgREST

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.encrypt_oauth_token(text, text);
DROP FUNCTION IF EXISTS public.decrypt_oauth_token(bytea, text);

-- Function to encrypt OAuth tokens (no defaults)
CREATE OR REPLACE FUNCTION public.encrypt_oauth_token(
  token text,
  encryption_key text
)
RETURNS bytea
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_encrypt(token, encryption_key);
END;
$$;

-- Function to decrypt OAuth tokens (no defaults)
CREATE OR REPLACE FUNCTION public.decrypt_oauth_token(
  encrypted_token bytea,
  encryption_key text
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted_token, encryption_key);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.encrypt_oauth_token(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrypt_oauth_token(bytea, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.encrypt_oauth_token(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.decrypt_oauth_token(bytea, text) TO service_role;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
