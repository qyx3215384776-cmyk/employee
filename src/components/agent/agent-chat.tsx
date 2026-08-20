'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, type AgentMessage } from './chat-message';
import { NewApplicationDialog } from '@/components/job-board/new-application-dialog';
import { matchApplication, buildPendingConfirmation } from '@/lib/agent/match-application';
import type { ExtractedFields, HistoryTurn } from '@/lib/llm/extract-job-update';
import {
  createJobApplication,
  listJobApplications,
  stageLabel,
  updateJobApplication,
} from '@/lib/db/job-application-repo';
import { formatDateTime } from '@/lib/format';
import { useAppMode } from '@/lib/mode-context';
import type { JobApplication } from '@/types';

interface AgentChatProps {
  onOpenApplication?: (jobApplicationId: string) => void;
}

const DEMO_SCRIPT: AgentMessage[] = [
  {
    id: 'demo-msg-1',
    role: 'user',
    kind: 'text',
    content: '我投了字节跳动的前端开发岗，是同学内推的',
  },
  {
    id: 'demo-msg-2',
    role: 'assistant',
    kind: 'text',
    content: '好的，已记录：字节跳动 · 前端开发工程师 · 已投递 · 来源：内推 ✅',
  },
  {
    id: 'demo-msg-3',
    role: 'user',
    kind: 'text',
    content: '字节那个进面试了，明天下午 3:30 二面',
  },
  {
    id: 'demo-msg-4',
    role: 'assistant',
    kind: 'text',
    content: '已更新：字节跳动 · 前端开发工程师 → 面试中·二面，明天 15:30。加油！💪',
    applicationId: 'demo-06',
  },
  {
    id: 'demo-msg-5',
    role: 'user',
    kind: 'text',
    content: '我现在总共投了多少家？',
  },
  {
    id: 'demo-msg-6',
    role: 'assistant',
    kind: 'text',
    content: '你目前一共投了 15 家公司：3 家还在简历筛选、2 家进了笔试、4 家在面试中、已拿到 2 个 offer。整体转化率不错，继续保持！',
  },
];

export function AgentChat({ onOpenApplication }: AgentChatProps) {
  const { mode, ready } = useAppMode();
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    listJobApplications().then((result) => {
      if (!cancelled) setApplications(result);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, ready]);

  useEffect(() => {
    // Demo mode ships a canned conversation so a new visitor sees how the
    // Agent works without having to type anything; switching to personal
    // mode clears it since those messages reference demo-only records.
    if (!ready) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages(mode === 'demo' ? DEMO_SCRIPT : []);
  }, [mode, ready]);

  useEffect(() => {
    listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function refreshApplications() {
    setApplications(await listJobApplications());
  }

  function pushMessage(message: Omit<AgentMessage, 'id'>) {
    const id = crypto.randomUUID();
    setMessages((prev) => [...prev, { ...message, id }]);
    return id;
  }

  function updateConfirmation(messageId: string, patch: Partial<NonNullable<AgentMessage['confirmation']>>) {
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId && m.confirmation ? { ...m, confirmation: { ...m.confirmation, ...patch } } : m))
    );
  }

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    pushMessage({ role: 'user', kind: 'text', content: text });
    setSending(true);

    try {
      const history: HistoryTurn[] = messages
        .filter((m) => m.kind === 'text')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/agent/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history }),
      });
      const data = await res.json();

      if (!res.ok) {
        pushMessage({ role: 'assistant', kind: 'error', content: data.error ?? '解析失败，请稍后重试。' });
        return;
      }

      const extracted = data as ExtractedFields;
      if (!extracted.company) {
        pushMessage({ role: 'assistant', kind: 'text', content: '能告诉我是哪家公司吗？' });
        return;
      }
      if (extracted.needsClarification) {
        pushMessage({
          role: 'assistant',
          kind: 'text',
          content: extracted.clarificationQuestion ?? '能再说清楚一点吗？',
        });
        return;
      }

      const match = matchApplication(extracted, applications);
      if (match.kind === 'clarify') {
        pushMessage({ role: 'assistant', kind: 'text', content: match.question });
        return;
      }

      const confirmation = buildPendingConfirmation(match);
      if (!confirmation) {
        pushMessage({ role: 'assistant', kind: 'error', content: '解析结果有误，请换个说法再试一次。' });
        return;
      }

      pushMessage({ role: 'assistant', kind: 'confirmation', content: '请确认以下信息：', confirmation });
    } catch {
      pushMessage({ role: 'assistant', kind: 'error', content: '网络请求失败，请稍后重试。' });
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm(messageId: string) {
    const message = messages.find((m) => m.id === messageId);
    const c = message?.confirmation;
    if (!c || c.status !== 'pending') return;

    updateConfirmation(messageId, { status: 'confirming' });

    try {
      const saved =
        c.mode === 'create'
          ? await createJobApplication({
              company: c.company,
              position: c.position,
              mainStage: c.mainStage,
              subStage: c.subStage,
              resultType: c.resultType,
              appliedDate: c.appliedDate,
              nextActionDate: c.nextActionDate,
              source: c.source,
            })
          : await updateJobApplication(c.jobApplicationId!, {
              mainStage: c.mainStage,
              subStage: c.subStage,
              resultType: c.resultType,
              nextActionDate: c.nextActionDate,
              source: c.source,
            });

      updateConfirmation(messageId, { status: 'confirmed' });
      await refreshApplications();
      pushMessage({
        role: 'assistant',
        kind: 'text',
        content: `已${c.mode === 'create' ? '新增' : '更新'}：${saved.company} · ${saved.position} · ${stageLabel(saved)}${
          saved.nextActionDate ? ` · ${formatDateTime(saved.nextActionDate)}` : ''
        }`,
        applicationId: saved.id,
      });
    } catch {
      updateConfirmation(messageId, { status: 'error' });
    }
  }

  function handleCancel(messageId: string) {
    updateConfirmation(messageId, { status: 'cancelled' });
    pushMessage({ role: 'assistant', kind: 'text', content: '好的，已取消。' });
  }

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[420px] flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">和 Agent 对话来记录投递进度，写入前都会先给你看确认卡片。</p>
        <Button type="button" variant="outline" size="sm" onClick={() => setManualDialogOpen(true)}>
          手动新增岗位
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-lg border p-4">
        {messages.length === 0 ? (
          <div className="m-auto max-w-sm text-center text-sm text-muted-foreground">
            试试输入，比如&ldquo;我投了字节跳动的后端开发岗&rdquo;，或者&ldquo;腾讯那个进笔试了，7月28号&rdquo;。
          </div>
        ) : (
          messages.map((m) => (
            <ChatMessage
              key={m.id}
              message={m}
              onConfirm={handleConfirm}
              onCancel={handleCancel}
              onOpenApplication={onOpenApplication}
            />
          ))
        )}
        <div ref={listEndRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="试试输入：我投了字节跳动的后端开发岗"
          rows={2}
          className="flex-1 resize-none"
          disabled={sending}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          发送
        </Button>
      </form>

      <NewApplicationDialog open={manualDialogOpen} onOpenChange={setManualDialogOpen} onCreated={refreshApplications} />
    </div>
  );
}
