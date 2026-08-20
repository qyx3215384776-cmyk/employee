'use client';

import { useRef, useState } from 'react';
import { ClipboardList, Download, Settings, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './theme-toggle';
import { SettingsDialog } from './settings-dialog';
import { exportBackup, parseBackupFile, restoreBackup } from '@/lib/export/backup';

export function AppHeader() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleRestoreFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setRestoring(true);
    try {
      const data = await parseBackupFile(file);
      const confirmed = window.confirm(
        `即将导入 ${data.jobApplications.length} 条投递记录、${data.timelineEntries.length} 条时间线、${data.interviewTips.length} 条复盘。当前数据会被覆盖，是否继续？`
      );
      if (!confirmed) return;

      await restoreBackup(data);
      window.location.reload();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : '导入失败，请检查文件内容');
    } finally {
      setRestoring(false);
    }
  }

  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2 font-semibold">
          <ClipboardList className="size-5" />
          <span>秋招管家</span>
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => exportBackup()}>
            <Download className="size-4" />
            备份
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={restoring}
          >
            <Upload className="size-4" />
            {restoring ? '导入中…' : '恢复'}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleRestoreFile}
          />
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="设置"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings className="size-4" />
          </Button>
        </div>
      </div>

      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}
