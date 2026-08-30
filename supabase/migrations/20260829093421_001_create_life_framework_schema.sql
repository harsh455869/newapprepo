/*
# Life Framework - Core Database Schema

This migration creates the foundational tables for the Life Framework application.

## Tables Created

1. **profiles** - User profile information linked to auth.users
   - id (uuid, FK to auth.users)
   - email (text)
   - name (text)
   - avatar_url (text, nullable)
   - onboarding_completed (boolean, default false)
   - created_at, updated_at (timestamps)

2. **life_areas** - The 7 life areas (H1, H2, W1, W2, R1, R2, L)
   - id (uuid PK)
   - user_id (uuid, FK to auth.users, defaults to auth.uid())
   - code (text: H1/H2/W1/W2/R1/R2/L or custom)
   - name (text)
   - current_score (int 0-100)
   - target_score (int 0-100)
   - priority (text: high/medium/low)
   - reason (text, nullable)
   - is_custom (boolean, default false)
   - created_at, updated_at

3. **goals** - Goals linked to life areas
   - id (uuid PK)
   - user_id (uuid, defaults to auth.uid())
   - life_area_id (uuid, FK)
   - title, description (text)
   - current_value, target_value (numeric, nullable)
   - deadline (date, nullable)
   - status (text: active/completed/paused/archived)
   - created_at, updated_at

4. **habits** - Habits linked to goals
   - id (uuid PK)
   - user_id (uuid, defaults to auth.uid())
   - goal_id (uuid, FK)
   - life_area_id (uuid, FK)
   - title (text)
   - frequency (text: daily/2x_week/3x_week/4x_week/5x_week/weekly)
   - estimated_impact (int 0-100)
   - start_date, end_date (date)
   - status (text: active/paused/archived)
   - created_at, updated_at

5. **daily_actions** - Daily actions generated from habits
   - id (uuid PK)
   - user_id (uuid, defaults to auth.uid())
   - habit_id (uuid, FK, nullable)
   - life_area_id (uuid, FK)
   - date (date)
   - title (text)
   - duration_minutes (int)
   - completed (boolean)
   - completed_at (timestamptz, nullable)
   - notes (text, nullable)
   - created_at, updated_at

6. **time_entries** - Manual time tracking entries
   - id (uuid PK)
   - user_id (uuid, defaults to auth.uid())
   - life_area_id (uuid, FK, nullable)
   - activity (text)
   - category (text: health/wealth/relationships/leisure/rest/unplanned)
   - duration_minutes (int)
   - date (date)
   - intentional (boolean)
   - created_at, updated_at

7. **weekly_reflections** - Weekly reflection entries
   - id (uuid PK)
   - user_id (uuid, defaults to auth.uid())
   - week_start (date)
   - what_worked, what_didnt, next_week (text)
   - created_at, updated_at

8. **subscriptions** - Subscription tracking (RevenueCat sync)
   - id (uuid PK)
   - user_id (uuid, defaults to auth.uid())
   - provider (text)
   - product_id (text)
   - entitlement (text)
   - status (text)
   - expires_at (timestamptz, nullable)
   - created_at, updated_at

## Security

- RLS enabled on ALL tables
- Owner-scoped CRUD policies (auth.uid() = user_id) on all user-owned tables
- profiles table scoped by auth.uid() = id
- All user_id columns default to auth.uid() so inserts work without client passing user_id

## Indexes

- user_id on all user-owned tables
- life_area_id, goal_id, habit_id foreign keys
- date columns for time-based queries
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  avatar_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);
DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = id);

-- Life areas table
CREATE TABLE IF NOT EXISTS life_areas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  current_score integer NOT NULL DEFAULT 50 CHECK (current_score >= 0 AND current_score <= 100),
  target_score integer NOT NULL DEFAULT 50 CHECK (target_score >= 0 AND target_score <= 100),
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('high','medium','low')),
  reason text,
  is_custom boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE life_areas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_life_areas" ON life_areas;
CREATE POLICY "select_own_life_areas" ON life_areas FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_life_areas" ON life_areas;
CREATE POLICY "insert_own_life_areas" ON life_areas FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_life_areas" ON life_areas;
CREATE POLICY "update_own_life_areas" ON life_areas FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_life_areas" ON life_areas;
CREATE POLICY "delete_own_life_areas" ON life_areas FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Goals table
CREATE TABLE IF NOT EXISTS goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  life_area_id uuid NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  current_value numeric,
  target_value numeric,
  deadline date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','completed','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_goals" ON goals;
CREATE POLICY "select_own_goals" ON goals FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_goals" ON goals;
CREATE POLICY "insert_own_goals" ON goals FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_goals" ON goals;
CREATE POLICY "update_own_goals" ON goals FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_goals" ON goals;
CREATE POLICY "delete_own_goals" ON goals FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Habits table
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id uuid NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  life_area_id uuid NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  title text NOT NULL,
  frequency text NOT NULL DEFAULT 'daily' CHECK (frequency IN ('daily','2x_week','3x_week','4x_week','5x_week','weekly')),
  estimated_impact integer NOT NULL DEFAULT 50 CHECK (estimated_impact >= 0 AND estimated_impact <= 100),
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_habits" ON habits;
CREATE POLICY "select_own_habits" ON habits FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_habits" ON habits;
CREATE POLICY "insert_own_habits" ON habits FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_habits" ON habits;
CREATE POLICY "update_own_habits" ON habits FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_habits" ON habits;
CREATE POLICY "delete_own_habits" ON habits FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Daily actions table
CREATE TABLE IF NOT EXISTS daily_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  habit_id uuid REFERENCES habits(id) ON DELETE SET NULL,
  life_area_id uuid NOT NULL REFERENCES life_areas(id) ON DELETE CASCADE,
  date date NOT NULL,
  title text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 15 CHECK (duration_minutes >= 0),
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE daily_actions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_daily_actions" ON daily_actions;
CREATE POLICY "select_own_daily_actions" ON daily_actions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_daily_actions" ON daily_actions;
CREATE POLICY "insert_own_daily_actions" ON daily_actions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_daily_actions" ON daily_actions;
CREATE POLICY "update_own_daily_actions" ON daily_actions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_daily_actions" ON daily_actions;
CREATE POLICY "delete_own_daily_actions" ON daily_actions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  life_area_id uuid REFERENCES life_areas(id) ON DELETE SET NULL,
  activity text NOT NULL,
  category text NOT NULL DEFAULT 'unplanned' CHECK (category IN ('health','wealth','relationships','leisure','rest','unplanned')),
  duration_minutes integer NOT NULL DEFAULT 0 CHECK (duration_minutes >= 0),
  date date NOT NULL,
  intentional boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_time_entries" ON time_entries;
CREATE POLICY "select_own_time_entries" ON time_entries FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_time_entries" ON time_entries;
CREATE POLICY "insert_own_time_entries" ON time_entries FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_time_entries" ON time_entries;
CREATE POLICY "update_own_time_entries" ON time_entries FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_time_entries" ON time_entries;
CREATE POLICY "delete_own_time_entries" ON time_entries FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Weekly reflections table
CREATE TABLE IF NOT EXISTS weekly_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  what_worked text,
  what_didnt text,
  next_week text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE weekly_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_weekly_reflections" ON weekly_reflections;
CREATE POLICY "select_own_weekly_reflections" ON weekly_reflections FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_weekly_reflections" ON weekly_reflections;
CREATE POLICY "insert_own_weekly_reflections" ON weekly_reflections FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_weekly_reflections" ON weekly_reflections;
CREATE POLICY "update_own_weekly_reflections" ON weekly_reflections FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_weekly_reflections" ON weekly_reflections;
CREATE POLICY "delete_own_weekly_reflections" ON weekly_reflections FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'revenuecat',
  product_id text,
  entitlement text NOT NULL DEFAULT 'free',
  status text NOT NULL DEFAULT 'free' CHECK (status IN ('free','active','expired','cancelled','grace_period')),
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_subscriptions" ON subscriptions;
CREATE POLICY "select_own_subscriptions" ON subscriptions FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_subscriptions" ON subscriptions;
CREATE POLICY "insert_own_subscriptions" ON subscriptions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_subscriptions" ON subscriptions;
CREATE POLICY "update_own_subscriptions" ON subscriptions FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_subscriptions" ON subscriptions;
CREATE POLICY "delete_own_subscriptions" ON subscriptions FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_life_areas_user_id ON life_areas(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_life_area_id ON goals(life_area_id);
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habits_goal_id ON habits(goal_id);
CREATE INDEX IF NOT EXISTS idx_habits_life_area_id ON habits(life_area_id);
CREATE INDEX IF NOT EXISTS idx_daily_actions_user_id ON daily_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_actions_date ON daily_actions(date);
CREATE INDEX IF NOT EXISTS idx_daily_actions_habit_id ON daily_actions(habit_id);
CREATE INDEX IF NOT EXISTS idx_daily_actions_life_area_id ON daily_actions(life_area_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_date ON time_entries(date);
CREATE INDEX IF NOT EXISTS idx_weekly_reflections_user_id ON weekly_reflections(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
DROP TRIGGER IF EXISTS trigger_profiles_updated_at ON profiles;
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_life_areas_updated_at ON life_areas;
CREATE TRIGGER trigger_life_areas_updated_at BEFORE UPDATE ON life_areas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_goals_updated_at ON goals;
CREATE TRIGGER trigger_goals_updated_at BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_habits_updated_at ON habits;
CREATE TRIGGER trigger_habits_updated_at BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_daily_actions_updated_at ON daily_actions;
CREATE TRIGGER trigger_daily_actions_updated_at BEFORE UPDATE ON daily_actions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_time_entries_updated_at ON time_entries;
CREATE TRIGGER trigger_time_entries_updated_at BEFORE UPDATE ON time_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_weekly_reflections_updated_at ON weekly_reflections;
CREATE TRIGGER trigger_weekly_reflections_updated_at BEFORE UPDATE ON weekly_reflections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_subscriptions_updated_at ON subscriptions;
CREATE TRIGGER trigger_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();