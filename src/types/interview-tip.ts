export interface InterviewTip {
  id: string;
  jobApplicationId: string;
  timelineEntryId?: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}
