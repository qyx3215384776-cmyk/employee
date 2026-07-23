'use client';

import { useCallback, useEffect, useState } from 'react';
import { JobApplicationForm, type JobApplicationFormValues } from '@/components/job-applications/job-application-form';
import { JobApplicationList } from '@/components/job-applications/job-application-list';
import {
  createJobApplication,
  deleteJobApplication,
  listJobApplications,
  updateJobApplication,
} from '@/lib/db/job-application-repo';
import type { JobApplication } from '@/types';

export default function Home() {
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [editing, setEditing] = useState<JobApplication | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    const result = await listJobApplications();
    setApplications(result);
  }, []);

  useEffect(() => {
    let cancelled = false;
    listJobApplications().then((result) => {
      if (!cancelled) {
        setApplications(result);
        setLoaded(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(values: JobApplicationFormValues) {
    if (editing) {
      await updateJobApplication(editing.id, values);
      setEditing(null);
    } else {
      await createJobApplication(values);
    }
    await refresh();
  }

  async function handleDelete(id: string) {
    if (editing?.id === id) setEditing(null);
    await deleteJobApplication(id);
    await refresh();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">秋招投递管理</h1>
        <p className="text-sm text-muted-foreground">
          Phase 0：手动录入与查看岗位投递记录，数据保存在浏览器本地（IndexedDB）。
        </p>
      </div>

      <JobApplicationForm
        key={editing?.id ?? 'new'}
        initial={editing}
        onSubmit={handleSubmit}
        onCancel={() => setEditing(null)}
      />

      {loaded ? (
        <JobApplicationList applications={applications} onEdit={setEditing} onDelete={handleDelete} />
      ) : (
        <div className="p-4 text-sm text-muted-foreground">加载中…</div>
      )}
    </div>
  );
}
