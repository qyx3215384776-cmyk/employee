import Dexie, { type EntityTable } from 'dexie';
import type { JobApplication, TimelineEntry, InterviewTip } from '@/types';

export type AppMode = 'demo' | 'personal';

class AppDatabase extends Dexie {
  jobApplications!: EntityTable<JobApplication, 'id'>;
  timelineEntries!: EntityTable<TimelineEntry, 'id'>;
  interviewTips!: EntityTable<InterviewTip, 'id'>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      jobApplications: 'id, company, mainStage, nextActionDate',
      timelineEntries: 'id, jobApplicationId, type, eventDate',
      interviewTips: 'id, jobApplicationId, timelineEntryId',
    });
  }
}

const personalDb = new AppDatabase('job-tracker');
const demoDb = new AppDatabase('job-tracker-demo');

let _activeDb: AppDatabase = demoDb;

export function getDb(): AppDatabase {
  return _activeDb;
}

export function switchDb(mode: AppMode): void {
  _activeDb = mode === 'demo' ? demoDb : personalDb;
}

/** Reads localStorage to decide the initial mode; call once on app start. */
export function initDbMode(): AppMode {
  if (typeof window === 'undefined') return 'demo';
  const stored = localStorage.getItem('app-mode');
  const mode: AppMode = stored === 'personal' ? 'personal' : 'demo';
  _activeDb = mode === 'demo' ? demoDb : personalDb;
  return mode;
}

/**
 * Proxy so existing `import { db } from './dexie-client'` call sites keep
 * working untouched across a mode switch. Functions are bound to the real
 * active instance (not the proxy) — Dexie's methods read internal instance
 * state off `this`, so an unbound call would silently operate on the wrong
 * object identity.
 */
export const db = new Proxy({} as AppDatabase, {
  get(_target, prop) {
    const real = getDb();
    const value = (real as unknown as Record<string | symbol, unknown>)[prop];
    return typeof value === 'function' ? value.bind(real) : value;
  },
});
