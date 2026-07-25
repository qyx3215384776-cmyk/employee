import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface ExtractedFields {
  company: string | null;
  position: string | null;
  mainStage: 'applied' | 'written_test' | 'interviewing' | 'result' | null;
  subStage: string | null;
  resultType: 'offer' | 'rejected' | 'withdrawn' | null;
  eventDate: string | null;
  source: string | null;
  needsClarification: boolean;
  clarificationQuestion: string | null;
}

export interface HistoryTurn {
  role: 'user' | 'assistant';
  content: string;
}

const VALID_STAGES = ['applied', 'written_test', 'interviewing', 'result'];
const VALID_RESULTS = ['offer', 'rejected', 'withdrawn'];

const FALLBACK_RESPONSE: ExtractedFields = {
  company: null,
  position: null,
  mainStage: null,
  subStage: null,
  resultType: null,
  eventDate: null,
  source: null,
  needsClarification: true,
  clarificationQuestion: '没太理解，能换个说法告诉我公司和岗位吗？',
};

function buildSystemPrompt(referenceDateIso: string): string {
  return `你是一个帮用户记录秋招投递进度的助手。用户会用自然语言描述一次投递或进度更新，你需要从中提取结构化信息。

当前日期时间：${referenceDateIso}（东八区）。用于解析"下周三""明天""7月28号"这类日期表达，输出的日期必须换算成具体的 ISO 8601 格式，带 +08:00 时区。
举例：如果当前日期是 2026-07-24（星期五），用户说"下周三下午3点"，下周三是 2026-07-29，应输出 "2026-07-29T15:00:00+08:00"。

你看不到用户之前投递过哪些岗位/公司，绝对不能凭常见公司名或常见岗位名"猜"一个出来填空。

只输出一个 JSON 对象，不要有任何其他文字，不要用 markdown 代码块包裹。字段：
- company: string | null，公司名称原文
- companyMentioned: boolean，这条消息里是否明确提到了公司名称
- position: string | null，岗位名称原文
- positionMentioned: boolean，这条消息里是否明确提到了具体岗位名称（用"那个""之前投的"这种指代 = 没有明确提到，算 false）。**这个字段必须如实反映消息内容，即使你能大致猜到可能是什么岗位，只要消息本身没有明确说出岗位名称，就必须是 false，此时 position 也必须同时是 null，不允许自己编一个岗位名（哪怕是"产品经理"这类听起来很合理的猜测也不行）。**
- mainStage: "applied" | "written_test" | "interviewing" | "result" | null
  - applied：投递/简历筛选阶段
  - written_test：笔试阶段
  - interviewing：面试阶段（一面/二面/三面/HR面都算这个大类）
  - result：已经有明确结果（offer/被拒/主动放弃）
  - 如果消息里看不出阶段变化，设为 null
- subStage: string | null，仅当 mainStage 是 "interviewing" 时有意义，表示接下来/当前是第几轮，如"二面""三面""HR面"
- resultType: "offer" | "rejected" | "withdrawn" | null，仅当 mainStage 是 "result" 时有意义
- eventDate: string | null，如果提到了具体的下一次笔试/面试时间就输出 ISO 8601 datetime，没提到具体时间就是 null
- source: string | null，投递渠道，如"内推""官网"，没提到就是 null
- needsClarification: boolean，如果消息完全没提到公司、或意图完全无法理解，设为 true
- clarificationQuestion: string | null，仅当 needsClarification 为 true 时，给出一句简短口语化的反问

例子：

输入："我投了腾讯的产品经理"
输出：{"company":"腾讯","companyMentioned":true,"position":"产品经理","positionMentioned":true,"mainStage":"applied","subStage":null,"resultType":null,"eventDate":null,"source":null,"needsClarification":false,"clarificationQuestion":null}

输入："腾讯那个进笔试了，7月28号"（没提岗位名）
输出：{"company":"腾讯","companyMentioned":true,"position":null,"positionMentioned":false,"mainStage":"written_test","subStage":null,"resultType":null,"eventDate":"2026-07-28T00:00:00+08:00","source":null,"needsClarification":false,"clarificationQuestion":null}

输入："腾讯那个二面通过了"（没提岗位名，position 必须是 null，不能编一个）
输出：{"company":"腾讯","companyMentioned":true,"position":null,"positionMentioned":false,"mainStage":"interviewing","subStage":"二面","resultType":null,"eventDate":null,"source":null,"needsClarification":false,"clarificationQuestion":null}

输入："字节二面通过了，下周三下午3点三面"（没提岗位名）
输出：{"company":"字节跳动","companyMentioned":true,"position":null,"positionMentioned":false,"mainStage":"interviewing","subStage":"三面","resultType":null,"eventDate":"<按上面举例的方式换算出的 ISO 时间>","source":null,"needsClarification":false,"clarificationQuestion":null}

输入："美团给我发offer了"
输出：{"company":"美团","companyMentioned":true,"position":null,"positionMentioned":false,"mainStage":"result","subStage":null,"resultType":"offer","eventDate":null,"source":null,"needsClarification":false,"clarificationQuestion":null}

输入："在吗"
输出：{"company":null,"companyMentioned":false,"position":null,"positionMentioned":false,"mainStage":null,"subStage":null,"resultType":null,"eventDate":null,"source":null,"needsClarification":true,"clarificationQuestion":"想记录哪家公司的投递进展呀？可以说说公司和岗位～"}

只输出 JSON，不要输出其他任何内容。`;
}

export function buildExtractionMessages(message: string, history: HistoryTurn[]): ChatCompletionMessageParam[] {
  const referenceDateIso = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }).replace(' ', 'T') + '+08:00';

  return [
    { role: 'system', content: buildSystemPrompt(referenceDateIso) },
    ...history.slice(-6).map((turn) => ({ role: turn.role, content: turn.content }) as ChatCompletionMessageParam),
    { role: 'user', content: message },
  ];
}

function isValidIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function nonEmptyString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

export function parseExtractionResponse(raw: string): ExtractedFields {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return FALLBACK_RESPONSE;
  }

  const mainStage = VALID_STAGES.includes(parsed.mainStage as string)
    ? (parsed.mainStage as ExtractedFields['mainStage'])
    : null;
  const resultType = VALID_RESULTS.includes(parsed.resultType as string)
    ? (parsed.resultType as ExtractedFields['resultType'])
    : null;

  // Cross-check against the model's own explicit mentioned/not-mentioned judgment
  // rather than trusting the free-text field alone — models are much more
  // reliable at this boolean call than at reliably emitting null instead of a
  // plausible-looking guess for an open string field.
  const company = Boolean(parsed.companyMentioned) ? nonEmptyString(parsed.company) : null;
  const position = Boolean(parsed.positionMentioned) ? nonEmptyString(parsed.position) : null;

  return {
    company,
    position,
    mainStage,
    subStage: nonEmptyString(parsed.subStage),
    resultType,
    eventDate: isValidIsoDate(parsed.eventDate) ? (parsed.eventDate as string) : null,
    source: nonEmptyString(parsed.source),
    needsClarification: Boolean(parsed.needsClarification),
    clarificationQuestion: nonEmptyString(parsed.clarificationQuestion),
  };
}
