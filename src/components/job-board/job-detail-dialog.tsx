'use client';

import { useCallback, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  JobApplicationForm,
  type JobApplicationFormValues,
} from '@/components/job-applications/job-application-form';
import {
  deleteJobApplication,
  listInterviewTips,
  listTimelineEntries,
  stageLabel,
  updateJobApplication,
} from '@/lib/db/job-application-repo';
import { describeTimelineChange, formatDate, formatDateTime } from '@/lib/format';
import type { InterviewTip, JobApplication, TimelineEntry } from '@/types';

interface JobDetailDialogProps {
  application: JobApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

export function JobDetailDialog({ application, open, onOpenChange, onChanged }: JobDetailDialogProps) {
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[] | null>(null);
  const [tips, setTips] = useState<InterviewTip[] | null>(null);

  const refreshTimeline = useCallback(async (id: string) => {
    setTimelineEntries(await listTimelineEntries(id));
  }, []);

  useEffect(() => {
    if (!application) return;
    let cancelled = false;
    Promise.all([listTimelineEntries(application.id), listInterviewTips(application.id)]).then(
      ([entries, tipsResult]) => {
        if (cancelled) return;
        setTimelineEntries(entries);
        setTips(tipsResult);
      }
    );
    return () => {
      cancelled = true;
    };
    // Keyed on id only: after an in-dialog edit, `application` gets a new
    // reference with the same id via the parent's refresh(), and that path
    // already calls refreshTimeline() itself — refetching here too would
    // just be a redundant duplicate request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [application?.id]);

  async function handleEditSubmit(values: JobApplicationFormValues) {
    if (!application) return;
    await updateJobApplication(application.id, values);
    setMode('view');
    onChanged();
    await refreshTimeline(application.id);
  }

  async function handleDelete() {
    if (!application) return;
    if (!window.confirm('确定删除该岗位记录吗？此操作不可撤销。')) return;
    await deleteJobApplication(application.id);
    onOpenChange(false);
    onChanged();
  }

  const interviewEvents = timelineEntries?.filter((entry) => entry.type === 'interview_scheduled') ?? [];

  return (
    <Dialog open={open && application !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        {application && (
          <>
            <DialogHeader>
              <DialogTitle>
                {mode === 'edit' ? '编辑岗位' : `${application.company} · ${application.position}`}
              </DialogTitle>
            </DialogHeader>

            {mode === 'edit' ? (
              <JobApplicationForm
                initial={application}
                onSubmit={handleEditSubmit}
                onCancel={() => setMode('view')}
              />
            ) : (
              <div className="flex flex-col gap-5">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{stageLabel(application)}</Badge>
                  <span className="text-xs text-muted-foreground">
                    投递日期 {formatDate(application.appliedDate)}
                  </span>
                  {application.nextActionDate && (
                    <span className="text-xs text-muted-foreground">
                      下一步 {formatDateTime(application.nextActionDate)}
                    </span>
                  )}
                  {application.source && (
                    <span className="text-xs text-muted-foreground">渠道 {application.source}</span>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => setMode('edit')}>
                    编辑
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleDelete}>
                    删除
                  </Button>
                </div>

                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">时间线</h3>
                  {timelineEntries === null ? (
                    <p className="text-sm text-muted-foreground">加载中…</p>
                  ) : timelineEntries.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无记录</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {timelineEntries.map((entry) => (
                        <li key={entry.id} className="text-sm">
                          <span className="text-muted-foreground">{formatDateTime(entry.eventDate)}</span>{' '}
                          <span>{describeTimelineChange(entry)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">面试安排</h3>
                  {interviewEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无面试安排</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {interviewEvents.map((entry) => (
                        <li key={entry.id} className="text-sm">
                          {formatDateTime(entry.eventDate)} {entry.note}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                <section className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">面试Tips</h3>
                  {tips === null ? (
                    <p className="text-sm text-muted-foreground">加载中…</p>
                  ) : tips.length === 0 ? (
                    <p className="text-sm text-muted-foreground">暂无复盘记录</p>
                  ) : (
                    <ul className="flex flex-col gap-1.5">
                      {tips.map((tip) => (
                        <li key={tip.id} className="text-sm">
                          {tip.content}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
