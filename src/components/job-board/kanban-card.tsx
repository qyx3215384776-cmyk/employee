'use client';

import { KanbanBoardCard, KanbanBoardCardDescription, KanbanBoardCardTitle } from '@/components/kanban';
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
    <KanbanBoardCard
      data={application}
      onClick={onSelect}
      className="hover:border-foreground/30 hover:bg-accent"
    >
      <KanbanBoardCardTitle>{application.company}</KanbanBoardCardTitle>
      <KanbanBoardCardDescription>{application.position}</KanbanBoardCardDescription>
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
    </KanbanBoardCard>
  );
}
