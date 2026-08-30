import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LifeArea, Goal, Habit, DailyAction, TimeEntry, WeeklyReflection } from '@/types';

interface LocalDataState {
  lifeAreas: LifeArea[];
  goals: Goal[];
  habits: Habit[];
  dailyActions: DailyAction[];
  timeEntries: TimeEntry[];
  reflections: WeeklyReflection[];
  lastSync: string | null;
  hasLocalData: boolean;

  setLifeAreas: (areas: LifeArea[]) => void;
  setGoals: (goals: Goal[]) => void;
  setHabits: (habits: Habit[]) => void;
  setDailyActions: (actions: DailyAction[]) => void;
  setTimeEntries: (entries: TimeEntry[]) => void;
  setReflections: (reflections: WeeklyReflection[]) => void;
  addLifeArea: (area: LifeArea) => void;
  updateLifeArea: (id: string, updates: Partial<LifeArea>) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  addHabit: (habit: Habit) => void;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  addDailyAction: (action: DailyAction) => void;
  updateDailyAction: (id: string, updates: Partial<DailyAction>) => void;
  addTimeEntry: (entry: TimeEntry) => void;
  deleteTimeEntry: (id: string) => void;
  addReflection: (ref: WeeklyReflection) => void;
  setLastSync: (time: string) => void;
  clearLocalData: () => void;
}

export const useLocalDataStore = create<LocalDataState>()(
  persist(
    (set) => ({
      lifeAreas: [],
      goals: [],
      habits: [],
      dailyActions: [],
      timeEntries: [],
      reflections: [],
      lastSync: null,
      hasLocalData: false,

      setLifeAreas: (lifeAreas) => set({ lifeAreas, hasLocalData: true }),
      setGoals: (goals) => set({ goals, hasLocalData: true }),
      setHabits: (habits) => set({ habits }),
      setDailyActions: (dailyActions) => set({ dailyActions }),
      setTimeEntries: (timeEntries) => set({ timeEntries }),
      setReflections: (reflections) => set({ reflections }),

      addLifeArea: (area) => set((s) => ({ lifeAreas: [...s.lifeAreas, area], hasLocalData: true })),
      updateLifeArea: (id, updates) => set((s) => ({
        lifeAreas: s.lifeAreas.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),

      addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
      updateGoal: (id, updates) => set((s) => ({
        goals: s.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
      })),
      deleteGoal: (id) => set((s) => ({
        goals: s.goals.filter((g) => g.id !== id),
        habits: s.habits.filter((h) => h.goal_id !== id),
      })),

      addHabit: (habit) => set((s) => ({ habits: [...s.habits, habit] })),
      updateHabit: (id, updates) => set((s) => ({
        habits: s.habits.map((h) => (h.id === id ? { ...h, ...updates } : h)),
      })),
      deleteHabit: (id) => set((s) => ({
        habits: s.habits.filter((h) => h.id !== id),
        dailyActions: s.dailyActions.filter((a) => a.habit_id !== id),
      })),

      addDailyAction: (action) => set((s) => ({ dailyActions: [...s.dailyActions, action] })),
      updateDailyAction: (id, updates) => set((s) => ({
        dailyActions: s.dailyActions.map((a) => (a.id === id ? { ...a, ...updates } : a)),
      })),

      addTimeEntry: (entry) => set((s) => ({ timeEntries: [...s.timeEntries, entry] })),
      deleteTimeEntry: (id) => set((s) => ({ timeEntries: s.timeEntries.filter((e) => e.id !== id) })),

      addReflection: (ref) => set((s) => ({ reflections: [...s.reflections, ref] })),

      setLastSync: (time) => set({ lastSync: time }),
      clearLocalData: () => set({
        lifeAreas: [],
        goals: [],
        habits: [],
        dailyActions: [],
        timeEntries: [],
        reflections: [],
        lastSync: null,
        hasLocalData: false,
      }),
    }),
    {
      name: 'local-data-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
