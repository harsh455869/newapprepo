import { LifeArea, Goal, Habit, DailyAction, TimeEntry, Priority } from '@/types';
import { FREQUENCY_PER_WEEK } from '@/constants';
import { getLast7Days, todayISO, dateISO } from '@/utils/date';

export function calculateGap(current: number, target: number): number {
  return target - current;
}

export function calculateProgressPercent(current: number, target: number, initialScore: number): number {
  if (target === initialScore) return 100;
  const totalGap = target - initialScore;
  const progress = current - initialScore;
  if (totalGap === 0) return 100;
  return Math.max(0, Math.min(100, Math.round((progress / totalGap) * 100)));
}

export function sortByPriority<T extends { priority: Priority }>(items: T[]): T[] {
  const order: Record<Priority, number> = { high: 0, medium: 1, low: 2 };
  return [...items].sort((a, b) => order[a.priority] - order[b.priority]);
}

export function getHighPriorityAreas(areas: LifeArea[]): LifeArea[] {
  return areas.filter((a) => a.priority === 'high');
}

export function getActiveHabits(habits: Habit[]): Habit[] {
  return habits.filter((h) => h.status === 'active');
}

export function getActiveGoals(goals: Goal[]): Goal[] {
  return goals.filter((g) => g.status === 'active');
}

export function shouldHabitRunToday(habit: Habit, date: string = todayISO()): boolean {
  if (habit.status !== 'active') return false;
  const perWeek = FREQUENCY_PER_WEEK[habit.frequency] || 7;
  if (perWeek >= 7) return true;
  // Use day-of-week hash to determine scheduled days deterministically
  const day = new Date(date).getDay();
  const habitHash = habit.id.charCodeAt(0) + (habit.id.charCodeAt(1) || 0);
  const scheduledDays = new Set<number>();
  for (let i = 0; i < perWeek; i++) {
    scheduledDays.add((habitHash + i * 2) % 7);
  }
  return scheduledDays.has(day);
}

export function generateDailyActionsFromHabits(
  habits: Habit[],
  lifeAreas: LifeArea[],
  existingActions: DailyAction[],
  date: string = todayISO()
): DailyAction[] {
  const newActions: DailyAction[] = [];
  const existingHabitIds = new Set(
    existingActions.filter((a) => a.date === date && a.habit_id).map((a) => a.habit_id)
  );

  for (const habit of getActiveHabits(habits)) {
    if (existingHabitIds.has(habit.id)) continue;
    if (!shouldHabitRunToday(habit, date)) continue;

    const area = lifeAreas.find((a) => a.id === habit.life_area_id);
    newActions.push({
      id: `local-${date}-${habit.id}`,
      user_id: '',
      habit_id: habit.id,
      life_area_id: habit.life_area_id,
      date,
      title: habit.title,
      duration_minutes: 15,
      completed: false,
      completed_at: null,
      notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }

  return newActions;
}

export function calculateIntentionalTimeToday(timeEntries: TimeEntry[], date: string = todayISO()): number {
  return timeEntries
    .filter((e) => e.date === date && e.intentional)
    .reduce((sum, e) => sum + e.duration_minutes, 0);
}

export function calculateCompletedTimeToday(actions: DailyAction[], date: string = todayISO()): number {
  return actions
    .filter((a) => a.date === date && a.completed)
    .reduce((sum, a) => sum + a.duration_minutes, 0);
}

export function calculatePriorityAlignment(
  areas: LifeArea[],
  timeEntries: TimeEntry[],
  period: '7d' | '30d' = '7d'
): { areaCode: string; priority: Priority; intentionalMinutes: number; percentage: number }[] {
  const days = period === '7d' ? getLast7Days() : getLast7Days();
  const periodEntries = timeEntries.filter((e) => days.includes(e.date));
  const totalIntentional = periodEntries
    .filter((e) => e.intentional)
    .reduce((sum, e) => sum + e.duration_minutes, 0);

  const result = areas.map((area) => {
    const areaMinutes = periodEntries
      .filter((e) => e.life_area_id === area.id && e.intentional)
      .reduce((sum, e) => sum + e.duration_minutes, 0);
    const percentage = totalIntentional > 0 ? Math.round((areaMinutes / totalIntentional) * 100) : 0;
    return {
      areaCode: area.code,
      priority: area.priority,
      intentionalMinutes: areaMinutes,
      percentage,
    };
  });

  return result;
}

export function getMeaningfulDaysThisWeek(actions: DailyAction[]): number {
  const days = getLast7Days();
  let count = 0;
  for (const day of days) {
    const hasCompleted = actions.some((a) => a.date === day && a.completed);
    if (hasCompleted) count++;
  }
  return count;
}

export function getMostActiveArea(
  timeEntries: TimeEntry[],
  lifeAreas: LifeArea[]
): string | null {
  const areaMinutes: Record<string, number> = {};
  for (const entry of timeEntries) {
    if (!entry.life_area_id || !entry.intentional) continue;
    areaMinutes[entry.life_area_id] = (areaMinutes[entry.life_area_id] || 0) + entry.duration_minutes;
  }
  const sorted = Object.entries(areaMinutes).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return null;
  const area = lifeAreas.find((a) => a.id === sorted[0][0]);
  return area?.code || null;
}

export function getNeglectedAreas(
  areas: LifeArea[],
  timeEntries: TimeEntry[]
): string[] {
  const days = getLast7Days();
  const periodEntries = timeEntries.filter((e) => days.includes(e.date) && e.intentional);
  return areas
    .filter((a) => a.priority === 'high' || a.priority === 'medium')
    .filter((area) => {
      const minutes = periodEntries
        .filter((e) => e.life_area_id === area.id)
        .reduce((sum, e) => sum + e.duration_minutes, 0);
      return minutes === 0;
    })
    .map((a) => a.code);
}

export function generatePlanForDay(
  availableMinutes: number,
  habits: Habit[],
  goals: Goal[],
  lifeAreas: LifeArea[],
  selectedAreaIds: string[],
  date: string = todayISO()
): { title: string; life_area_id: string; duration_minutes: number; areaCode: string }[] {
  const plan: { title: string; life_area_id: string; duration_minutes: number; areaCode: string }[] = [];
  let remaining = availableMinutes;

  const priorityOrder: Record<Priority, number> = { high: 0, medium: 1, low: 2 };

  // Get active habits sorted by area priority
  const activeHabits = getActiveHabits(habits)
    .filter((h) => shouldHabitRunToday(h, date))
    .map((h) => {
      const area = lifeAreas.find((a) => a.id === h.life_area_id);
      return { habit: h, area, priority: area?.priority || 'low' };
    })
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  // Prioritize user-selected areas
  const selectedSet = new Set(selectedAreaIds);
  const selectedHabits = activeHabits.filter((h) => selectedSet.has(h.habit.life_area_id));
  const otherHabits = activeHabits.filter((h) => !selectedSet.has(h.habit.life_area_id));

  const allHabits = [...selectedHabits, ...otherHabits];

  for (const { habit, area } of allHabits) {
    if (remaining <= 0) break;
    const duration = Math.min(15, remaining);
    plan.push({
      title: habit.title,
      life_area_id: habit.life_area_id,
      duration_minutes: duration,
      areaCode: area?.code || '',
    });
    remaining -= duration;
  }

  // If time remains, add actions from goals in selected areas
  if (remaining > 0) {
    const activeGoals = getActiveGoals(goals)
      .filter((g) => selectedSet.has(g.life_area_id) || selectedAreaIds.length === 0)
      .map((g) => {
        const area = lifeAreas.find((a) => a.id === g.life_area_id);
        return { goal: g, area, priority: area?.priority || 'low' };
      })
      .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    for (const { goal, area } of activeGoals) {
      if (remaining <= 0) break;
      const duration = Math.min(15, remaining);
      plan.push({
        title: `Work on: ${goal.title}`,
        life_area_id: goal.life_area_id,
        duration_minutes: duration,
        areaCode: area?.code || '',
      });
      remaining -= duration;
    }
  }

  return plan;
}
