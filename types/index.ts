export type LifeAreaCode = 'H1' | 'H2' | 'W1' | 'W2' | 'R1' | 'R2' | 'L' | string;

export type Priority = 'high' | 'medium' | 'low';

export type GoalStatus = 'active' | 'completed' | 'paused' | 'archived';

export type HabitFrequency = 'daily' | '2x_week' | '3x_week' | '4x_week' | '5x_week' | 'weekly';

export type HabitStatus = 'active' | 'paused' | 'archived';

export type TimeCategory = 'health' | 'wealth' | 'relationships' | 'leisure' | 'rest' | 'unplanned';

export type SubscriptionStatus = 'free' | 'active' | 'expired' | 'cancelled' | 'grace_period';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface LifeArea {
  id: string;
  user_id: string;
  code: string;
  name: string;
  current_score: number;
  target_score: number;
  priority: Priority;
  reason: string | null;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  life_area_id: string;
  title: string;
  description: string | null;
  current_value: number | null;
  target_value: number | null;
  deadline: string | null;
  status: GoalStatus;
  created_at: string;
  updated_at: string;
}

export interface Habit {
  id: string;
  user_id: string;
  goal_id: string;
  life_area_id: string;
  title: string;
  frequency: HabitFrequency;
  estimated_impact: number;
  start_date: string;
  end_date: string | null;
  status: HabitStatus;
  created_at: string;
  updated_at: string;
}

export interface DailyAction {
  id: string;
  user_id: string;
  habit_id: string | null;
  life_area_id: string;
  date: string;
  title: string;
  duration_minutes: number;
  completed: boolean;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TimeEntry {
  id: string;
  user_id: string;
  life_area_id: string | null;
  activity: string;
  category: TimeCategory;
  duration_minutes: number;
  date: string;
  intentional: boolean;
  created_at: string;
  updated_at: string;
}

export interface WeeklyReflection {
  id: string;
  user_id: string;
  week_start: string;
  what_worked: string | null;
  what_didnt: string | null;
  next_week: string | null;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  provider: string;
  product_id: string | null;
  entitlement: string;
  status: SubscriptionStatus;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  email: string;
  name: string | null;
  avatar_url: string | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
  isGuest: boolean;
}

export interface LifeAreaWithRelations extends LifeArea {
  goals?: Goal[];
  habits?: Habit[];
}

export interface DailyActionWithRelations extends DailyAction {
  life_area?: LifeArea;
  habit?: Habit;
}
