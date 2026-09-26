'use client';

import { useEffect, useRef, useState } from 'react';
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
 * The locale changes only on an explicit choice: a pointer selection, Enter, or leaving the
 * select with a new value; arrow keys only move the selection. After the change, focus returns
 * to the select (REQ-144, BR-175).
 */
export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [value, setValue] = useState<string>(locale);
  const keyDown = useRef(false);
  const pending = useRef<string | null>(null);
  const selectRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    setValue(locale);
    pending.current = null;
    if (sessionStorage.getItem(LOCALE_REFOCUS_KEY) === '1') {
      sessionStorage.removeItem(LOCALE_REFOCUS_KEY);
      selectRef.current?.focus();
    }
  }, [locale]);

  function commit(next: string) {
    if (next === locale || next === pending.current) return;
    pending.current = next;
    sessionStorage.setItem(LOCALE_REFOCUS_KEY, '1');
    router.replace(pathname, { locale: next });
  }

  return (
    <div className="lang">
      <Icon icon={Globe} className="i-globe" />
      <select
        ref={selectRef}
        id="locale-select"
        aria-label={t('nav.language')}
        value={value}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            commit(event.currentTarget.value);
            return;
          }
          keyDown.current = true;
        }}
        onKeyUp={() => {
          keyDown.current = false;
        }}
        onChange={(event) => {
          setValue(event.target.value);
          if (!keyDown.current) commit(event.target.value);
        }}
        onBlur={(event) => commit(event.currentTarget.value)}
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
