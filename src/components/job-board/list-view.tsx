'use client';

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
import { stageLabel } from '@/lib/db/job-application-repo';
import { formatDateTime } from '@/lib/format';
import type { JobApplication } from '@/types';

interface ListViewProps {
  applications: JobApplication[];
  onSelect: (application: JobApplication) => void;
}

export function ListView({ applications, onSelect }: ListViewProps) {
  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        没有符合条件的岗位记录。
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
            <TableRow key={app.id}>
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
                <Button variant="ghost" size="sm" onClick={() => onSelect(app)}>
                  详情
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
