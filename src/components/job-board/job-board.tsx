'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { JobBoardToolbar, type BoardView, type StageFilter } from './job-board-toolbar';
import { KanbanView } from './kanban-view';
import { ListView } from './list-view';
import { JobDetailDialog } from './job-detail-dialog';
import { NewApplicationDialog } from './new-application-dialog';
import { listAllTimelineEntries, listJobApplications } from '@/lib/db/job-application-repo';
import { exportJobApplicationsToExcel } from '@/lib/export/export-job-applications';
import { useAppMode } from '@/lib/mode-context';
import type { JobApplication } from '@/types';

interface JobBoardProps {
  focusApplicationId?: string | null;
  onFocusApplicationHandled?: () => void;
  onRequestNewTip?: (jobApplicationId: string, timelineEntryId?: string) => void;
  focusStageFilter?: StageFilter | null;
  onFocusStageFilterHandled?: () => void;
}

export function JobBoard({
  focusApplicationId,
  onFocusApplicationHandled,
  onRequestNewTip,
  focusStageFilter,
  onFocusStageFilterHandled,
}: JobBoardProps = {}) {
  const { mode, ready } = useAppMode();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [view, setView] = useState<BoardView>('kanban');
  const [search, setSearch] = useState('');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [selectedApp, setSelectedApp] = useState<JobApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newDialogOpen, setNewDialogOpen] = useState(false);

  const refresh = useCallback(async () => {
    const result = await listJobApplications();
    setApplications(result);
    setSelectedApp((prev) => (prev ? (result.find((a) => a.id === prev.id) ?? null) : prev));
  }, []);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    listJobApplications().then((result) => {
      if (cancelled) return;
      setApplications(result);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, ready]);

  useEffect(() => {
    // This reacts to an imperative "open this application" command sent from
    // a sibling tab (see AppTabs), not to deriving state from props — there's
    // no render-time equivalent, so the setState calls have to live here.
    if (!focusApplicationId || !loaded) return;
    const app = applications.find((a) => a.id === focusApplicationId) ?? null;
    if (app) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedApp(app);
      setDetailOpen(true);
    }
    onFocusApplicationHandled?.();
  }, [focusApplicationId, loaded, applications, onFocusApplicationHandled]);

  useEffect(() => {
    // Same external-command pattern as the focusApplicationId effect above:
    // the dashboard's funnel chart asks the board to jump to a stage filter.
    if (!focusStageFilter || !loaded) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStageFilter(focusStageFilter);
    onFocusStageFilterHandled?.();
  }, [focusStageFilter, loaded, onFocusStageFilterHandled]);

  const filteredApplications = useMemo(() => {
    const term = search.trim().toLowerCase();
    return applications.filter((app) => {
      const matchesStage = stageFilter === 'all' || app.mainStage === stageFilter;
      const matchesSearch =
        term.length === 0 ||
        app.company.toLowerCase().includes(term) ||
        app.position.toLowerCase().includes(term);
      return matchesStage && matchesSearch;
    });
  }, [applications, search, stageFilter]);

  function handleSelect(app: JobApplication) {
    setSelectedApp(app);
    setDetailOpen(true);
  }

  async function handleExport() {
    const entries = await listAllTimelineEntries();
    exportJobApplicationsToExcel(applications, entries);
  }

  return (
    <div className="flex flex-col gap-4">
      <JobBoardToolbar
        search={search}
        onSearchChange={setSearch}
        stageFilter={stageFilter}
        onStageFilterChange={setStageFilter}
        view={view}
        onViewChange={setView}
        onNew={() => setNewDialogOpen(true)}
        onExport={handleExport}
      />

      {!loaded ? (
        <div className="p-4 text-sm text-muted-foreground">加载中…</div>
      ) : view === 'kanban' ? (
        <KanbanView applications={filteredApplications} onSelect={handleSelect} onChanged={refresh} />
      ) : (
        <ListView applications={filteredApplications} onSelect={handleSelect} />
      )}

      <JobDetailDialog
        key={selectedApp?.id ?? 'none'}
        application={selectedApp}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onChanged={refresh}
        onRequestNewTip={onRequestNewTip}
      />

      <NewApplicationDialog open={newDialogOpen} onOpenChange={setNewDialogOpen} onCreated={refresh} />
    </div>
  );
}
