'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InterviewTipForm, type InterviewTipFormValues } from './interview-tip-form';
import { InterviewTipList } from './interview-tip-list';
import {
  createInterviewTip,
  deleteInterviewTip,
  listAllInterviewTips,
  updateInterviewTip,
  type InterviewTipWithApplication,
} from '@/lib/db/interview-tip-repo';
import { listJobApplications } from '@/lib/db/job-application-repo';
import { useAppMode } from '@/lib/mode-context';
import type { JobApplication } from '@/types';

interface PendingNewTip {
  jobApplicationId: string;
  timelineEntryId?: string;
}

interface InterviewTipsProps {
  pendingNewTip?: PendingNewTip | null;
  onPendingNewTipHandled?: () => void;
}

export function InterviewTips({ pendingNewTip, onPendingNewTipHandled }: InterviewTipsProps = {}) {
  const { mode, ready } = useAppMode();
  const [tips, setTips] = useState<InterviewTipWithApplication[]>([]);
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [editingTip, setEditingTip] = useState<InterviewTipWithApplication | null>(null);
  const [creatingPrefill, setCreatingPrefill] = useState<PendingNewTip | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function refresh() {
    const [tipsResult, appsResult] = await Promise.all([listAllInterviewTips(), listJobApplications()]);
    setTips(tipsResult);
    setApplications(appsResult);
  }

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    Promise.all([listAllInterviewTips(), listJobApplications()]).then(([tipsResult, appsResult]) => {
      if (cancelled) return;
      setTips(tipsResult);
      setApplications(appsResult);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [mode, ready]);

  useEffect(() => {
    if (!pendingNewTip || !loaded) return;
    // Reacts to an external "start a new tip" command from Tab2/Tab3 (see
    // AppTabs) — not deriving state from props, so there's no render-time
    // equivalent for opening the form here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditingTip(null);
    setCreatingPrefill(pendingNewTip);
    setFormOpen(true);
    onPendingNewTipHandled?.();
  }, [pendingNewTip, loaded, onPendingNewTipHandled]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const tip of tips) {
      for (const tag of tip.tags ?? []) tagSet.add(tag);
    }
    return Array.from(tagSet).sort();
  }, [tips]);

  const filteredTips = useMemo(() => {
    const term = search.trim().toLowerCase();
    return tips.filter((tip) => {
      const matchesSearch = term.length === 0 || tip.company.toLowerCase().includes(term);
      const matchesTag = tagFilter === 'all' || (tip.tags ?? []).includes(tagFilter);
      return matchesSearch && matchesTag;
    });
  }, [tips, search, tagFilter]);

  function openCreateForm() {
    setEditingTip(null);
    setCreatingPrefill(null);
    setFormOpen(true);
  }

  function openEditForm(tip: InterviewTipWithApplication) {
    setEditingTip(tip);
    setCreatingPrefill(null);
    setFormOpen(true);
  }

  async function handleSubmit(values: InterviewTipFormValues) {
    if (editingTip) {
      await updateInterviewTip(editingTip.id, values);
    } else {
      await createInterviewTip(values);
    }
    setFormOpen(false);
    setEditingTip(null);
    setCreatingPrefill(null);
    await refresh();
  }

  async function handleDelete(id: string) {
    if (!window.confirm('确定删除这条复盘记录吗？此操作不可撤销。')) return;
    await deleteInterviewTip(id);
    await refresh();
  }

  if (!loaded) {
    return <div className="p-4 text-sm text-muted-foreground">加载中…</div>;
  }

  const initialValues: InterviewTipFormValues = editingTip
    ? {
        jobApplicationId: editingTip.jobApplicationId,
        timelineEntryId: editingTip.timelineEntryId,
        content: editingTip.content,
        tags: editingTip.tags ?? [],
      }
    : {
        jobApplicationId: creatingPrefill?.jobApplicationId ?? applications[0]?.id ?? '',
        timelineEntryId: creatingPrefill?.timelineEntryId,
        content: '',
        tags: [],
      };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索公司"
          className="w-full sm:w-56"
        />

        <Select
          items={[{ value: 'all', label: '全部标签' }, ...allTags.map((tag) => ({ value: tag, label: tag }))]}
          value={tagFilter}
          onValueChange={(value) => setTagFilter(value ?? 'all')}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="全部标签" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部标签</SelectItem>
            {allTags.map((tag) => (
              <SelectItem key={tag} value={tag}>
                {tag}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button type="button" className="ml-auto" onClick={openCreateForm} disabled={applications.length === 0}>
          新增复盘
        </Button>
      </div>

      {formOpen && (
        <InterviewTipForm
          key={editingTip?.id ?? 'new'}
          applications={applications}
          initialValues={initialValues}
          isEditing={editingTip !== null}
          onSubmit={handleSubmit}
          onCancel={() => setFormOpen(false)}
        />
      )}

      <InterviewTipList tips={filteredTips} onEdit={openEditForm} onDelete={handleDelete} />
    </div>
  );
}
