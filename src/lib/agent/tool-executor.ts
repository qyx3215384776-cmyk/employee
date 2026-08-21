import type { JobApplication, MainStage, ResultType } from '@/types';

// ---- 类型定义 ----

export interface PendingAction {
  type: 'create' | 'update';
  // create 时的字段
  company?: string;
  position?: string;
  mainStage?: string;
  subStage?: string;
  resultType?: string;
  nextActionDate?: string;
  source?: string;
  // update 时需要 applicationId
  applicationId?: string;
}

export interface ToolExecutorContext {
  applications: JobApplication[]; // 客户端传来的当前数据
  pendingActions: PendingAction[]; // 本轮对话中累积的写操作
  currentDateIso: string; // 当前日期（东八区）
}

// ---- 参数校验辅助函数 ----
// 工具参数来自 LLM 生成的 JSON，即使有 tool schema 约束也不能完全信任类型，
// 这里做和 extract-job-update.ts 里同样谨慎的窄化处理。

const MAIN_STAGES: MainStage[] = ['applied', 'written_test', 'interviewing', 'result'];
const RESULT_TYPES: ResultType[] = ['offer', 'rejected', 'withdrawn'];

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function mainStage(value: unknown): MainStage | undefined {
  return typeof value === 'string' && MAIN_STAGES.includes(value as MainStage) ? (value as MainStage) : undefined;
}

function resultType(value: unknown): ResultType | undefined {
  return typeof value === 'string' && RESULT_TYPES.includes(value as ResultType) ? (value as ResultType) : undefined;
}

function num(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

// ---- 工具执行函数 ----

export function executeToolCall(toolName: string, args: Record<string, unknown>, ctx: ToolExecutorContext): string {
  try {
    switch (toolName) {
      case 'search_applications':
        return executeSearch(args, ctx);
      case 'get_statistics':
        return executeStatistics(ctx);
      case 'create_application':
        return executeCreate(args, ctx);
      case 'update_application':
        return executeUpdate(args, ctx);
      case 'get_upcoming_events':
        return executeUpcoming(args, ctx);
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  } catch (error) {
    return JSON.stringify({
      error: `工具 ${toolName} 执行失败: ${error instanceof Error ? error.message : String(error)}`,
      suggestion: '请检查参数或换个方式重试',
    });
  }
}

function executeSearch(args: Record<string, unknown>, ctx: ToolExecutorContext): string {
  const company = str(args.company)?.toLowerCase();
  const position = str(args.position)?.toLowerCase();
  const stage = mainStage(args.mainStage);
  const result = resultType(args.resultType);

  const results = ctx.applications
    .filter((app) => !company || app.company.toLowerCase().includes(company))
    .filter((app) => !position || app.position.toLowerCase().includes(position))
    .filter((app) => !stage || app.mainStage === stage)
    .filter((app) => !result || app.resultType === result)
    .map((app) => ({
      id: app.id,
      company: app.company,
      position: app.position,
      mainStage: app.mainStage,
      subStage: app.subStage,
      resultType: app.resultType,
      nextActionDate: app.nextActionDate,
      appliedDate: app.appliedDate,
    }));

  if (results.length === 0) {
    return JSON.stringify({ results: [], message: '没有找到匹配的记录' });
  }
  return JSON.stringify({ results });
}

function executeStatistics(ctx: ToolExecutorContext): string {
  const apps = ctx.applications;
  const total = apps.length;

  const byStage: Record<MainStage, number> = { applied: 0, written_test: 0, interviewing: 0, result: 0 };
  const byResult: Record<ResultType, number> = { offer: 0, rejected: 0, withdrawn: 0 };
  for (const app of apps) {
    byStage[app.mainStage] += 1;
    if (app.resultType) byResult[app.resultType] += 1;
  }

  const pastApplied = (stages: MainStage[]) =>
    apps.filter((app) => stages.includes(app.mainStage)).length;
  const rate = (count: number) => (total === 0 ? 0 : Math.round((count / total) * 100));

  const writtenTestRate = rate(pastApplied(['written_test', 'interviewing', 'result']));
  const interviewRate = rate(pastApplied(['interviewing', 'result']));
  const offerRate = rate(byResult.offer);

  return JSON.stringify({
    total,
    byStage,
    byResult,
    rates: {
      writtenTestRate,
      interviewRate,
      offerRate,
    },
  });
}

function executeCreate(args: Record<string, unknown>, ctx: ToolExecutorContext): string {
  const company = str(args.company);
  const position = str(args.position);
  if (!company || !position) {
    return JSON.stringify({ error: '缺少必填参数 company 或 position' });
  }

  const duplicate = ctx.applications.find(
    (app) => app.company.toLowerCase() === company.toLowerCase() && app.position.toLowerCase() === position.toLowerCase()
  );
  if (duplicate) {
    return JSON.stringify({
      error: `该公司+岗位已存在记录，ID 为 ${duplicate.id}，请使用 update_application 更新`,
    });
  }

  ctx.pendingActions.push({
    type: 'create',
    company,
    position,
    mainStage: mainStage(args.mainStage) ?? 'applied',
    subStage: str(args.subStage),
    resultType: resultType(args.resultType),
    nextActionDate: str(args.nextActionDate),
    source: str(args.source),
  });

  return JSON.stringify({ success: true, message: '已添加到待确认列表，等待用户确认后写入' });
}

function executeUpdate(args: Record<string, unknown>, ctx: ToolExecutorContext): string {
  const applicationId = str(args.applicationId);
  if (!applicationId) {
    return JSON.stringify({ error: '缺少必填参数 applicationId' });
  }

  const existing = ctx.applications.find((app) => app.id === applicationId);
  if (!existing) {
    return JSON.stringify({ error: '找不到该记录，请先用 search_applications 查找' });
  }

  ctx.pendingActions.push({
    type: 'update',
    applicationId,
    mainStage: mainStage(args.mainStage),
    subStage: str(args.subStage),
    resultType: resultType(args.resultType),
    nextActionDate: str(args.nextActionDate),
    source: str(args.source),
  });

  return JSON.stringify({ success: true, message: '已添加到待确认列表' });
}

function executeUpcoming(args: Record<string, unknown>, ctx: ToolExecutorContext): string {
  const days = num(args.days) ?? 7;
  const now = new Date(ctx.currentDateIso).getTime();
  const rangeEnd = now + days * 24 * 60 * 60 * 1000;

  const results = ctx.applications
    .filter((app) => {
      if (!app.nextActionDate) return false;
      const t = new Date(app.nextActionDate).getTime();
      return t >= now && t <= rangeEnd;
    })
    .sort((a, b) => a.nextActionDate!.localeCompare(b.nextActionDate!))
    .map((app) => ({
      company: app.company,
      position: app.position,
      nextActionDate: app.nextActionDate,
      mainStage: app.mainStage,
    }));

  return JSON.stringify({ results });
}
