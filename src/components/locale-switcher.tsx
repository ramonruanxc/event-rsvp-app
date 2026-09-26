'use client';

import { ChevronDown, Globe } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Icon } from '@/components/ui/icon';

/** sessionStorage flag: put focus back on the language select after a locale change (REQ-144). */
export const LOCALE_REFOCUS_KEY = 'locale-select-refocus';

/**
 * Select control to switch the active locale while staying on the current page (REQ-54).
 * Named by `aria-label` with no visible `<label>` (BR-105 exception, REQ-68, REQ-80); collapses
 * to a 40 px globe-only target below 480 px (CSS from TASK-155).
 */
export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="lang">
      <Icon icon={Globe} className="i-globe" />
      <select
        id="locale-select"
        aria-label={t('nav.language')}
        value={locale}
        onChange={(event) => router.replace(pathname, { locale: event.target.value })}
      >
        {routing.locales.map((l) => (
          <option key={l} value={l}>
            {t(`languages.${l}`)}
          </option>
        ))}
      </select>
      <Icon icon={ChevronDown} className="i-chev" />
    </div>
  );
}
