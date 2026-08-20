import { AppHeader } from '@/components/shell/app-header';
import { ModeBanner } from '@/components/shell/mode-banner';
import { AppTabs } from '@/components/shell/app-tabs';

export default function Home() {
  return (
    <>
      <AppHeader />
      <ModeBanner />
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">秋招投递管理</h1>
          <p className="text-sm text-muted-foreground">
            数据保存在浏览器本地（IndexedDB），所有 tab 共享同一份数据。
          </p>
        </div>

        <AppTabs />
      </div>
    </>
  );
}
