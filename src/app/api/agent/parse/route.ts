import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { moonshot, MOONSHOT_MODEL } from '@/lib/llm/moonshot-client';
import { buildExtractionMessages, parseExtractionResponse, type HistoryTurn } from '@/lib/llm/extract-job-update';

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

  if (!message) {
    return NextResponse.json({ error: '消息不能为空' }, { status: 400 });
  }

  try {
    const completion = await moonshot.chat.completions.create({
      model: MOONSHOT_MODEL,
      messages: buildExtractionMessages(message, history),
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    return NextResponse.json(parseExtractionResponse(raw));
  } catch (error) {
    console.error('Moonshot extraction failed', error);
    const detail = error instanceof OpenAI.APIError ? error.message : '请求大模型接口失败';
    return NextResponse.json({ error: `解析失败：${detail}` }, { status: 502 });
  }
}
