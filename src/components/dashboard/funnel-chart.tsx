'use client';

import { Cell, Funnel, FunnelChart, LabelList, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildFunnelStages } from '@/lib/dashboard-stats';
import type { JobApplication, MainStage } from '@/types';

interface FunnelChartCardProps {
  applications: JobApplication[];
  onStageClick?: (stage: MainStage) => void;
}

const STAGE_TO_MAIN_STAGE: Record<ReturnType<typeof buildFunnelStages>[number]['key'], MainStage> = {
  applied: 'applied',
  written_test: 'written_test',
  interviewing: 'interviewing',
  offer: 'result',
};

export function FunnelChartCard({ applications, onStageClick }: FunnelChartCardProps) {
  const stages = buildFunnelStages(applications);
  const data = stages.map((stage) => ({
    key: stage.key,
    name: `${stage.label} · ${stage.count}`,
    rateLabel: `${stage.rate}%`,
    value: stage.count,
    fill: stage.color,
  }));

  if (applications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>转化漏斗</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">还没有投递记录，快去新增第一条吧。</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>转化漏斗</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <FunnelChart>
            <Tooltip
              contentStyle={{
                backgroundColor: 'var(--popover)',
                color: 'var(--popover-foreground)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Funnel dataKey="value" data={data} isAnimationActive>
              <LabelList position="right" dataKey="name" className="fill-foreground text-xs" stroke="none" />
              <LabelList position="center" dataKey="rateLabel" fill="#fff" stroke="none" className="text-xs font-medium" />
              {data.map((entry) => (
                <Cell
                  key={entry.key}
                  fill={entry.fill}
                  className="cursor-pointer"
                  onClick={() => onStageClick?.(STAGE_TO_MAIN_STAGE[entry.key])}
                />
              ))}
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
