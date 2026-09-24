'use client';

import { useLocale, useTranslations } from 'next-intl';
import { routing } from '@/i18n/routing';
import { usePathname, useRouter } from '@/i18n/navigation';

/** Select control to switch the active locale while staying on the current page (REQ-54). */
export function LocaleSwitcher() {
  const t = useTranslations();
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <select
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
  );
}
