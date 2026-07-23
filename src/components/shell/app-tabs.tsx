'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { JobBoard } from '@/components/job-board/job-board';

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
        <JobBoard />
      </TabsContent>
      <TabsContent value="calendar">
        <ComingSoon description="面试安排月视图日历" />
      </TabsContent>
      <TabsContent value="tips">
        <ComingSoon description="面试复盘笔记" />
      </TabsContent>
    </Tabs>
  );
}
