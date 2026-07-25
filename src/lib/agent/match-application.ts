import type { ExtractedFields } from '@/lib/llm/extract-job-update';
import type { JobApplication, MainStage, ResultType } from '@/types';

export type ConfirmationStatus = 'pending' | 'confirming' | 'confirmed' | 'cancelled' | 'error';

export interface PendingConfirmation {
  status: ConfirmationStatus;
  mode: 'create' | 'update';
  jobApplicationId?: string;
  company: string;
  position: string;
  mainStage: MainStage;
  subStage?: string;
  resultType?: ResultType;
  appliedDate: string;
  nextActionDate?: string;
  source?: string;
}

export type MatchResult =
  | { kind: 'clarify'; question: string }
  | { kind: 'create'; fields: ExtractedFields }
  | { kind: 'update'; application: JobApplication; fields: ExtractedFields };

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function matchApplication(fields: ExtractedFields, applications: JobApplication[]): MatchResult {
  if (!fields.company) {
    return { kind: 'clarify', question: '能告诉我是哪家公司吗？' };
  }

  const companyMatches = applications.filter((app) => normalize(app.company) === normalize(fields.company!));

  if (companyMatches.length === 0) {
    if (!fields.position) {
      return { kind: 'clarify', question: `投的是${fields.company}的什么岗位呀？` };
    }
    return { kind: 'create', fields };
  }

  if (fields.position) {
    const positionMatches = companyMatches.filter((app) => normalize(app.position) === normalize(fields.position!));
    if (positionMatches.length === 1) {
      return { kind: 'update', application: positionMatches[0], fields };
    }
    if (positionMatches.length === 0) {
      return { kind: 'create', fields };
    }
    return {
      kind: 'clarify',
      question: `"${fields.company} · ${fields.position}" 匹配到多条记录，暂时无法自动判断更新哪一条，请到"岗位看板"里手动编辑。`,
    };
  }

  if (companyMatches.length === 1) {
    return { kind: 'update', application: companyMatches[0], fields };
  }

  const options = companyMatches.map((app) => app.position).join('、');
  return {
    kind: 'clarify',
    question: `你在${fields.company}投了多个岗位（${options}），能告诉我具体是哪一个吗？`,
  };
}

export function buildPendingConfirmation(match: MatchResult): PendingConfirmation | null {
  if (match.kind === 'clarify') {
    return null;
  }

  const { fields } = match;

  if (match.kind === 'create') {
    const mainStage = fields.mainStage ?? 'applied';
    return {
      status: 'pending',
      mode: 'create',
      company: fields.company!,
      position: fields.position!,
      mainStage,
      subStage: mainStage === 'interviewing' ? (fields.subStage ?? undefined) : undefined,
      resultType: mainStage === 'result' ? (fields.resultType ?? undefined) : undefined,
      appliedDate: new Date().toISOString().slice(0, 10),
      nextActionDate: fields.eventDate ?? undefined,
      source: fields.source ?? undefined,
    };
  }

  const existing = match.application;
  const mainStage = fields.mainStage ?? existing.mainStage;
  return {
    status: 'pending',
    mode: 'update',
    jobApplicationId: existing.id,
    company: existing.company,
    position: existing.position,
    mainStage,
    subStage: mainStage === 'interviewing' ? (fields.subStage ?? existing.subStage) : undefined,
    resultType: mainStage === 'result' ? (fields.resultType ?? existing.resultType) : undefined,
    appliedDate: existing.appliedDate,
    nextActionDate: fields.eventDate ?? existing.nextActionDate,
    source: fields.source ?? existing.source,
  };
}
