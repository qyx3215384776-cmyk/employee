import { Award, CalendarDays, MessagesSquare, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { countApplicationsCreatedInRange, getWeekRange } from '@/lib/dashboard-stats';
import type { JobApplication } from '@/types';

interface StatCardsProps {
  applications: JobApplication[];
  weekEventsCount: number;
}

function DeltaBadge({ delta }: { delta: number }) {
  if (delta === 0) return <span className="text-xs text-muted-foreground">较上周持平</span>;
  const positive = delta > 0;
  return (
    <span className={cn('text-xs', positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-destructive')}>
      {positive ? '↑' : '↓'}
      {Math.abs(delta)} 较上周
    </span>
  );
}

export function StatCards({ applications, weekEventsCount }: StatCardsProps) {
  const { start: thisWeekStart, end: thisWeekEnd } = getWeekRange();
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);

  const thisWeekNew = countApplicationsCreatedInRange(applications, thisWeekStart, thisWeekEnd);
  const lastWeekNew = countApplicationsCreatedInRange(applications, lastWeekStart, thisWeekStart);

  const interviewing = applications.filter((app) => app.mainStage === 'interviewing').length;
  const offers = applications.filter((app) => app.resultType === 'offer').length;

  const items = [
    { label: '总投递数', value: applications.length, icon: Send, extra: <DeltaBadge delta={thisWeekNew - lastWeekNew} /> },
    { label: '面试中', value: interviewing, icon: MessagesSquare },
    { label: '已拿 Offer', value: offers, icon: Award },
    { label: '本周事件', value: weekEventsCount, icon: CalendarDays },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardContent className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs">{item.label}</span>
              <item.icon className="size-4" />
            </div>
            <div className="text-2xl font-semibold tabular-nums">{item.value}</div>
            {item.extra ?? <span className="text-xs text-transparent select-none">-</span>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
