'use client';

import { cn } from '@/lib/utils';
import { dueBucket, getUpcomingApplications, type DueBucket } from '@/lib/dashboard-stats';
import { formatDateTime } from '@/lib/format';
import type { JobApplication } from '@/types';

interface TodayTodoProps {
  applications: JobApplication[];
  onOpenApplication: (jobApplicationId: string) => void;
}

const BUCKET_STYLES: Record<DueBucket, string> = {
  today: 'border-destructive/60 bg-destructive/5',
  tomorrow: 'border-orange-500/60 bg-orange-500/5',
  later: 'border-border',
};

const BUCKET_LABELS: Record<DueBucket, string> = {
  today: '今天',
  tomorrow: '明天',
  later: '',
};

function eventTypeLabel(app: JobApplication): string {
  if (app.mainStage === 'written_test') return '笔试';
  if (app.mainStage === 'interviewing') return '面试';
  return '待办';
}

export function TodayTodo({ applications, onOpenApplication }: TodayTodoProps) {
  const items = getUpcomingApplications(applications, 0, 4);

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border bg-muted/20 p-3">
      <h2 className="text-sm font-semibold">今日待办</h2>
      <ul className="flex flex-col gap-2">
        {items.map((app) => {
          const bucket = dueBucket(app.nextActionDate!);
          return (
            <li key={app.id}>
              <button
                type="button"
                onClick={() => onOpenApplication(app.id)}
                className={cn(
                  'flex w-full flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-left text-sm hover:bg-accent/50',
                  BUCKET_STYLES[bucket]
                )}
              >
                {BUCKET_LABELS[bucket] ? (
                  <span className="font-semibold">{BUCKET_LABELS[bucket]}</span>
                ) : (
                  <span className="text-muted-foreground">{formatDateTime(app.nextActionDate)}</span>
                )}
                {bucket !== 'later' && (
                  <span className="text-muted-foreground">{formatDateTime(app.nextActionDate)}</span>
                )}
                <span className="font-medium">{app.company}</span>
                <span className="text-muted-foreground">{app.position}</span>
                <span className="ml-auto text-xs text-muted-foreground">{eventTypeLabel(app)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
