'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ConfirmationCard } from './confirmation-card';
import type { PendingConfirmation } from '@/lib/agent/match-application';

export interface AgentMessage {
  id: string;
  role: 'user' | 'assistant';
  kind: 'text' | 'confirmation' | 'error';
  content: string;
  confirmation?: PendingConfirmation;
  applicationId?: string;
}

interface ChatMessageProps {
  message: AgentMessage;
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
  onOpenApplication?: (jobApplicationId: string) => void;
}

export function ChatMessage({ message, onConfirm, onCancel, onOpenApplication }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
          isUser ? 'bg-primary text-primary-foreground' : 'bg-muted',
          message.kind === 'error' && 'bg-destructive/10 text-destructive'
        )}
      >
        {message.kind === 'confirmation' && message.confirmation ? (
          <ConfirmationCard
            confirmation={message.confirmation}
            onConfirm={() => onConfirm(message.id)}
            onCancel={() => onCancel(message.id)}
          />
        ) : (
          <p className="whitespace-pre-wrap">{message.content}</p>
        )}

        {message.applicationId && onOpenApplication && (
          <Button
            type="button"
            variant="link"
            size="sm"
            className="h-auto px-0 text-inherit underline"
            onClick={() => onOpenApplication(message.applicationId!)}
          >
            查看岗位详情
          </Button>
        )}
      </div>
    </div>
  );
}
