'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { db } from '@/lib/db/dexie-client';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [clearing, setClearing] = useState(false);

  async function handleClearAll() {
    if (!window.confirm('确定要清除所有本地数据吗？投递记录、时间线、面试复盘都会被永久删除，此操作不可撤销。')) {
      return;
    }
    setClearing(true);
    try {
      await db.delete();
      window.location.reload();
    } catch {
      setClearing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5">
          <section className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold">Moonshot API Key</h3>
            <p className="text-sm text-muted-foreground">
              Agent 解析和 AI 模拟面试功能依赖 Kimi（Moonshot AI）接口。请复制项目根目录的{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.example</code> 为{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>，填入{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">MOONSHOT_API_KEY</code>{' '}
              后重启开发服务器。
            </p>
          </section>

          <section className="flex flex-col gap-1.5">
            <h3 className="text-sm font-semibold">危险操作</h3>
            <p className="text-sm text-muted-foreground">清除后浏览器本地保存的所有数据都会消失，建议先备份。</p>
            <Button
              type="button"
              variant="destructive"
              className="w-fit"
              onClick={handleClearAll}
              disabled={clearing}
            >
              {clearing ? '清除中…' : '清除所有数据'}
            </Button>
          </section>

          <section className="flex items-center justify-between text-xs text-muted-foreground">
            <span>秋招投递管理 v2.0</span>
            <a
              href="https://github.com/qyx3215384776-cmyk/employee"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              GitHub 仓库
            </a>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
