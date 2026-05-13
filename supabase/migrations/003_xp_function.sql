-- Increment cognitive XP safely
CREATE OR REPLACE FUNCTION increment_cognitive_xp(
  p_user_id UUID,
  p_xp      INTEGER
)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    cognitive_xp = cognitive_xp + p_xp,
    updated_at   = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_cognitive_xp(UUID, INTEGER) TO authenticated;
