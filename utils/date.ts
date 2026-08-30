import { format, startOfWeek, addDays, subDays, differenceInDays, parseISO, startOfMonth, endOfMonth, subMonths, subDays as subD } from 'date-fns';

export function todayISO(): string {
  return format(new Date(), 'yyyy-MM-dd');
}

export function dateISO(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

export function formatDate(date: string | Date, fmt: string = 'MMM d, yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}

export function getWeekStart(date: Date = new Date()): Date {
  return startOfWeek(date, { weekStartsOn: 1 });
}

export function getWeekStartISO(date: Date = new Date()): string {
  return dateISO(getWeekStart(date));
}

export function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    days.push(dateISO(subD(new Date(), i)));
  }
  return days;
}

export function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    days.push(dateISO(subD(new Date(), i)));
  }
  return days;
}

export function getDateRange(period: '7d' | '30d' | '90d' | '6m' | '1y'): { start: string; end: string } {
  const end = new Date();
  let start: Date;
  switch (period) {
    case '7d': start = subD(end, 6); break;
    case '30d': start = subD(end, 29); break;
    case '90d': start = subD(end, 89); break;
    case '6m': start = subMonths(end, 6); break;
    case '1y': start = subMonths(end, 12); break;
  }
  return { start: dateISO(start), end: dateISO(end) };
}

export function daysBetween(start: string, end: string): number {
  return differenceInDays(parseISO(end), parseISO(start));
}

export function relativeDayLabel(dateStr: string): string {
  const date = parseISO(dateStr);
  const today = new Date();
  const diff = differenceInDays(today, date);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff === -1) return 'Tomorrow';
  return format(date, 'EEEE, MMM d');
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h} hr`;
  return `${h} hr ${m} min`;
}
