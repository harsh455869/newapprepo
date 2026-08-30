import { LifeAreaCode } from '@/types';

export interface LifeAreaDefinition {
  code: LifeAreaCode;
  name: string;
  group: 'Health' | 'Wealth' | 'Relationships' | 'Life & Leisure';
  icon: string;
  color: string;
  description: string;
  includes: string[];
}

export const LIFE_AREAS: LifeAreaDefinition[] = [
  {
    code: 'H1',
    name: 'Physical',
    group: 'Health',
    icon: 'heart-pulse',
    color: '#E85D75',
    description: 'Fitness, sleep, nutrition, energy, body',
    includes: ['Fitness', 'Appearance', 'Body', 'Sleep', 'Nutrition', 'Energy', 'Physical wellbeing'],
  },
  {
    code: 'H2',
    name: 'Mental',
    group: 'Health',
    icon: 'brain',
    color: '#E89D4D',
    description: 'Happiness, stress, mindset, focus',
    includes: ['Happiness', 'Stress', 'Emotional wellbeing', 'Mindset', 'Confidence', 'Focus', 'Mental wellbeing'],
  },
  {
    code: 'W1',
    name: 'Financial',
    group: 'Wealth',
    icon: 'wallet',
    color: '#2BAE66',
    description: 'Income, savings, investments, debt',
    includes: ['Income', 'Savings', 'Investments', 'Spending', 'Debt', 'Financial freedom', 'Side income'],
  },
  {
    code: 'W2',
    name: 'Career',
    group: 'Wealth',
    icon: 'briefcase',
    color: '#3B82F6',
    description: 'Job, skills, growth, networking',
    includes: ['Job', 'Skills', 'Professional growth', 'Communication', 'Workplace relationships', 'Networking', 'Leadership'],
  },
  {
    code: 'R1',
    name: 'Core Relationship',
    group: 'Relationships',
    icon: 'heart',
    color: '#C77DFF',
    description: 'Partner, trust, connection, support',
    includes: ['Partner', 'Communication', 'Trust', 'Emotional connection', 'Quality time', 'Support'],
  },
  {
    code: 'R2',
    name: 'Family & Friends',
    group: 'Relationships',
    icon: 'users',
    color: '#F77F00',
    description: 'Family, relatives, friends, social life',
    includes: ['Parents', 'Family', 'Relatives', 'Friends', 'Social life', 'Maintaining relationships'],
  },
  {
    code: 'L',
    name: 'Life & Leisure',
    group: 'Life & Leisure',
    icon: 'guitar',
    color: '#06B6D4',
    description: 'Hobbies, fun, travel, experiences, relaxation',
    includes: ['Hobbies', 'Entertainment', 'Gaming', 'Movies', 'Music', 'Travel', 'Experiences', 'Relaxation', 'Fun'],
  },
];

export const LIFE_AREA_MAP: Record<string, LifeAreaDefinition> = LIFE_AREAS.reduce(
  (acc, area) => {
    acc[area.code] = area;
    return acc;
  },
  {} as Record<string, LifeAreaDefinition>
);

export const LIFE_AREA_GROUPS = ['Health', 'Wealth', 'Relationships', 'Life & Leisure'] as const;

export function getLifeAreaByCode(code: string): LifeAreaDefinition | undefined {
  return LIFE_AREA_MAP[code];
}

export function getLifeAreaColor(code: string): string {
  return LIFE_AREA_MAP[code]?.color ?? '#6B7280';
}

export function getLifeAreaName(code: string): string {
  return LIFE_AREA_MAP[code]?.name ?? code;
}
