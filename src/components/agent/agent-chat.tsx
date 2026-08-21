'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ChatMessage, type AgentMessage } from './chat-message';
import { NewApplicationDialog } from '@/components/job-board/new-application-dialog';
import type { PendingConfirmation } from '@/lib/agent/match-application';
import type { PendingAction } from '@/lib/agent/tool-executor';
import type { HistoryTurn } from '@/lib/llm/extract-job-update';
import {
  createJobApplication,
  listJobApplications,
  stageLabel,
  updateJobApplication,
} from '@/lib/db/job-application-repo';
import { formatDateTime } from '@/lib/format';
import { useAppMode } from '@/lib/mode-context';
import type { JobApplication, MainStage, ResultType } from '@/types';

function actionToPendingConfirmation(
  action: PendingAction,
  applications: JobApplication[]
): PendingConfirmation | null {
  if (action.type === 'create') {
    if (!action.company || !action.position) return null;
    const stage = (action.mainStage as MainStage | undefined) ?? 'applied';
    return {
      status: 'pending',
      mode: 'create',
      company: action.company,
      position: action.position,
      mainStage: stage,
      subStage: stage === 'interviewing' ? action.subStage : undefined,
      resultType: stage === 'result' ? (action.resultType as ResultType | undefined) : undefined,
      appliedDate: new Date().toISOString().slice(0, 10),
      nextActionDate: action.nextActionDate,
      source: action.source,
    };
  }

  const existing = applications.find((app) => app.id === action.applicationId);
  if (!existing) return null;

  const stage = (action.mainStage as MainStage | undefined) ?? existing.mainStage;
  return {
    status: 'pending',
    mode: 'update',
    jobApplicationId: existing.id,
    company: existing.company,
    position: existing.position,
    mainStage: stage,
    subStage: stage === 'interviewing' ? (action.subStage ?? existing.subStage) : undefined,
    resultType: stage === 'result' ? ((action.resultType as ResultType | undefined) ?? existing.resultType) : undefined,
    appliedDate: existing.appliedDate,
    nextActionDate: action.nextActionDate ?? existing.nextActionDate,
    source: action.source ?? existing.source,
  };
}

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
        .slice(-10)
        .map((m) => ({ role: m.role, content: m.content }));

      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history, applications }),
      });
      const data = await res.json();

      if (!res.ok) {
        pushMessage({ role: 'assistant', kind: 'error', content: data.error ?? '处理失败，请稍后重试。' });
        return;
      }

      if (data.reply) {
        pushMessage({ role: 'assistant', kind: 'text', content: data.reply });
      }

      for (const action of (data.pendingActions ?? []) as PendingAction[]) {
        const confirmation = actionToPendingConfirmation(action, applications);
        if (!confirmation) continue;
        pushMessage({ role: 'assistant', kind: 'confirmation', content: '请确认以下操作：', confirmation });
      }
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
            <p className="mb-2 font-medium text-foreground">试试这样说：</p>
            <p>&ldquo;我投了字节跳动的后端开发岗&rdquo;</p>
            <p>&ldquo;腾讯那个进笔试了，7月28号考&rdquo;</p>
            <p>&ldquo;我现在总共投了多少家？&rdquo;</p>
            <p>&ldquo;这周有什么面试安排？&rdquo;</p>
            <p>&ldquo;帮我看看美团现在到哪一步了&rdquo;</p>
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
