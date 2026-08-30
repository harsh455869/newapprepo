import { supabase } from '@/services/supabase/client';
import { LifeArea, Goal, Habit, DailyAction, TimeEntry, WeeklyReflection, Profile } from '@/types';

// ===================== Profiles =====================

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

// ===================== Life Areas =====================

export async function fetchLifeAreas(userId: string): Promise<LifeArea[]> {
  const { data, error } = await supabase
    .from('life_areas')
    .select('*')
    .eq('user_id', userId)
    .order('code');
  if (error) throw error;
  return (data || []) as LifeArea[];
}

export async function upsertLifeArea(area: Partial<LifeArea> & { code: string; name: string }): Promise<LifeArea | null> {
  const { data, error } = await supabase
    .from('life_areas')
    .upsert(area)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as LifeArea | null;
}

export async function updateLifeArea(id: string, updates: Partial<LifeArea>): Promise<LifeArea | null> {
  const { data, error } = await supabase
    .from('life_areas')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as LifeArea | null;
}

export async function deleteLifeArea(id: string): Promise<void> {
  const { error } = await supabase.from('life_areas').delete().eq('id', id);
  if (error) throw error;
}

// ===================== Goals =====================

export async function fetchGoals(userId: string): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Goal[];
}

export async function createGoal(goal: Partial<Goal> & { life_area_id: string; title: string }): Promise<Goal | null> {
  const { data, error } = await supabase
    .from('goals')
    .insert(goal)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Goal | null;
}

export async function updateGoal(id: string, updates: Partial<Goal>): Promise<Goal | null> {
  const { data, error } = await supabase
    .from('goals')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Goal | null;
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id);
  if (error) throw error;
}

// ===================== Habits =====================

export async function fetchHabits(userId: string): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []) as Habit[];
}

export async function createHabit(habit: Partial<Habit> & { goal_id: string; life_area_id: string; title: string }): Promise<Habit | null> {
  const { data, error } = await supabase
    .from('habits')
    .insert(habit)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Habit | null;
}

export async function updateHabit(id: string, updates: Partial<Habit>): Promise<Habit | null> {
  const { data, error } = await supabase
    .from('habits')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as Habit | null;
}

export async function deleteHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').delete().eq('id', id);
  if (error) throw error;
}

// ===================== Daily Actions =====================

export async function fetchDailyActions(userId: string, date?: string): Promise<DailyAction[]> {
  let query = supabase.from('daily_actions').select('*').eq('user_id', userId);
  if (date) query = query.eq('date', date);
  const { data, error } = await query.order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as DailyAction[];
}

export async function createDailyAction(action: Partial<DailyAction> & { life_area_id: string; title: string; date: string }): Promise<DailyAction | null> {
  const { data, error } = await supabase
    .from('daily_actions')
    .insert(action)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as DailyAction | null;
}

export async function updateDailyAction(id: string, updates: Partial<DailyAction>): Promise<DailyAction | null> {
  const { data, error } = await supabase
    .from('daily_actions')
    .update(updates)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as DailyAction | null;
}

export async function deleteDailyAction(id: string): Promise<void> {
  const { error } = await supabase.from('daily_actions').delete().eq('id', id);
  if (error) throw error;
}

// ===================== Time Entries =====================

export async function fetchTimeEntries(userId: string, startDate?: string, endDate?: string): Promise<TimeEntry[]> {
  let query = supabase.from('time_entries').select('*').eq('user_id', userId);
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  const { data, error } = await query.order('date', { ascending: false });
  if (error) throw error;
  return (data || []) as TimeEntry[];
}

export async function createTimeEntry(entry: Partial<TimeEntry> & { activity: string; date: string; category: string }): Promise<TimeEntry | null> {
  const { data, error } = await supabase
    .from('time_entries')
    .insert(entry)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as TimeEntry | null;
}

export async function deleteTimeEntry(id: string): Promise<void> {
  const { error } = await supabase.from('time_entries').delete().eq('id', id);
  if (error) throw error;
}

// ===================== Weekly Reflections =====================

export async function fetchReflections(userId: string): Promise<WeeklyReflection[]> {
  const { data, error } = await supabase
    .from('weekly_reflections')
    .select('*')
    .eq('user_id', userId)
    .order('week_start', { ascending: false });
  if (error) throw error;
  return (data || []) as WeeklyReflection[];
}

export async function createReflection(ref: Partial<WeeklyReflection> & { week_start: string }): Promise<WeeklyReflection | null> {
  const { data, error } = await supabase
    .from('weekly_reflections')
    .insert(ref)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data as WeeklyReflection | null;
}

// ===================== Account Deletion =====================

export async function deleteAccountData(userId: string): Promise<void> {
  // Delete all user-owned data (cascades handle most relationships)
  const tables = ['time_entries', 'daily_actions', 'habits', 'goals', 'life_areas', 'weekly_reflections', 'subscriptions'];
  for (const table of tables) {
    const { error } = await supabase.from(table).delete().eq('user_id', userId);
    if (error) throw error;
  }
  // Delete profile
  const { error: profileError } = await supabase.from('profiles').delete().eq('id', userId);
  if (profileError) throw profileError;
  // Delete auth user
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw authError;
}

// ===================== Data Export =====================

export async function exportUserData(userId: string): Promise<Record<string, unknown>> {
  const [lifeAreas, goals, habits, dailyActions, timeEntries, reflections] = await Promise.all([
    fetchLifeAreas(userId),
    fetchGoals(userId),
    fetchHabits(userId),
    fetchDailyActions(userId),
    fetchTimeEntries(userId),
    fetchReflections(userId),
  ]);

  return {
    exported_at: new Date().toISOString(),
    life_areas: lifeAreas,
    goals,
    habits,
    daily_actions: dailyActions,
    time_entries: timeEntries,
    weekly_reflections: reflections,
  };
}
