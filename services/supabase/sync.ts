import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import { useLocalDataStore } from '@/store/localDataStore';
import {
  fetchLifeAreas, fetchGoals, fetchHabits, fetchDailyActions, fetchTimeEntries, fetchReflections,
} from '@/services/supabase/repositories';

export async function syncRemoteToLocal(): Promise<{ success: boolean; error?: string }> {
  const { user } = useAuthStore.getState();
  if (!user || user.isGuest) return { success: true };

  try {
    const userId = user.id;
    const [lifeAreas, goals, habits, dailyActions, timeEntries, reflections] = await Promise.all([
      fetchLifeAreas(userId),
      fetchGoals(userId),
      fetchHabits(userId),
      fetchDailyActions(userId),
      fetchTimeEntries(userId),
      fetchReflections(userId),
    ]);

    const store = useLocalDataStore.getState();
    store.setLifeAreas(lifeAreas);
    store.setGoals(goals);
    store.setHabits(habits);
    store.setDailyActions(dailyActions);
    store.setTimeEntries(timeEntries);
    store.setReflections(reflections);
    store.setLastSync(new Date().toISOString());

    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Sync failed' };
  }
}

export async function migrateGuestDataToAccount(): Promise<{ success: boolean; error?: string }> {
  const { user } = useAuthStore.getState();
  const localStore = useLocalDataStore.getState();
  if (!user || user.isGuest) return { success: true };
  if (!localStore.hasLocalData) return { success: true };

  try {
    const userId = user.id;

    // Migrate life areas
    if (localStore.lifeAreas.length > 0) {
      const areasToInsert = localStore.lifeAreas.map((a) => ({
        ...a,
        id: undefined,
        user_id: userId,
      }));
      const { data: insertedAreas, error: areasError } = await supabase
        .from('life_areas')
        .insert(areasToInsert)
        .select();
      if (areasError) throw areasError;

      // Map old IDs to new IDs
      const areaIdMap: Record<string, string> = {};
      (insertedAreas || []).forEach((newArea: any, idx: number) => {
        areaIdMap[localStore.lifeAreas[idx].id] = newArea.id;
      });

      // Migrate goals with new area IDs
      if (localStore.goals.length > 0) {
        const goalsToInsert = localStore.goals.map((g) => ({
          ...g,
          id: undefined,
          user_id: userId,
          life_area_id: areaIdMap[g.life_area_id] || g.life_area_id,
        }));
        const { data: insertedGoals, error: goalsError } = await supabase
          .from('goals')
          .insert(goalsToInsert)
          .select();
        if (goalsError) throw goalsError;

        const goalIdMap: Record<string, string> = {};
        (insertedGoals || []).forEach((newGoal: any, idx: number) => {
          goalIdMap[localStore.goals[idx].id] = newGoal.id;
        });

        // Migrate habits with new goal/area IDs
        if (localStore.habits.length > 0) {
          const habitsToInsert = localStore.habits.map((h) => ({
            ...h,
            id: undefined,
            user_id: userId,
            goal_id: goalIdMap[h.goal_id] || h.goal_id,
            life_area_id: areaIdMap[h.life_area_id] || h.life_area_id,
          }));
          const { error: habitsError } = await supabase.from('habits').insert(habitsToInsert);
          if (habitsError) throw habitsError;
        }
      }

      // Migrate daily actions, time entries, reflections with new area IDs
      if (localStore.dailyActions.length > 0) {
        const actionsToInsert = localStore.dailyActions.map((a) => ({
          ...a,
          id: undefined,
          user_id: userId,
          life_area_id: areaIdMap[a.life_area_id] || a.life_area_id,
          habit_id: null,
        }));
        const { error: actionsError } = await supabase.from('daily_actions').insert(actionsToInsert);
        if (actionsError) throw actionsError;
      }

      if (localStore.timeEntries.length > 0) {
        const entriesToInsert = localStore.timeEntries.map((e) => ({
          ...e,
          id: undefined,
          user_id: userId,
          life_area_id: e.life_area_id ? (areaIdMap[e.life_area_id] || null) : null,
        }));
        const { error: entriesError } = await supabase.from('time_entries').insert(entriesToInsert);
        if (entriesError) throw entriesError;
      }

      if (localStore.reflections.length > 0) {
        const refsToInsert = localStore.reflections.map((r) => ({
          ...r,
          id: undefined,
          user_id: userId,
        }));
        const { error: refsError } = await supabase.from('weekly_reflections').insert(refsToInsert);
        if (refsError) throw refsError;
      }
    }

    // Now fetch all data fresh from remote
    await syncRemoteToLocal();
    return { success: true };
  } catch (e: any) {
    return { success: false, error: e?.message || 'Migration failed' };
  }
}
