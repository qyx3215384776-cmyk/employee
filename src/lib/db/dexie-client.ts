import Dexie, { type EntityTable } from 'dexie';
import type { JobApplication, TimelineEntry, InterviewTip } from '@/types';

class AppDatabase extends Dexie {
  jobApplications!: EntityTable<JobApplication, 'id'>;
  timelineEntries!: EntityTable<TimelineEntry, 'id'>;
  interviewTips!: EntityTable<InterviewTip, 'id'>;

  constructor() {
    super('job-tracker');
    this.version(1).stores({
      jobApplications: 'id, company, mainStage, nextActionDate',
      timelineEntries: 'id, jobApplicationId, type, eventDate',
      interviewTips: 'id, jobApplicationId, timelineEntryId',
    });
  }
}

export const db = new AppDatabase();
