'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { CalendarGrid } from './calendar-grid';
import { DayDetailDialog } from './day-detail-dialog';
import { listAllTimelineEntries, type TimelineEntryWithApplication } from '@/lib/db/job-application-repo';
import { dateKey, getMonthGrid } from '@/lib/calendar';

interface InterviewCalendarProps {
  onOpenApplication: (jobApplicationId: string) => void;
}

function monthLabel(date: Date): string {
  return `${date.getFullYear()}年${date.getMonth() + 1}月`;
}

export function InterviewCalendar({ onOpenApplication }: InterviewCalendarProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [entries, setEntries] = useState<TimelineEntryWithApplication[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<{ date: Date; events: TimelineEntryWithApplication[] } | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    listAllTimelineEntries().then((result) => {
      if (cancelled) return;
      setEntries(result.filter((entry) => entry.type === 'interview_scheduled'));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const eventsByDay = useMemo(() => {
    const map = new Map<string, TimelineEntryWithApplication[]>();
    for (const entry of entries ?? []) {
      const key = dateKey(new Date(entry.eventDate));
      const bucket = map.get(key);
      if (bucket) {
        bucket.push(entry);
      } else {
        map.set(key, [entry]);
      }
    }
    for (const bucket of map.values()) {
      bucket.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
    }
    return map;
  }, [entries]);

  const days = useMemo(() => getMonthGrid(cursor.getFullYear(), cursor.getMonth()), [cursor]);

  function goToMonth(offset: number) {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1));
  }

  function goToday() {
    const now = new Date();
    setCursor(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  function handleSelectDay(date: Date, events: TimelineEntryWithApplication[]) {
    if (events.length === 0) return;
    setSelectedDay({ date, events });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{monthLabel(cursor)}</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => goToMonth(-1)}>
            上个月
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={goToday}>
            今天
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => goToMonth(1)}>
            下个月
          </Button>
        </div>
      </div>

      {entries === null ? (
        <div className="p-4 text-sm text-muted-foreground">加载中…</div>
      ) : (
        <CalendarGrid days={days} eventsByDay={eventsByDay} onSelectDay={handleSelectDay} />
      )}

      <DayDetailDialog
        day={selectedDay}
        onOpenChange={(open) => {
          if (!open) setSelectedDay(null);
        }}
        onOpenApplication={onOpenApplication}
      />
    </div>
  );
}
