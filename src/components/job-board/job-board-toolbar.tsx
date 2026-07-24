'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MAIN_STAGE_OPTIONS } from '@/components/job-applications/job-application-form';
import type { MainStage } from '@/types';

export type StageFilter = MainStage | 'all';
export type BoardView = 'kanban' | 'list';

const STAGE_FILTER_ITEMS: { value: StageFilter; label: string }[] = [
  { value: 'all', label: '全部阶段' },
  ...MAIN_STAGE_OPTIONS,
];

interface JobBoardToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  stageFilter: StageFilter;
  onStageFilterChange: (value: StageFilter) => void;
  view: BoardView;
  onViewChange: (view: BoardView) => void;
  onNew: () => void;
  onExport: () => void;
}

export function JobBoardToolbar({
  search,
  onSearchChange,
  stageFilter,
  onStageFilterChange,
  view,
  onViewChange,
  onNew,
  onExport,
}: JobBoardToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        placeholder="搜索公司或岗位"
        className="w-full sm:w-56"
      />

      <Select
        items={STAGE_FILTER_ITEMS}
        value={stageFilter}
        onValueChange={(value) => onStageFilterChange(value as StageFilter)}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="全部阶段" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">全部阶段</SelectItem>
          {MAIN_STAGE_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex overflow-hidden rounded-md border">
        <Button
          type="button"
          variant={view === 'kanban' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none"
          onClick={() => onViewChange('kanban')}
        >
          看板
        </Button>
        <Button
          type="button"
          variant={view === 'list' ? 'default' : 'ghost'}
          size="sm"
          className="rounded-none"
          onClick={() => onViewChange('list')}
        >
          列表
        </Button>
      </div>

      <div className="ml-auto flex gap-2">
        <Button type="button" variant="outline" onClick={onExport}>
          导出Excel
        </Button>
        <Button type="button" onClick={onNew}>
          新增岗位
        </Button>
      </div>
    </div>
  );
}
