import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { moonshot, MOONSHOT_MODEL } from '@/lib/llm/moonshot-client';
import { agentTools } from '@/lib/agent/tool-definitions';
import { executeToolCall, type PendingAction, type ToolExecutorContext } from '@/lib/agent/tool-executor';
import { buildAgentSystemPrompt, buildContextSuffix } from '@/lib/agent/system-prompt';
import type { HistoryTurn } from '@/lib/llm/extract-job-update';
import type { JobApplication } from '@/types';

export const maxDuration = 30;

const MAX_ITERATIONS = 6;

interface AgentResult {
  reply: string;
  pendingActions: PendingAction[];
  toolCalls: { name: string; args: unknown; result: string }[];
}

async function runAgentLoop(messages: ChatCompletionMessageParam[], ctx: ToolExecutorContext): Promise<AgentResult> {
  const toolCalls: AgentResult['toolCalls'] = [];

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const completion = await moonshot.chat.completions.create({
      model: MOONSHOT_MODEL,
      messages,
      tools: agentTools,
      tool_choice: 'auto',
      max_tokens: 1024,
    });

    const message = completion.choices[0]?.message;
    if (!message) break;

    if (message.tool_calls && message.tool_calls.length > 0) {
      messages.push(message);

      for (const toolCall of message.tool_calls) {
        if (toolCall.type !== 'function') continue;

        let args: Record<string, unknown>;
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch {
          args = {};
        }

        const result = executeToolCall(toolCall.function.name, args, ctx);
        toolCalls.push({ name: toolCall.function.name, args, result });

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: result,
        });
      }

      continue;
    }

    return {
      reply: message.content ?? '',
      pendingActions: ctx.pendingActions,
      toolCalls,
    };
  }

  return {
    reply: '处理超时了，请换个说法再试一次。',
    pendingActions: ctx.pendingActions,
    toolCalls,
  };
}

export async function POST(request: Request) {
  if (!process.env.MOONSHOT_API_KEY) {
    return NextResponse.json(
      { error: '服务端未配置 MOONSHOT_API_KEY，请在 .env.local 中设置后重启开发服务器。' },
      { status: 500 }
    );
  }

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === 'string' ? body.message.trim() : '';
  const history: HistoryTurn[] = Array.isArray(body?.history)
    ? body.history.filter(
        (turn: unknown): turn is HistoryTurn =>
          typeof turn === 'object' &&
          turn !== null &&
          ('role' in turn ? (turn as HistoryTurn).role === 'user' || (turn as HistoryTurn).role === 'assistant' : false) &&
          typeof (turn as HistoryTurn).content === 'string'
      )
    : [];
  const applications: JobApplication[] = Array.isArray(body?.applications) ? body.applications : [];

  if (!message) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
  }

  const currentDateIso = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T') + '+08:00';
  const systemPrompt = buildAgentSystemPrompt(currentDateIso) + buildContextSuffix(applications);

  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.slice(-10).map((turn) => ({ role: turn.role, content: turn.content }) as ChatCompletionMessageParam),
    { role: 'user', content: message },
  ];

  const ctx: ToolExecutorContext = { applications, pendingActions: [], currentDateIso };

  try {
    const result = await runAgentLoop(messages, ctx);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Agent loop failed', error);
    const detail = error instanceof OpenAI.APIError ? error.message : '请求大模型接口失败';
    return NextResponse.json({ error: `处理失败：${detail}` }, { status: 502 });
  }
}
