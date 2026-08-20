'use client';

import { Eye, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppMode } from '@/lib/mode-context';

export function ModeBanner() {
  const { mode, switchMode, resetDemo } = useAppMode();

  async function handleStartPersonal() {
    const confirmed = window.confirm(
      '切换到个人版后，你可以开始记录自己的投递。示范数据随时可以切回来看，是否继续？'
    );
    if (!confirmed) return;
    await switchMode('personal');
  }

  async function handleReset() {
    const confirmed = window.confirm('确定要重置示范数据吗？你在示范版里做的改动会恢复为初始状态。');
    if (!confirmed) return;
    await resetDemo();
    window.location.reload();
  }

  if (mode === 'demo') {
    return (
      <div className="border-b bg-blue-50 dark:bg-blue-950">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 px-4 py-2 text-sm sm:px-6">
          <span className="flex items-center gap-1.5">
            <Eye className="size-4 shrink-0" />
            <span className="hidden sm:inline">你正在浏览示范版 — 这是虚构角色「小秋」的投递数据</span>
            <span className="sm:hidden">示范版</span>
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={handleReset}>
              重置示范数据
            </Button>
            <Button type="button" size="sm" onClick={handleStartPersonal}>
              开始我的投递
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-b bg-muted/30">
      <div className="mx-auto flex w-full max-w-6xl items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground sm:px-6">
        <NotebookPen className="size-3.5 shrink-0" />
        <span>我的投递</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="ml-auto h-6 px-2 text-xs"
          onClick={() => switchMode('demo')}
        >
          查看示范版
        </Button>
      </div>
    </div>
  );
}
