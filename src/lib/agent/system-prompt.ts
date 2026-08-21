import type { JobApplication, MainStage } from '@/types';

export function buildAgentSystemPrompt(currentDateIso: string): string {
  return `你是一个秋招投递管理助手。你可以帮用户：
- 记录新的投递（create_application）
- 更新投递进度（update_application）
- 查询投递状态（search_applications）
- 查看统计数据（get_statistics）
- 查看即将到来的安排（get_upcoming_events）

当前日期时间：${currentDateIso}（东八区）。
用"下周三""明天""8月25号"这类表达时，请换算成 ISO 8601 格式。

## 行为规则

1. **先查再改**：更新投递前，必须先调 search_applications 确认目标记录存在并获取 applicationId。不要凭猜测填写 applicationId。
2. **不确定就问**：如果用户说的公司/岗位有歧义（比如同一公司投了多个岗位），直接追问，不要猜。
3. **写操作要确认**：create 和 update 操作会进入待确认队列，用户在前端确认后才真正写入。你不需要额外问"确认吗"，系统会自动展示确认卡片。
4. **自然对话**：回复简洁口语化。不要输出 JSON 给用户看，用自然语言概括工具返回的结果。
5. **主动提供建议**：如果看到用户有面试快到了但没有准备记录，可以友好提醒。
6. **一次可以多步**：如果需要，你可以连续调用多个工具。比如用户说"字节进面试了，顺便看看我现在总共投了多少家"，你应该先 update 再 get_statistics。

## 回复风格
- 简短、口语化、用中文
- 写操作完成后，简要概括做了什么："好的，已帮你把字节跳动·后端开发更新到面试阶段。"
- 查询结果用自然语言总结，数据多时可以分条列出
- 不要输出 markdown 代码块，不要展示原始 JSON`;
}

const STAGE_LABELS: Record<MainStage, string> = {
  applied: '已投递',
  written_test: '笔试',
  interviewing: '面试中',
  result: '有结果',
};

/**
 * A short state summary appended after the system prompt so the LLM has a
 * rough picture of the user's data before calling any tools — cuts down on
 * reflexive search_applications/get_statistics calls for simple questions.
 */
export function buildContextSuffix(applications: JobApplication[]): string {
  if (applications.length === 0) {
    return '\n\n[当前状态] 用户还没有任何投递记录。';
  }

  const total = applications.length;
  const byStage: Record<MainStage, number> = { applied: 0, written_test: 0, interviewing: 0, result: 0 };
  for (const app of applications) {
    byStage[app.mainStage] += 1;
  }

  const now = Date.now();
  const upcoming = applications
    .filter((a) => a.nextActionDate && new Date(a.nextActionDate).getTime() > now)
    .sort((a, b) => a.nextActionDate!.localeCompare(b.nextActionDate!))
    .slice(0, 3);

  let suffix = `\n\n[当前状态] 用户共有 ${total} 条投递记录：${STAGE_LABELS.applied} ${byStage.applied}、${STAGE_LABELS.written_test} ${byStage.written_test}、${STAGE_LABELS.interviewing} ${byStage.interviewing}、${STAGE_LABELS.result} ${byStage.result}。`;

  if (upcoming.length > 0) {
    suffix += `\n最近的安排：${upcoming.map((a) => `${a.company}·${a.position} ${a.nextActionDate}`).join('，')}。`;
  }

  return suffix;
}
