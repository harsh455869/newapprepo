import { z } from 'zod';

export const lifeAssessmentSchema = z.object({
  scores: z.record(z.string(), z.number().min(0).max(100)),
  skipped: z.array(z.string()).default([]),
});

export const targetStateSchema = z.object({
  targets: z.record(z.string(), z.number().min(0).max(100)),
  priorities: z.record(z.string(), z.enum(['high', 'medium', 'low'])),
  reasons: z.record(z.string(), z.string().optional()),
});

export const goalSchema = z.object({
  title: z.string().min(1, 'Goal title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional().default(''),
  life_area_id: z.string().min(1, 'Select a life area'),
  current_value: z.number().optional().nullable(),
  target_value: z.number().optional().nullable(),
  deadline: z.string().optional().nullable(),
});

export const habitSchema = z.object({
  title: z.string().min(1, 'Habit title is required').max(200, 'Title is too long'),
  goal_id: z.string().min(1, 'Select a goal'),
  life_area_id: z.string().min(1, 'Life area is required'),
  frequency: z.enum(['daily', '2x_week', '3x_week', '4x_week', '5x_week', 'weekly']),
  estimated_impact: z.number().min(0).max(100),
  start_date: z.string(),
  end_date: z.string().optional().nullable(),
});

export const dailyActionSchema = z.object({
  title: z.string().min(1, 'Action title is required').max(200),
  life_area_id: z.string().min(1, 'Select a life area'),
  duration_minutes: z.number().min(1).max(480),
  date: z.string(),
});

export const timeEntrySchema = z.object({
  activity: z.string().min(1, 'Activity is required').max(200),
  category: z.enum(['health', 'wealth', 'relationships', 'leisure', 'rest', 'unplanned']),
  duration_minutes: z.number().min(1).max(1440, 'Duration cannot exceed 24 hours'),
  date: z.string(),
  intentional: z.boolean(),
  life_area_id: z.string().optional().nullable(),
});

export const reflectionSchema = z.object({
  week_start: z.string().min(1),
  what_worked: z.string().max(2000).optional().default(''),
  what_didnt: z.string().max(2000).optional().default(''),
  next_week: z.string().max(2000).optional().default(''),
});

export const signUpSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const signInSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
});

export type LifeAssessmentInput = z.infer<typeof lifeAssessmentSchema>;
export type TargetStateInput = z.infer<typeof targetStateSchema>;
export type GoalInput = z.infer<typeof goalSchema>;
export type HabitInput = z.infer<typeof habitSchema>;
export type DailyActionInput = z.infer<typeof dailyActionSchema>;
export type TimeEntryInput = z.infer<typeof timeEntrySchema>;
export type ReflectionInput = z.infer<typeof reflectionSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
