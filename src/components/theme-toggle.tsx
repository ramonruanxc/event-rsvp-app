'use client';

import { useState } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/ui/icon';
import { nextTheme, themeCookieString, type Theme } from '@/lib/theme';

/** Props for {@link ThemeToggle}. */
export interface ThemeToggleProps {
  initialTheme: Theme;
}

/** Header button that switches the color theme at once and stores the choice (REQ-64). */
export function ThemeToggle({ initialTheme }: ThemeToggleProps): React.JSX.Element {
  const t = useTranslations();
  const [theme, setTheme] = useState<Theme>(initialTheme);

  function toggle() {
    const next = nextTheme(theme);
    document.documentElement.dataset.theme = next;
    document.cookie = themeCookieString(next);
    setTheme(next);
  }

  return (
    <button
      type="button"
      className="icon-btn theme-toggle"
      aria-label={t('nav.darkTheme')}
      aria-pressed={theme === 'dark'}
      onClick={toggle}
    >
      <Icon icon={theme === 'dark' ? Moon : Sun} size={20} />
    </button>
  );
}
