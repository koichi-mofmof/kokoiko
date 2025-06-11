-- Enable pgcrypto extension for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Add encrypted columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS display_name_encrypted TEXT,
ADD COLUMN IF NOT EXISTS bio_encrypted TEXT;

-- Create function to encrypt profile data
CREATE OR REPLACE FUNCTION encrypt_profile_data() 
RETURNS TRIGGER AS $$
DECLARE
  encryption_key TEXT := current_setting('app.encryption_key', TRUE);
BEGIN
  -- Use a default key if not set (for development - in production this should be set properly)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'clippymap_default_key_change_in_production_2024';
  END IF;
  
  -- Encrypt display_name if present
  IF NEW.display_name IS NOT NULL THEN
    NEW.display_name_encrypted = encode(
      pgp_sym_encrypt(NEW.display_name, encryption_key),
      'base64'
    );
  ELSE
    NEW.display_name_encrypted = NULL;
  END IF;
  
  -- Encrypt bio if present
  IF NEW.bio IS NOT NULL THEN
    NEW.bio_encrypted = encode(
      pgp_sym_encrypt(NEW.bio, encryption_key),
      'base64'
    );
  ELSE
    NEW.bio_encrypted = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to decrypt profile data
CREATE OR REPLACE FUNCTION decrypt_profile_data(encrypted_data TEXT) 
RETURNS TEXT AS $$
DECLARE
  encryption_key TEXT := current_setting('app.encryption_key', TRUE);
BEGIN
  -- Use a default key if not set (for development)
  IF encryption_key IS NULL OR encryption_key = '' THEN
    encryption_key := 'clippymap_default_key_change_in_production_2024';
  END IF;
  
  IF encrypted_data IS NULL OR encrypted_data = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN pgp_sym_decrypt(
    decode(encrypted_data, 'base64'),
    encryption_key
  );
EXCEPTION
  WHEN OTHERS THEN
    -- If decryption fails, return NULL
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to encrypt data before insert/update
DROP TRIGGER IF EXISTS encrypt_profile_trigger ON public.profiles;
CREATE TRIGGER encrypt_profile_trigger
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION encrypt_profile_data();

-- Create view for decrypted data access
CREATE OR REPLACE VIEW public.profiles_decrypted AS
SELECT 
  id,
  username,
  -- Return decrypted data if available, otherwise plain text for backward compatibility
  COALESCE(
    decrypt_profile_data(display_name_encrypted), 
    display_name
  ) as display_name,
  COALESCE(
    decrypt_profile_data(bio_encrypted), 
    bio
  ) as bio,
  avatar_url,
  created_at,
  updated_at,
  -- Include encrypted columns for internal use
  display_name_encrypted,
  bio_encrypted
FROM public.profiles;

-- Update RLS policies for the view
ALTER VIEW public.profiles_decrypted OWNER TO postgres;

-- Grant permissions to the view
GRANT SELECT ON public.profiles_decrypted TO authenticated;
GRANT SELECT ON public.profiles_decrypted TO anon;

-- Migrate existing data to encrypted format
UPDATE public.profiles 
SET 
  display_name = display_name, -- This will trigger the encryption via trigger
  bio = bio
WHERE display_name IS NOT NULL OR bio IS NOT NULL;

-- Set application setting for encryption key (development only)
-- In production, this should be set via environment variables
-- Note: For Supabase, we'll use a session-level setting instead
SELECT set_config('app.encryption_key', 'clippymap_default_key_change_in_production_2024', false);

-- Create function to update encryption key (for production use)
CREATE OR REPLACE FUNCTION set_encryption_key(new_key TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.encryption_key', new_key, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.display_name_encrypted IS 'Encrypted display name using pgcrypto';
COMMENT ON COLUMN public.profiles.bio_encrypted IS 'Encrypted bio using pgcrypto';
COMMENT ON FUNCTION encrypt_profile_data() IS 'Automatically encrypts profile data before storage';
COMMENT ON FUNCTION decrypt_profile_data(TEXT) IS 'Decrypts profile data for application use';
COMMENT ON VIEW public.profiles_decrypted IS 'View providing decrypted access to profile data with backward compatibility';
COMMENT ON FUNCTION set_encryption_key(TEXT) IS 'Sets the encryption key for the current session (production use)'; 