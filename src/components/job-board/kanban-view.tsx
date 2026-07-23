'use client';

import { KanbanCard } from './kanban-card';
import { MAIN_STAGE_LABELS } from '@/lib/db/job-application-repo';
import type { JobApplication, MainStage } from '@/types';

const COLUMNS: MainStage[] = ['applied', 'written_test', 'interviewing', 'result'];

interface KanbanViewProps {
  applications: JobApplication[];
  onSelect: (application: JobApplication) => void;
}

export function KanbanView({ applications, onSelect }: KanbanViewProps) {
  const columns = COLUMNS.map((stage) => ({
    stage,
    items: applications.filter((app) => app.mainStage === stage),
  }));

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {columns.map(({ stage, items }) => (
        <div key={stage} className="flex flex-col gap-3 rounded-lg bg-muted/40 p-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-sm font-semibold">{MAIN_STAGE_LABELS[stage]}</h3>
            <span className="text-xs text-muted-foreground">{items.length}</span>
          </div>
          <div className="flex flex-col gap-2">
            {items.length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                暂无
              </div>
            ) : (
              items.map((app) => <KanbanCard key={app.id} application={app} onSelect={() => onSelect(app)} />)
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
