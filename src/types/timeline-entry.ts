export type TimelineEntryType = 'status_change' | 'interview_scheduled' | 'note';

export interface TimelineEntry {
  id: string;
  jobApplicationId: string;
  type: TimelineEntryType;
  fromStage?: string;
  toStage?: string;
  eventDate: string;
  note?: string;
  createdAt: string;
}
