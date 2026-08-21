'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StageFunnel } from './stage-funnel';
import { buildFunnelStages } from '@/lib/dashboard-stats';
import type { JobApplication, MainStage } from '@/types';

interface FunnelChartCardProps {
  applications: JobApplication[];
  onStageClick?: (stage: MainStage) => void;
}

export function FunnelChartCard({ applications, onStageClick }: FunnelChartCardProps) {
  const stages = buildFunnelStages(applications);

  return (
    <Card>
      <CardHeader>
        <CardTitle>转化漏斗</CardTitle>
      </CardHeader>
      <CardContent>
        <StageFunnel stages={stages} onStageClick={onStageClick} />
      </CardContent>
    </Card>
  );
}
