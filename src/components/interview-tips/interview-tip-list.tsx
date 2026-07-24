'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/format';
import type { InterviewTipWithApplication } from '@/lib/db/interview-tip-repo';

interface InterviewTipListProps {
  tips: InterviewTipWithApplication[];
  onEdit: (tip: InterviewTipWithApplication) => void;
  onDelete: (id: string) => void;
}

export function InterviewTipList({ tips, onEdit, onDelete }: InterviewTipListProps) {
  if (tips.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        没有符合条件的复盘记录。
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {tips.map((tip) => (
        <li key={tip.id} className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <span className="font-medium">{tip.company}</span>
              <span className="text-muted-foreground"> · {tip.position}</span>
            </div>
            <span className="text-xs text-muted-foreground">{formatDateTime(tip.createdAt)}</span>
          </div>

          {tip.tags && tip.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tip.tags.map((tag) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <p className="whitespace-pre-wrap text-sm">{tip.content}</p>

          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onEdit(tip)}>
              编辑
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onDelete(tip.id)}>
              删除
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
