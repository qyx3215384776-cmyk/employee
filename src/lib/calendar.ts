export interface CalendarDay {
  date: Date;
  inCurrentMonth: boolean;
}

const WEEKS_IN_GRID = 6;
const DAYS_IN_WEEK = 7;

export function getMonthGrid(year: number, month: number): CalendarDay[] {
  const firstOfMonth = new Date(year, month, 1);
  const gridStart = new Date(year, month, 1 - firstOfMonth.getDay());

  return Array.from({ length: WEEKS_IN_GRID * DAYS_IN_WEEK }, (_, i) => {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    return { date, inCurrentMonth: date.getMonth() === month };
  });
}

export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return dateKey(a) === dateKey(b);
}
