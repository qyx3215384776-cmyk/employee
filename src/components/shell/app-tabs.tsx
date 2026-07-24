'use client';

import { useCallback, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobBoard } from '@/components/job-board/job-board';
import { InterviewCalendar } from '@/components/calendar/interview-calendar';
import { InterviewTips } from '@/components/interview-tips/interview-tips';

type TabValue = 'agent' | 'board' | 'calendar' | 'tips';

interface NewTipRequest {
  jobApplicationId: string;
  timelineEntryId?: string;
}

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
  const [newTipRequest, setNewTipRequest] = useState<NewTipRequest | null>(null);

  const openApplication = useCallback((jobApplicationId: string) => {
    setFocusApplicationId(jobApplicationId);
    setTab('board');
  }, []);

  const requestNewTip = useCallback((jobApplicationId: string, timelineEntryId?: string) => {
    setNewTipRequest({ jobApplicationId, timelineEntryId });
    setTab('tips');
  }, []);

  const clearFocusApplication = useCallback(() => setFocusApplicationId(null), []);
  const clearNewTipRequest = useCallback(() => setNewTipRequest(null), []);

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
        <JobBoard
          focusApplicationId={focusApplicationId}
          onFocusApplicationHandled={clearFocusApplication}
          onRequestNewTip={requestNewTip}
        />
      </TabsContent>
      <TabsContent value="calendar">
        <InterviewCalendar onOpenApplication={openApplication} onRequestNewTip={requestNewTip} />
      </TabsContent>
      <TabsContent value="tips">
        <InterviewTips pendingNewTip={newTipRequest} onPendingNewTipHandled={clearNewTipRequest} />
      </TabsContent>
    </Tabs>
  );
}
