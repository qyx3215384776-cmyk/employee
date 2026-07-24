'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { stageLabel } from '@/lib/db/job-application-repo';
import type { JobApplication } from '@/types';

export interface InterviewTipFormValues {
  jobApplicationId: string;
  timelineEntryId?: string;
  content: string;
  tags: string[];
}

interface InterviewTipFormProps {
  applications: JobApplication[];
  initialValues: InterviewTipFormValues;
  isEditing: boolean;
  onSubmit: (values: InterviewTipFormValues) => Promise<void> | void;
  onCancel: () => void;
}

export function InterviewTipForm({
  applications,
  initialValues,
  isEditing,
  onSubmit,
  onCancel,
}: InterviewTipFormProps) {
  const [jobApplicationId, setJobApplicationId] = useState(initialValues.jobApplicationId);
  const [content, setContent] = useState(initialValues.content);
  const [tagsInput, setTagsInput] = useState(initialValues.tags.join(', '));
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!jobApplicationId || !content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit({
        jobApplicationId,
        timelineEntryId: initialValues.timelineEntryId,
        content: content.trim(),
        tags: tagsInput
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '编辑复盘' : '新增复盘'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tip-application">关联岗位</Label>
            <Select
              items={applications.map((app) => ({
                value: app.id,
                label: `${app.company} · ${app.position}（${stageLabel(app)}）`,
              }))}
              value={jobApplicationId}
              onValueChange={(value) => setJobApplicationId(value ?? '')}
            >
              <SelectTrigger id="tip-application" className="w-full">
                <SelectValue placeholder="选择岗位" />
              </SelectTrigger>
              <SelectContent>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.company} · {app.position}（{stageLabel(app)}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tip-content">复盘内容</Label>
            <Textarea
              id="tip-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="记录这场面试问了什么、表现如何、下次可以怎么改进…"
              rows={6}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tip-tags">标签</Label>
            <Input
              id="tip-tags"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="如：行为面, 技术面（用逗号分隔）"
            />
          </div>

          <div className="flex gap-2">
            <Button type="submit" disabled={submitting || !jobApplicationId}>
              {isEditing ? '保存' : '新增'}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              取消
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
