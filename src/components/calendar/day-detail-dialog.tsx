'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { describeTimelineChange, formatDateTime } from '@/lib/format';
import type { TimelineEntryWithApplication } from '@/lib/db/job-application-repo';

interface DayDetailDialogProps {
  day: { date: Date; events: TimelineEntryWithApplication[] } | null;
  onOpenChange: (open: boolean) => void;
  onOpenApplication: (jobApplicationId: string) => void;
}

export function DayDetailDialog({ day, onOpenChange, onOpenApplication }: DayDetailDialogProps) {
  return (
    <Dialog open={day !== null} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
        {day && (
          <>
            <DialogHeader>
              <DialogTitle>
                {day.date.toLocaleDateString('zh-CN', {
                  year: 'numeric',
                  month: '2-digit',
                  day: '2-digit',
                  weekday: 'long',
                })}
              </DialogTitle>
            </DialogHeader>
            <ul className="flex flex-col gap-3">
              {day.events.map((event) => (
                <li key={event.id} className="rounded-lg border p-3 text-sm">
                  <div className="font-medium">
                    {event.company} · {event.position}
                  </div>
                  <div className="text-muted-foreground">{formatDateTime(event.eventDate)}</div>
                  <div>{describeTimelineChange(event)}</div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-1 px-0"
                    onClick={() => onOpenApplication(event.jobApplicationId)}
                  >
                    查看岗位详情
                  </Button>
                </li>
              ))}
            </ul>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
