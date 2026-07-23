import { db } from './dexie-client';
import type { JobApplication, MainStage, ResultType, TimelineEntry } from '@/types';

const MAIN_STAGE_LABELS: Record<MainStage, string> = {
  applied: '已投递',
  written_test: '笔试中',
  interviewing: '面试中',
  result: '结果',
};

const RESULT_TYPE_LABELS: Record<ResultType, string> = {
  offer: 'Offer',
  rejected: '未通过',
  withdrawn: '已婉拒',
};

export function stageLabel(app: Pick<JobApplication, 'mainStage' | 'subStage' | 'resultType'>): string {
  if (app.mainStage === 'interviewing' && app.subStage) {
    return `面试中·${app.subStage}`;
  }
  if (app.mainStage === 'result' && app.resultType) {
    return `结果·${RESULT_TYPE_LABELS[app.resultType]}`;
  }
  return MAIN_STAGE_LABELS[app.mainStage];
}

export type CreateJobApplicationInput = Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateJobApplicationInput = Partial<Omit<JobApplication, 'id' | 'createdAt' | 'updatedAt'>>;

export async function createJobApplication(input: CreateJobApplicationInput): Promise<JobApplication> {
  const now = new Date().toISOString();
  const application: JobApplication = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  await db.transaction('rw', db.jobApplications, db.timelineEntries, async () => {
    await db.jobApplications.add(application);
    await db.timelineEntries.add({
      id: crypto.randomUUID(),
      jobApplicationId: application.id,
      type: 'status_change',
      toStage: stageLabel(application),
      eventDate: now,
      note: '创建岗位记录',
      createdAt: now,
    });
  });

  return application;
}

export async function listJobApplications(): Promise<JobApplication[]> {
  const all = await db.jobApplications.toArray();
  return all.sort((a, b) => {
    if (!a.nextActionDate && !b.nextActionDate) return 0;
    if (!a.nextActionDate) return 1;
    if (!b.nextActionDate) return -1;
    return a.nextActionDate.localeCompare(b.nextActionDate);
  });
}

export async function getJobApplication(id: string): Promise<JobApplication | undefined> {
  return db.jobApplications.get(id);
}

export async function updateJobApplication(
  id: string,
  patch: UpdateJobApplicationInput
): Promise<JobApplication> {
  return db.transaction('rw', db.jobApplications, db.timelineEntries, async () => {
    const existing = await db.jobApplications.get(id);
    if (!existing) {
      throw new Error(`JobApplication ${id} not found`);
    }

    const now = new Date().toISOString();
    const updated: JobApplication = { ...existing, ...patch, id, updatedAt: now };

    const stageChanged =
      existing.mainStage !== updated.mainStage ||
      existing.subStage !== updated.subStage ||
      existing.resultType !== updated.resultType;

    await db.jobApplications.put(updated);

    if (stageChanged) {
      await db.timelineEntries.add({
        id: crypto.randomUUID(),
        jobApplicationId: id,
        type: 'status_change',
        fromStage: stageLabel(existing),
        toStage: stageLabel(updated),
        eventDate: now,
        createdAt: now,
      });
    }

    return updated;
  });
}

export async function deleteJobApplication(id: string): Promise<void> {
  await db.transaction('rw', db.jobApplications, db.timelineEntries, async () => {
    await db.timelineEntries.where('jobApplicationId').equals(id).delete();
    await db.jobApplications.delete(id);
  });
}

export async function listTimelineEntries(jobApplicationId: string): Promise<TimelineEntry[]> {
  const entries = await db.timelineEntries.where('jobApplicationId').equals(jobApplicationId).toArray();
  return entries.sort((a, b) => b.eventDate.localeCompare(a.eventDate));
}
