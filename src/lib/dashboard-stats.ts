import type { JobApplication, MainStage } from '@/types';
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
  key: MainStage;
  label: string;
  count: number;
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
  const reachedResult = applications.filter((app) => app.mainStage === 'result').length;

  return [
    { key: 'applied', label: '已投递', count: total, color: 'bg-[#8FA3B0]/70 dark:bg-[#8FA3B0]/50' },
    { key: 'written_test', label: '笔试', count: reachedWrittenTest, color: 'bg-[#C4A882]/70 dark:bg-[#C4A882]/50' },
    { key: 'interviewing', label: '面试中', count: reachedInterviewing, color: 'bg-[#A0889C]/70 dark:bg-[#A0889C]/50' },
    { key: 'result', label: '有结果', count: reachedResult, color: 'bg-[#8BAA96]/70 dark:bg-[#8BAA96]/50' },
  ];
}
