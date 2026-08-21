'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { FunnelStage } from '@/lib/dashboard-stats';
import type { MainStage } from '@/types';

interface StageFunnelProps {
  stages: FunnelStage[];
  onStageClick?: (stage: MainStage) => void;
}

export function StageFunnel({ stages, onStageClick }: StageFunnelProps) {
  const [animated, setAnimated] = useState(false);
  const maxCount = Math.max(...stages.map((s) => s.count), 1);
  const totalCount = stages[0]?.count || 1;

  useEffect(() => {
    // Delay so the browser paints the 0%-width bars first — otherwise the
    // width transition has nothing to animate from.
    const timer = setTimeout(() => setAnimated(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (stages.every((s) => s.count === 0)) {
    return <div className="py-8 text-center text-sm text-muted-foreground">还没有投递记录，去看板添加第一条吧</div>;
  }

  return (
    <div className="flex flex-col gap-3">
      {stages.map((stage, index) => {
        const widthPercent = Math.max((stage.count / maxCount) * 100, 20);
        const totalPercent = totalCount > 0 ? Math.round((stage.count / totalCount) * 100) : 0;
        const prevCount = index > 0 ? stages[index - 1].count : null;
        const dropRate = prevCount && prevCount > 0 ? Math.round(((prevCount - stage.count) / prevCount) * 100) : null;

        return (
          <div
            key={stage.key}
            className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 sm:flex-nowrap"
          >
            {/* 左侧标签 */}
            <div className="order-1 shrink-0 text-left sm:w-24 sm:text-right">
              <div className="text-sm font-medium text-foreground">{stage.label}</div>
              <div className="text-lg font-semibold tabular-nums text-foreground">{stage.count}</div>
            </div>

            {/* 条形区域 */}
            <div className="relative order-3 h-10 w-full sm:order-2 sm:w-auto sm:flex-1">
              <div className="h-10 w-full rounded-lg bg-muted" />
              <div
                className="absolute inset-y-0 left-1/2 h-10 rounded-lg transition-[width] ease-out"
                style={{
                  width: animated ? `${widthPercent}%` : '0%',
                  transform: 'translateX(-50%)',
                  transitionDuration: '600ms',
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <button
                  type="button"
                  onClick={() => onStageClick?.(stage.key)}
                  disabled={!onStageClick}
                  className={cn(
                    'h-full w-full rounded-lg transition-opacity',
                    stage.color,
                    onStageClick && 'cursor-pointer hover:opacity-90'
                  )}
                  aria-label={`${stage.label} ${stage.count} 条`}
                />
              </div>
            </div>

            {/* 右侧标签 */}
            <div className="order-2 shrink-0 sm:order-3 sm:w-20">
              <div className="text-sm font-medium tabular-nums text-foreground">{totalPercent}%</div>
              {dropRate !== null && <div className="text-xs tabular-nums text-muted-foreground">↓ {dropRate}%</div>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
