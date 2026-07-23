'use client';

import { Fragment, useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { listTimelineEntries, stageLabel } from '@/lib/db/job-application-repo';
import type { JobApplication, TimelineEntry } from '@/types';

interface JobApplicationListProps {
  applications: JobApplication[];
  onEdit: (app: JobApplication) => void;
  onDelete: (id: string) => void;
}

function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TimelinePanel({ jobApplicationId }: { jobApplicationId: string }) {
  const [entries, setEntries] = useState<TimelineEntry[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    listTimelineEntries(jobApplicationId).then((result) => {
      if (!cancelled) setEntries(result);
    });
    return () => {
      cancelled = true;
    };
  }, [jobApplicationId]);

  if (entries === null) {
    return <div className="p-4 text-sm text-muted-foreground">加载时间线…</div>;
  }

  if (entries.length === 0) {
    return <div className="p-4 text-sm text-muted-foreground">暂无时间线记录</div>;
  }

  return (
    <ul className="flex flex-col gap-2 p-4">
      {entries.map((entry) => (
        <li key={entry.id} className="text-sm">
          <span className="text-muted-foreground">{formatDateTime(entry.eventDate)}</span>{' '}
          {entry.fromStage && entry.toStage ? (
            <span>
              {entry.fromStage} → {entry.toStage}
            </span>
          ) : entry.toStage ? (
            <span>{entry.toStage}</span>
          ) : null}
          {entry.note && <span className="text-muted-foreground">（{entry.note}）</span>}
        </li>
      ))}
    </ul>
  );
}

export function JobApplicationList({ applications, onEdit, onDelete }: JobApplicationListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        还没有岗位记录，先用上面的表单新增一条吧。
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>公司 / 岗位</TableHead>
            <TableHead>阶段</TableHead>
            <TableHead>下一步日期</TableHead>
            <TableHead>最近更新</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app) => (
            <Fragment key={app.id}>
              <TableRow>
                <TableCell>
                  <div className="font-medium">{app.company}</div>
                  <div className="text-sm text-muted-foreground">{app.position}</div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{stageLabel(app)}</Badge>
                </TableCell>
                <TableCell>{formatDateTime(app.nextActionDate)}</TableCell>
                <TableCell>{formatDateTime(app.updatedAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === app.id ? null : app.id)}
                    >
                      {expandedId === app.id ? '收起' : '时间线'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onEdit(app)}>
                      编辑
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => onDelete(app.id)}>
                      删除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              {expandedId === app.id && (
                <TableRow>
                  <TableCell colSpan={5} className="bg-muted/30 p-0">
                    <TimelinePanel jobApplicationId={app.id} />
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
