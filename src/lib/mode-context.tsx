'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { initDbMode, switchDb, type AppMode } from '@/lib/db/dexie-client';
import { resetDemoData, seedDemoData } from '@/lib/db/demo-seed';

interface ModeContextValue {
  mode: AppMode;
  switchMode: (mode: AppMode) => Promise<void>;
  resetDemo: () => Promise<void>;
  /** True once the initial mode has been resolved and demo data (if needed) seeded. */
  ready: boolean;
}

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<AppMode>('demo');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function init() {
      const initialMode = initDbMode();
      if (initialMode === 'demo') {
        await seedDemoData();
      }
      setMode(initialMode);
      setReady(true);
    }
    init();
  }, []);

  const switchMode = useCallback(async (newMode: AppMode) => {
    switchDb(newMode);
    if (newMode === 'demo') {
      await seedDemoData();
    }
    localStorage.setItem('app-mode', newMode);
    setMode(newMode);
  }, []);

  const resetDemo = useCallback(async () => {
    await resetDemoData();
  }, []);

  return (
    <ModeContext.Provider value={{ mode, switchMode, resetDemo, ready }}>{children}</ModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useAppMode must be used within ModeProvider');
  return ctx;
}
