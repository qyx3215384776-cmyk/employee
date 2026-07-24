import { db } from './dexie-client';
import type { InterviewTip } from '@/types';

export type CreateInterviewTipInput = Omit<InterviewTip, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateInterviewTipInput = Partial<Omit<InterviewTip, 'id' | 'createdAt' | 'updatedAt'>>;

export async function createInterviewTip(input: CreateInterviewTipInput): Promise<InterviewTip> {
  const now = new Date().toISOString();
  const tip: InterviewTip = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
  await db.interviewTips.add(tip);
  return tip;
}

export async function updateInterviewTip(id: string, patch: UpdateInterviewTipInput): Promise<InterviewTip> {
  const existing = await db.interviewTips.get(id);
  if (!existing) {
    throw new Error(`InterviewTip ${id} not found`);
  }
  const updated: InterviewTip = { ...existing, ...patch, id, updatedAt: new Date().toISOString() };
  await db.interviewTips.put(updated);
  return updated;
}

export async function deleteInterviewTip(id: string): Promise<void> {
  await db.interviewTips.delete(id);
}

export async function listInterviewTips(jobApplicationId: string): Promise<InterviewTip[]> {
  const tips = await db.interviewTips.where('jobApplicationId').equals(jobApplicationId).toArray();
  return tips.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export interface InterviewTipWithApplication extends InterviewTip {
  company: string;
  position: string;
}

export async function listAllInterviewTips(): Promise<InterviewTipWithApplication[]> {
  const [applications, tips] = await Promise.all([db.jobApplications.toArray(), db.interviewTips.toArray()]);
  const applicationById = new Map(applications.map((app) => [app.id, app]));

  return tips
    .flatMap((tip) => {
      const app = applicationById.get(tip.jobApplicationId);
      return app ? [{ ...tip, company: app.company, position: app.position }] : [];
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
