'use client';

import { useEffect, useState } from 'react';
import { StatCards } from './stat-cards';
import { TodayTodo } from './today-todo';
import { FunnelChartCard } from './funnel-chart';
import { UpcomingList } from './upcoming-list';
import { listAllTimelineEntries, listJobApplications, type TimelineEntryWithApplication } from '@/lib/db/job-application-repo';
import { countEntriesInRange, getWeekRange } from '@/lib/dashboard-stats';
import { useAppMode } from '@/lib/mode-context';
import type { JobApplication, MainStage } from '@/types';

interface DashboardProps {
  onOpenApplication: (jobApplicationId: string) => void;
  onNavigateToBoardStage: (stage: MainStage) => void;
}

export function Dashboard({ onOpenApplication, onNavigateToBoardStage }: DashboardProps) {
  const { mode, ready } = useAppMode();
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [entries, setEntries] = useState<TimelineEntryWithApplication[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    Promise.all([listJobApplications(), listAllTimelineEntries()]).then(([apps, allEntries]) => {
      if (cancelled) return;
      setApplications(apps);
      setEntries(allEntries);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, ready]);

  if (!loaded) {
    return <div className="p-4 text-sm text-muted-foreground">加载中…</div>;
  }

  const { start, end } = getWeekRange();
  const weekEventsCount = countEntriesInRange(entries, start, end);

  return (
    <div className="flex flex-col gap-4">
      <TodayTodo applications={applications} onOpenApplication={onOpenApplication} />
      <StatCards applications={applications} weekEventsCount={weekEventsCount} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelChartCard applications={applications} onStageClick={onNavigateToBoardStage} />
        <UpcomingList applications={applications} onOpenApplication={onOpenApplication} />
      </div>
    </div>
  );
}
