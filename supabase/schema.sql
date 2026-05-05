-- ================================================================
-- BudgetBoodschappen — Supabase Schema
-- Run this in Supabase → SQL Editor
-- ================================================================

-- User profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id            UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name          TEXT,
  city          TEXT,
  lat           DOUBLE PRECISION,
  lng           DOUBLE PRECISION,
  budget        JSONB    DEFAULT '{}',
  lifestyle_budget JSONB DEFAULT '{}',
  household_size   INT  DEFAULT 2,
  setup_complete   BOOLEAN DEFAULT false,
  updated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profiles_self" ON profiles;
CREATE POLICY "profiles_self" ON profiles FOR ALL USING (auth.uid() = id);

-- Auto-create profile on sign-up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Loyalty cards
CREATE TABLE IF NOT EXISTS loyalty_cards (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  program_id   TEXT NOT NULL,
  card_number  TEXT,
  points       INT  DEFAULT 0,
  last_synced  TIMESTAMPTZ DEFAULT now(),
  created_at   TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE loyalty_cards ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "loyalty_self" ON loyalty_cards;
CREATE POLICY "loyalty_self" ON loyalty_cards FOR ALL USING (auth.uid() = user_id);

-- Price alerts
CREATE TABLE IF NOT EXISTS price_alerts (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  product_id        TEXT,
  product_name      TEXT,
  product_emoji     TEXT,
  supermarket_id    TEXT,
  supermarket_name  TEXT,
  supermarket_color TEXT,
  old_price         DOUBLE PRECISION,
  new_price         DOUBLE PRECISION,
  savings_amount    DOUBLE PRECISION,
  percent_off       DOUBLE PRECISION,
  offer_label       TEXT,
  category          TEXT,
  read              BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE price_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "alerts_self" ON price_alerts;
CREATE POLICY "alerts_self" ON price_alerts FOR ALL USING (auth.uid() = user_id);
