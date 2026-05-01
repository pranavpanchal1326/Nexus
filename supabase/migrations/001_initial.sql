-- ═══════════════════════════════════════════════════════
-- NEXUS v2.0 — Full Production Schema
-- Migration: 001_initial
-- Run once on fresh Supabase project
-- ═══════════════════════════════════════════════════════

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id               UUID PRIMARY KEY REFERENCES auth.users(id) 
                   ON DELETE CASCADE,
  display_name     TEXT,
  avatar_url       TEXT,
  preferred_mode   TEXT DEFAULT 'auto' 
                   CHECK (preferred_mode IN ('auto','apex','haven')),
  cognitive_xp     INTEGER DEFAULT 0,
  current_streak   INTEGER DEFAULT 0,
  longest_streak   INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journals (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) 
             ON DELETE CASCADE,
  content    TEXT NOT NULL,
  mode       TEXT NOT NULL CHECK (mode IN ('apex','haven')),
  word_count INTEGER DEFAULT 0,
  ai_insight TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Gym Logs
CREATE TABLE IF NOT EXISTS gym_logs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id) 
               ON DELETE CASCADE,
  exercise     TEXT NOT NULL,
  sets         INTEGER NOT NULL,
  reps         INTEGER NOT NULL,
  weight       DECIMAL(6,2),
  unit         TEXT DEFAULT 'kg' CHECK (unit IN ('kg','lbs')),
  notes        TEXT,
  volume_delta DECIMAL(8,2),
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Word Lexicon
CREATE TABLE IF NOT EXISTS word_lexicon (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) 
                ON DELETE CASCADE,
  word          TEXT NOT NULL,
  definition    TEXT NOT NULL,
  usage_example TEXT,
  cognitive_xp  INTEGER DEFAULT 0,
  usage_count   INTEGER DEFAULT 0,
  last_used_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, word)
);

-- Daily Activity Stats
CREATE TABLE IF NOT EXISTS daily_stats (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES profiles(id) 
                ON DELETE CASCADE,
  date          DATE NOT NULL,
  journal_count INTEGER DEFAULT 0,
  gym_count     INTEGER DEFAULT 0,
  duel_count    INTEGER DEFAULT 0,
  oracle_count  INTEGER DEFAULT 0,
  xp_earned     INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Chat / Oracle History
CREATE TABLE IF NOT EXISTS chat_history (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES profiles(id) 
             ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  mode       TEXT NOT NULL CHECK (mode IN ('apex','haven')),
  persona    TEXT NOT NULL CHECK (persona IN ('commander','poet')),
  model      TEXT DEFAULT 'llama-3.3-70b-versatile',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════

ALTER TABLE profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE journals     ENABLE ROW LEVEL SECURITY;
ALTER TABLE gym_logs     ENABLE ROW LEVEL SECURITY;
ALTER TABLE word_lexicon ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats  ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY "own_profile"  ON profiles     
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "own_journals" ON journals     
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_gym"      ON gym_logs     
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_words"    ON word_lexicon 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_stats"    ON daily_stats  
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "own_chats"    ON chat_history 
  FOR ALL USING (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════
-- INDEXES — Query performance
-- ═══════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_journals_user_date 
  ON journals(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gym_user_date      
  ON gym_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stats_user_date    
  ON daily_stats(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_chat_user_date     
  ON chat_history(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lexicon_user       
  ON word_lexicon(user_id, last_used_at DESC);

-- ═══════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════

-- Auto-update profiles.updated_at on any profile change
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN 
  NEW.updated_at = now(); 
  RETURN NEW; 
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile row when new auth user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-upsert daily_stats when journal entry created
CREATE OR REPLACE FUNCTION increment_journal_stat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, journal_count, xp_earned)
  VALUES (NEW.user_id, CURRENT_DATE, 1, 10)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    journal_count = daily_stats.journal_count + 1,
    xp_earned     = daily_stats.xp_earned + 10;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_journal_stat
  AFTER INSERT ON journals
  FOR EACH ROW EXECUTE FUNCTION increment_journal_stat();

-- Auto-upsert daily_stats when gym log created
CREATE OR REPLACE FUNCTION increment_gym_stat()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_stats (user_id, date, gym_count, xp_earned)
  VALUES (NEW.user_id, CURRENT_DATE, 1, 15)
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    gym_count = daily_stats.gym_count + 1,
    xp_earned = daily_stats.xp_earned + 15;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_gym_stat
  AFTER INSERT ON gym_logs
  FOR EACH ROW EXECUTE FUNCTION increment_gym_stat();

-- Auto-upsert daily_stats when oracle message sent
CREATE OR REPLACE FUNCTION increment_oracle_stat()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'user' THEN
    INSERT INTO daily_stats (user_id, date, oracle_count, xp_earned)
    VALUES (NEW.user_id, CURRENT_DATE, 1, 5)
    ON CONFLICT (user_id, date)
    DO UPDATE SET
      oracle_count = daily_stats.oracle_count + 1,
      xp_earned    = daily_stats.xp_earned + 5;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_oracle_stat
  AFTER INSERT ON chat_history
  FOR EACH ROW EXECUTE FUNCTION increment_oracle_stat();

-- ═══════════════════════════════════════════════════════
-- STREAK CALCULATION FUNCTION
-- Called by /api/stats to compute current streak
-- ═══════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION calculate_streak(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  streak_count INTEGER := 0;
  check_date   DATE    := CURRENT_DATE;
  has_activity BOOLEAN;
BEGIN
  LOOP
    SELECT EXISTS (
      SELECT 1 FROM daily_stats
      WHERE user_id = p_user_id
        AND date = check_date
        AND (journal_count + gym_count + duel_count + oracle_count) > 0
    ) INTO has_activity;

    EXIT WHEN NOT has_activity;

    streak_count := streak_count + 1;
    check_date   := check_date - INTERVAL '1 day';
  END LOOP;

  RETURN streak_count;
END;
$$ LANGUAGE plpgsql;
