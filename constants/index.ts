export const APP_NAME = 'Life Framework';

export const APP_TAGLINE = 'Be intentional with your time.';

export const MAX_ACTIVE_HABITS = 5;

export const HABIT_FREQUENCIES = [
  { value: 'daily', label: 'Daily' },
  { value: '2x_week', label: '2x / week' },
  { value: '3x_week', label: '3x / week' },
  { value: '4x_week', label: '4x / week' },
  { value: '5x_week', label: '5x / week' },
  { value: 'weekly', label: 'Weekly' },
] as const;

export const FREQUENCY_PER_WEEK: Record<string, number> = {
  daily: 7,
  '2x_week': 2,
  '3x_week': 3,
  '4x_week': 4,
  '5x_week': 5,
  weekly: 1,
};

export const PRIORITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
] as const;

export const GOAL_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
] as const;

export const TIME_CATEGORIES = [
  { value: 'health', label: 'Health' },
  { value: 'wealth', label: 'Wealth' },
  { value: 'relationships', label: 'Relationships' },
  { value: 'leisure', label: 'Leisure' },
  { value: 'rest', label: 'Rest' },
  { value: 'unplanned', label: 'Unplanned' },
] as const;

export const RESCUE_ACTIONS: Record<string, { title: string; area: string }[]> = {
  H1: [{ title: 'Do 10 push-ups', area: 'Physical' }, { title: 'Drink a glass of water and stretch for 2 minutes', area: 'Physical' }, { title: 'Take a 5-minute walk outside', area: 'Physical' }],
  H2: [{ title: 'Write down one thing currently on your mind', area: 'Mental' }, { title: 'Take 5 slow, deep breaths', area: 'Mental' }, { title: 'Name one thing you are grateful for', area: 'Mental' }],
  W1: [{ title: 'Record today spending', area: 'Financial' }, { title: 'Check your account balance', area: 'Financial' }, { title: 'Skip one non-essential purchase today', area: 'Financial' }],
  W2: [{ title: 'Learn one small concept', area: 'Career' }, { title: 'Update one section of your resume or profile', area: 'Career' }, { title: 'Reach out to one professional contact', area: 'Career' }],
  R1: [{ title: 'Send someone you care about a meaningful message', area: 'Relationship' }, { title: 'Plan one small gesture for your partner', area: 'Relationship' }, { title: 'Think of one way to show appreciation', area: 'Relationship' }],
  R2: [{ title: 'Call parents or a family member for 5 minutes', area: 'Family & Friends' }, { title: 'Send a message to a friend you have not talked to recently', area: 'Family & Friends' }, { title: 'Plan a small get-together', area: 'Family & Friends' }],
  L: [{ title: 'Listen to one song without multitasking', area: 'Leisure' }, { title: 'Spend 5 minutes on a hobby you enjoy', area: 'Leisure' }, { title: 'Watch a short video that makes you laugh', area: 'Leisure' }],
};

export const RESCUE_AREA_CODES = ['H1', 'H2', 'W1', 'W2', 'R1', 'R2', 'L'] as const;

export const PROGRESS_PERIODS = [
  { value: '7d', label: '7 Days' },
  { value: '30d', label: '30 Days' },
  { value: '90d', label: '90 Days' },
  { value: '6m', label: '6 Months' },
  { value: '1y', label: '1 Year' },
] as const;

export const FREE_PERIODS = ['7d'] as const;
export const PREMIUM_PERIODS = ['30d', '90d', '6m', '1y'] as const;
