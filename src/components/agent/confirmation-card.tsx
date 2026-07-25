'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, formatDateTime } from '@/lib/format';
import { stageLabel } from '@/lib/db/job-application-repo';
import type { PendingConfirmation } from '@/lib/agent/match-application';

interface ConfirmationCardProps {
  confirmation: PendingConfirmation;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmationCard({ confirmation: c, onConfirm, onCancel }: ConfirmationCardProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="font-medium">
        {c.mode === 'create' ? '新增岗位' : '更新岗位'}：{c.company} · {c.position}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">{stageLabel(c)}</Badge>
        {c.nextActionDate && <Badge variant="outline">{formatDateTime(c.nextActionDate)}</Badge>}
      </div>
      {c.mode === 'create' && (
        <div className="text-xs text-muted-foreground">投递日期 {formatDate(c.appliedDate)}</div>
      )}

      {c.status === 'pending' && (
        <div className="flex gap-2 pt-1">
          <Button type="button" size="sm" onClick={onConfirm}>
            确认
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={onCancel}>
            取消
          </Button>
        </div>
      )}
      {c.status === 'confirming' && <div className="text-xs text-muted-foreground">保存中…</div>}
      {c.status === 'cancelled' && <div className="text-xs text-muted-foreground">已取消</div>}
      {c.status === 'error' && <div className="text-xs text-destructive">保存失败，请重试</div>}
    </div>
  );
}
