'use client';

import { useCallback, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobBoard } from '@/components/job-board/job-board';
import { InterviewCalendar } from '@/components/calendar/interview-calendar';

type TabValue = 'agent' | 'board' | 'calendar' | 'tips';

function ComingSoon({ description }: { description: string }) {
  return (
    <div className="rounded-lg border border-dashed p-12 text-center text-sm text-muted-foreground">
      即将推出 · {description}
    </div>
  );
}

export function AppTabs() {
  const [tab, setTab] = useState<TabValue>('board');
  const [focusApplicationId, setFocusApplicationId] = useState<string | null>(null);

  const openApplication = useCallback((jobApplicationId: string) => {
    setFocusApplicationId(jobApplicationId);
    setTab('board');
  }, []);

  const clearFocusApplication = useCallback(() => setFocusApplicationId(null), []);

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(value as TabValue)}>
      <TabsList>
        <TabsTrigger value="agent">Agent</TabsTrigger>
        <TabsTrigger value="board">岗位看板</TabsTrigger>
        <TabsTrigger value="calendar">面试日历</TabsTrigger>
        <TabsTrigger value="tips">面试Tips</TabsTrigger>
      </TabsList>

      <TabsContent value="agent">
        <ComingSoon description="对话录入岗位投递进度" />
      </TabsContent>
      <TabsContent value="board">
        <JobBoard focusApplicationId={focusApplicationId} onFocusApplicationHandled={clearFocusApplication} />
      </TabsContent>
      <TabsContent value="calendar">
        <InterviewCalendar onOpenApplication={openApplication} />
      </TabsContent>
      <TabsContent value="tips">
        <ComingSoon description="面试复盘笔记" />
      </TabsContent>
    </Tabs>
  );
}
