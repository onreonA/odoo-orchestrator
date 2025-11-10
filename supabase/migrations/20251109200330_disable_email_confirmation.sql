-- ============================================
-- DISABLE EMAIL CONFIRMATION FOR DEVELOPMENT
-- ============================================
-- In production, you should enable email confirmation
-- For development, we'll disable it for easier testing

-- Update auth.users to mark all existing users as confirmed
UPDATE auth.users SET email_confirmed_at = NOW() WHERE email_confirmed_at IS NULL;

-- Create a function to auto-confirm emails on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-confirm email for new users
  UPDATE auth.users 
  SET email_confirmed_at = NOW()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-confirm on user creation
DROP TRIGGER IF EXISTS on_auth_user_confirmation ON auth.users;
CREATE TRIGGER on_auth_user_confirmation
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_confirmation();




