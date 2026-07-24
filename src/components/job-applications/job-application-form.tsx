'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { JobApplication, MainStage, ResultType } from '@/types';

export const MAIN_STAGE_OPTIONS: { value: MainStage; label: string }[] = [
  { value: 'applied', label: '已投递' },
  { value: 'written_test', label: '笔试中' },
  { value: 'interviewing', label: '面试中' },
  { value: 'result', label: '结果' },
];

const RESULT_TYPE_OPTIONS: { value: ResultType; label: string }[] = [
  { value: 'offer', label: 'Offer' },
  { value: 'rejected', label: '未通过' },
  { value: 'withdrawn', label: '已婉拒' },
];

export interface JobApplicationFormValues {
  company: string;
  position: string;
  mainStage: MainStage;
  subStage?: string;
  resultType?: ResultType;
  appliedDate: string;
  nextActionDate?: string;
  source?: string;
}

interface JobApplicationFormProps {
  initial?: JobApplication | null;
  onSubmit: (values: JobApplicationFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

function todayDateValue(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function emptyValues(): JobApplicationFormValues {
  return {
    company: '',
    position: '',
    mainStage: 'applied',
    subStage: '',
    resultType: undefined,
    appliedDate: todayDateValue(),
    nextActionDate: '',
    source: '',
  };
}

function valuesFromApplication(app: JobApplication): JobApplicationFormValues {
  return {
    company: app.company,
    position: app.position,
    mainStage: app.mainStage,
    subStage: app.subStage ?? '',
    resultType: app.resultType,
    appliedDate: app.appliedDate.slice(0, 10),
    nextActionDate: toDatetimeLocalValue(app.nextActionDate),
    source: app.source ?? '',
  };
}

export function JobApplicationForm({ initial, onSubmit, onCancel }: JobApplicationFormProps) {
  const [values, setValues] = useState<JobApplicationFormValues>(() =>
    initial ? valuesFromApplication(initial) : emptyValues()
  );
  const [submitting, setSubmitting] = useState(false);

  const isEditing = Boolean(initial);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.company.trim() || !values.position.trim() || !values.appliedDate) {
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        ...values,
        subStage: values.mainStage === 'interviewing' ? values.subStage?.trim() || undefined : undefined,
        resultType: values.mainStage === 'result' ? values.resultType : undefined,
        nextActionDate: values.nextActionDate
          ? new Date(values.nextActionDate).toISOString()
          : undefined,
        source: values.source?.trim() || undefined,
      });
      if (!isEditing) {
        setValues(emptyValues());
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? '编辑岗位' : '新增岗位'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="company">公司</Label>
            <Input
              id="company"
              value={values.company}
              onChange={(e) => setValues((v) => ({ ...v, company: e.target.value }))}
              placeholder="如：字节跳动"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="position">岗位</Label>
            <Input
              id="position"
              value={values.position}
              onChange={(e) => setValues((v) => ({ ...v, position: e.target.value }))}
              placeholder="如：后端开发"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="mainStage">阶段</Label>
            <Select
              items={MAIN_STAGE_OPTIONS}
              value={values.mainStage}
              onValueChange={(value) =>
                setValues((v) => ({ ...v, mainStage: value as MainStage }))
              }
            >
              <SelectTrigger id="mainStage" className="w-full">
                <SelectValue placeholder="选择阶段" />
              </SelectTrigger>
              <SelectContent>
                {MAIN_STAGE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {values.mainStage === 'interviewing' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="subStage">细分阶段</Label>
              <Input
                id="subStage"
                value={values.subStage}
                onChange={(e) => setValues((v) => ({ ...v, subStage: e.target.value }))}
                placeholder="如：二面 / HR面"
              />
            </div>
          )}

          {values.mainStage === 'result' && (
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="resultType">结果</Label>
              <Select
                items={RESULT_TYPE_OPTIONS}
                value={values.resultType}
                onValueChange={(value) =>
                  setValues((v) => ({ ...v, resultType: value as ResultType }))
                }
              >
                <SelectTrigger id="resultType" className="w-full">
                  <SelectValue placeholder="选择结果" />
                </SelectTrigger>
                <SelectContent>
                  {RESULT_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="appliedDate">投递日期</Label>
            <Input
              id="appliedDate"
              type="date"
              value={values.appliedDate}
              onChange={(e) => setValues((v) => ({ ...v, appliedDate: e.target.value }))}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nextActionDate">下一步日期时间</Label>
            <Input
              id="nextActionDate"
              type="datetime-local"
              value={values.nextActionDate}
              onChange={(e) => setValues((v) => ({ ...v, nextActionDate: e.target.value }))}
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <Label htmlFor="source">投递渠道</Label>
            <Input
              id="source"
              value={values.source}
              onChange={(e) => setValues((v) => ({ ...v, source: e.target.value }))}
              placeholder="如：官网内推"
            />
          </div>

          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {isEditing ? '保存' : '新增'}
            </Button>
            {isEditing && onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                取消
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
