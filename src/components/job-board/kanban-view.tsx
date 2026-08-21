'use client';

import {
  KanbanBoard,
  KanbanBoardColumn,
  KanbanBoardColumnHeader,
  KanbanBoardColumnList,
  KanbanBoardColumnTitle,
  KanbanBoardProvider,
} from '@/components/kanban';
import { KanbanCard } from './kanban-card';
import { Badge } from '@/components/ui/badge';
import { MAIN_STAGE_BADGE_COLORS, MAIN_STAGE_LABELS, updateJobApplication } from '@/lib/db/job-application-repo';
import type { JobApplication, MainStage } from '@/types';

const COLUMNS: MainStage[] = ['applied', 'written_test', 'interviewing', 'result'];

interface KanbanViewProps {
  applications: JobApplication[];
  onSelect: (application: JobApplication) => void;
  onChanged: () => void;
}

export function KanbanView({ applications, onSelect, onChanged }: KanbanViewProps) {
  const columns = COLUMNS.map((stage) => ({
    stage,
    items: applications.filter((app) => app.mainStage === stage),
  }));

  async function handleDropOverColumn(stage: MainStage, dataTransferData: string) {
    const dropped = JSON.parse(dataTransferData) as { id: string };
    const application = applications.find((app) => app.id === dropped.id);
    if (!application || application.mainStage === stage) return;

    // A drag only communicates "move to this stage" — subStage/resultType are
    // specific to the stage they came from, so they'd be stale here. The
    // detail dialog is where the user fills those back in.
    await updateJobApplication(application.id, {
      mainStage: stage,
      subStage: undefined,
      resultType: undefined,
    });
    onChanged();
  }

  return (
    <KanbanBoardProvider>
      <KanbanBoard>
        {columns.map(({ stage, items }) => (
          <KanbanBoardColumn
            key={stage}
            columnId={stage}
            onDropOverColumn={(data) => handleDropOverColumn(stage, data)}
          >
            <KanbanBoardColumnHeader>
              <KanbanBoardColumnTitle columnId={stage}>
                <Badge className={MAIN_STAGE_BADGE_COLORS[stage]}>{MAIN_STAGE_LABELS[stage]}</Badge>
              </KanbanBoardColumnTitle>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </KanbanBoardColumnHeader>
            <KanbanBoardColumnList>
              {items.length === 0 ? (
                <li className="px-2 py-1">
                  <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                    暂无
                  </div>
                </li>
              ) : (
                items.map((app) => (
                  <li key={app.id} className="px-2 py-1">
                    <KanbanCard application={app} onSelect={() => onSelect(app)} />
                  </li>
                ))
              )}
            </KanbanBoardColumnList>
          </KanbanBoardColumn>
        ))}
      </KanbanBoard>
    </KanbanBoardProvider>
  );
}
