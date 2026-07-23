'use client';

import { Badge } from '@/components/ui/badge';
import { RESULT_TYPE_LABELS } from '@/lib/db/job-application-repo';
import { formatDateTime } from '@/lib/format';
import type { JobApplication } from '@/types';

interface KanbanCardProps {
  application: JobApplication;
  onSelect: () => void;
}

export function KanbanCard({ application, onSelect }: KanbanCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full flex-col gap-1.5 rounded-lg border bg-card p-3 text-left text-sm shadow-sm transition-colors hover:border-foreground/30 hover:bg-accent"
    >
      <div className="font-medium">{application.company}</div>
      <div className="text-muted-foreground">{application.position}</div>
      {application.mainStage === 'interviewing' && application.subStage && (
        <Badge variant="secondary" className="w-fit">
          {application.subStage}
        </Badge>
      )}
      {application.mainStage === 'result' && application.resultType && (
        <Badge variant="secondary" className="w-fit">
          {RESULT_TYPE_LABELS[application.resultType]}
        </Badge>
      )}
      <div className="text-xs text-muted-foreground">{formatDateTime(application.nextActionDate)}</div>
    </button>
  );
}
