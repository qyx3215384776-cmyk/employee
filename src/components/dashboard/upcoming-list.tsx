'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getUpcomingApplications } from '@/lib/dashboard-stats';
import { formatDateTime } from '@/lib/format';
import type { JobApplication } from '@/types';

interface UpcomingListProps {
  applications: JobApplication[];
  onOpenApplication: (jobApplicationId: string) => void;
}

function eventTypeLabel(app: JobApplication): string {
  if (app.mainStage === 'written_test') return '笔试';
  if (app.mainStage === 'interviewing') return '面试';
  return '待办';
}

export function UpcomingList({ applications, onOpenApplication }: UpcomingListProps) {
  const upcoming = getUpcomingApplications(applications, 0, 7);

  return (
    <Card>
      <CardHeader>
        <CardTitle>近期日程</CardTitle>
      </CardHeader>
      <CardContent>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">近 7 天没有安排，继续加油投递！</p>
        ) : (
          <ul className="flex flex-col divide-y">
            {upcoming.map((app) => (
              <li key={app.id}>
                <button
                  type="button"
                  onClick={() => onOpenApplication(app.id)}
                  className="flex w-full flex-wrap items-center gap-2 py-2 text-left hover:bg-accent/50"
                >
                  <span className="text-sm text-muted-foreground">{formatDateTime(app.nextActionDate)}</span>
                  <span className="text-sm font-medium">{app.company}</span>
                  <span className="text-sm text-muted-foreground">{app.position}</span>
                  <Badge variant="secondary" className="ml-auto">
                    {eventTypeLabel(app)}
                  </Badge>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
