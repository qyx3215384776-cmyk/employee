import type { JobApplication } from '@/types';
import type { TimelineEntryWithApplication } from '@/lib/db/job-application-repo';

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Monday 00:00 (inclusive) through the following Monday 00:00 (exclusive). */
export function getWeekRange(reference: Date = new Date()): { start: Date; end: Date } {
  const today = startOfDay(reference);
  const weekday = today.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  const start = addDays(today, mondayOffset);
  const end = addDays(start, 7);
  return { start, end };
}

export function countEntriesInRange(
  entries: TimelineEntryWithApplication[],
  start: Date,
  end: Date
): number {
  return entries.filter((entry) => {
    const t = new Date(entry.eventDate).getTime();
    return t >= start.getTime() && t < end.getTime();
  }).length;
}

export function countApplicationsCreatedInRange(
  applications: JobApplication[],
  start: Date,
  end: Date
): number {
  return applications.filter((app) => {
    const t = new Date(app.createdAt).getTime();
    return t >= start.getTime() && t < end.getTime();
  }).length;
}

/**
 * Applications with a nextActionDate falling within [today+fromDays, today+toDays),
 * sorted ascending by that date.
 */
export function getUpcomingApplications(
  applications: JobApplication[],
  fromDays: number,
  toDays: number,
  reference: Date = new Date()
): JobApplication[] {
  const rangeStart = addDays(startOfDay(reference), fromDays);
  const rangeEnd = addDays(startOfDay(reference), toDays);

  return applications
    .filter((app) => {
      if (!app.nextActionDate) return false;
      const t = new Date(app.nextActionDate).getTime();
      return t >= rangeStart.getTime() && t < rangeEnd.getTime();
    })
    .sort((a, b) => a.nextActionDate!.localeCompare(b.nextActionDate!));
}

export type DueBucket = 'today' | 'tomorrow' | 'later';

export function dueBucket(dateIso: string, reference: Date = new Date()): DueBucket {
  const today = startOfDay(reference);
  const tomorrow = addDays(today, 1);
  const dayAfter = addDays(today, 2);
  const t = new Date(dateIso).getTime();
  if (t < tomorrow.getTime()) return 'today';
  if (t < dayAfter.getTime()) return 'tomorrow';
  return 'later';
}

export interface FunnelStage {
  key: 'applied' | 'written_test' | 'interviewing' | 'offer';
  label: string;
  count: number;
  rate: number;
  color: string;
}

export function buildFunnelStages(applications: JobApplication[]): FunnelStage[] {
  const total = applications.length;
  const reachedWrittenTest = applications.filter((app) =>
    (['written_test', 'interviewing', 'result'] as const).includes(app.mainStage as never)
  ).length;
  const reachedInterviewing = applications.filter((app) =>
    (['interviewing', 'result'] as const).includes(app.mainStage as never)
  ).length;
  const offers = applications.filter((app) => app.resultType === 'offer').length;

  const rate = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 100));

  return [
    { key: 'applied', label: '投递', count: total, rate: rate(total), color: '#3b82f6' },
    { key: 'written_test', label: '笔试', count: reachedWrittenTest, rate: rate(reachedWrittenTest), color: '#8b5cf6' },
    { key: 'interviewing', label: '面试', count: reachedInterviewing, rate: rate(reachedInterviewing), color: '#f97316' },
    { key: 'offer', label: 'Offer', count: offers, rate: rate(offers), color: '#22c55e' },
  ];
}
