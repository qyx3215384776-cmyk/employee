'use client';

import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Moon, Sun, SunMoon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const THEME_OPTIONS = [
  { value: 'light', label: '亮色', icon: Sun },
  { value: 'dark', label: '暗色', icon: Moon },
  { value: 'system', label: '跟随系统', icon: SunMoon },
] as const;

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // SSR-safe mount detection: theme is unknown on the server, so the icon
    // must not render a light/dark guess until hydration has happened.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button type="button" variant="outline" size="icon" aria-label="切换主题" />}
      >
        {mounted && theme === 'dark' ? <Moon className="size-4" /> : <Sun className="size-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {THEME_OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt.value} onClick={() => setTheme(opt.value)}>
            <opt.icon className="size-4" />
            {opt.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
