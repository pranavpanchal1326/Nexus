-- ═══════════════════════════════════════════════════════════════════════════
-- NEXUS v2.0 — Phase 4B RPC Functions
-- Migration: 002_rpc_functions
--
-- NOTE: increment_oracle_stat, increment_journal_stat, increment_gym_stat
-- already exist as TRIGGER functions in 001_initial.sql.
-- Those triggers fire automatically on INSERT — no RPC needed for them.
--
-- This migration adds:
--   1. increment_duel_stat       — callable from /api/lexicon/evaluate
--   2. recalculate_streak        — callable after any activity to sync profile
-- ═══════════════════════════════════════════════════════════════════════════

-- ─── increment_duel_stat ─────────────────────────────────────────────────────
-- Called by /api/lexicon/evaluate after a successful word duel.
-- p_xp: XP awarded (0, 50, 100, or 150 — matches LexiconJudgeResponse)

CREATE OR REPLACE FUNCTION increment_duel_stat(p_user_id UUID, p_xp INTEGER)
RETURNS void AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, duel_count, xp_earned)
  VALUES (p_user_id, CURRENT_DATE, 1, p_xp)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    duel_count = daily_stats.duel_count + 1,
    xp_earned  = daily_stats.xp_earned + p_xp;

  -- Also update cumulative XP on profile
  UPDATE profiles
  SET
    cognitive_xp = cognitive_xp + p_xp,
    updated_at   = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_duel_stat(UUID, INTEGER) TO authenticated;

-- ─── recalculate_streak ───────────────────────────────────────────────────────
-- Walks backward from today, counting consecutive days with any activity.
-- Updates profiles.current_streak and profiles.longest_streak.
-- Called after oracle interactions (fire-and-forget from /api/chat).

CREATE OR REPLACE FUNCTION recalculate_streak(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_streak       INTEGER := 0;
  v_check_date   DATE    := CURRENT_DATE;
  v_has_activity BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM daily_stats
      WHERE user_id = p_user_id
        AND date    = v_check_date
        AND (journal_count + gym_count + duel_count + oracle_count) > 0
    ) INTO v_has_activity;

    EXIT WHEN NOT v_has_activity;

    v_streak     := v_streak + 1;
    v_check_date := v_check_date - INTERVAL '1 day';
  END LOOP;

  UPDATE profiles
  SET
    current_streak = v_streak,
    longest_streak = GREATEST(longest_streak, v_streak),
    updated_at     = now()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION recalculate_streak(UUID) TO authenticated;
