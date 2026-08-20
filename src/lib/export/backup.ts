import { db } from '@/lib/db/dexie-client';
import type { InterviewTip, JobApplication, TimelineEntry } from '@/types';

const BACKUP_VERSION = 1;

export interface BackupData {
  version: number;
  exportedAt: string;
  jobApplications: JobApplication[];
  timelineEntries: TimelineEntry[];
  interviewTips: InterviewTip[];
}

export async function exportBackup(): Promise<void> {
  const [jobApplications, timelineEntries, interviewTips] = await Promise.all([
    db.jobApplications.toArray(),
    db.timelineEntries.toArray(),
    db.interviewTips.toArray(),
  ]);

  const data: BackupData = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    jobApplications,
    timelineEntries,
    interviewTips,
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const today = new Date().toISOString().slice(0, 10);

  const link = document.createElement('a');
  link.href = url;
  link.download = `秋招数据备份-${today}.json`;
  link.click();

  URL.revokeObjectURL(url);
}

function isBackupData(value: unknown): value is BackupData {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.version === 'number' &&
    Array.isArray(v.jobApplications) &&
    Array.isArray(v.timelineEntries) &&
    Array.isArray(v.interviewTips)
  );
}

export async function parseBackupFile(file: File): Promise<BackupData> {
  const text = await file.text();

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('文件不是合法的 JSON 格式');
  }

  if (!isBackupData(parsed)) {
    throw new Error('文件内容不符合备份数据格式');
  }

  if (parsed.version !== BACKUP_VERSION) {
    throw new Error(`不支持的备份版本：${parsed.version}`);
  }

  return parsed;
}

export async function restoreBackup(data: BackupData): Promise<void> {
  await db.transaction('rw', db.jobApplications, db.timelineEntries, db.interviewTips, async () => {
    await Promise.all([
      db.jobApplications.clear(),
      db.timelineEntries.clear(),
      db.interviewTips.clear(),
    ]);
    await Promise.all([
      db.jobApplications.bulkPut(data.jobApplications),
      db.timelineEntries.bulkPut(data.timelineEntries),
      db.interviewTips.bulkPut(data.interviewTips),
    ]);
  });
}
