'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { dateKey, isSameDay, type CalendarDay } from '@/lib/calendar';
import type { TimelineEntryWithApplication } from '@/lib/db/job-application-repo';

const WEEKDAY_LABELS = ['日', '一', '二', '三', '四', '五', '六'];
const MAX_VISIBLE_EVENTS = 3;

interface CalendarGridProps {
  days: CalendarDay[];
  eventsByDay: Map<string, TimelineEntryWithApplication[]>;
  onSelectDay: (date: Date, events: TimelineEntryWithApplication[]) => void;
}

export function CalendarGrid({ days, eventsByDay, onSelectDay }: CalendarGridProps) {
  const today = new Date();

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map(({ date, inCurrentMonth }) => {
          const key = dateKey(date);
          const events = eventsByDay.get(key) ?? [];
          const isToday = isSameDay(date, today);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelectDay(date, events)}
              disabled={events.length === 0}
              className={cn(
                'flex min-h-24 flex-col gap-1 border-b border-r p-1.5 text-left [&:nth-child(7n)]:border-r-0',
                inCurrentMonth ? 'bg-background' : 'bg-muted/20 text-muted-foreground',
                events.length > 0 && 'hover:bg-accent'
              )}
            >
              <span
                className={cn(
                  'flex size-5 items-center justify-center rounded-full text-xs',
                  isToday && 'bg-primary text-primary-foreground'
                )}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-col gap-0.5">
                {events.slice(0, MAX_VISIBLE_EVENTS).map((event) => (
                  <Badge key={event.id} variant="secondary" className="w-fit max-w-full truncate text-[0.7rem]">
                    {event.company}
                  </Badge>
                ))}
                {events.length > MAX_VISIBLE_EVENTS && (
                  <span className="text-[0.7rem] text-muted-foreground">+{events.length - MAX_VISIBLE_EVENTS}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
