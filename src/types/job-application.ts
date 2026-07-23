export type MainStage = 'applied' | 'written_test' | 'interviewing' | 'result';

export type ResultType = 'offer' | 'rejected' | 'withdrawn';

export interface JobApplication {
  id: string;
  company: string;
  position: string;
  mainStage: MainStage;
  subStage?: string;
  resultType?: ResultType;
  appliedDate: string;
  nextActionDate?: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}
