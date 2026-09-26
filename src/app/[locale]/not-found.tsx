'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/**
 * Localized not-found page, rendered inside the locale layout (REQ-135, BR-181).
 *
 * `not-found.tsx` cannot export `generateMetadata` in this app (it is rendered through the
 * not-found boundary, not the normal page metadata resolution), so the layout's
 * `generateMetadata` always applies its default title here. Rendering a `<title>` element
 * directly would add a second, duplicate `<title>` node once React 19 hoists it into `<head>`
 * alongside the layout's own (they are not the same React tree, so React cannot de-duplicate
 * them). Instead, an effect overwrites the existing `<title>` element's text once mounted,
 * following the same "<page> · Event RSVP" pattern as every other page (REQ-134, BR-174).
 */
export default function NotFound() {
  const t = useTranslations();
  const title = `${t('notFound.title')} · ${t('meta.title')}`;
  useEffect(() => {
    document.title = title;
  }, [title]);
  return (
    <main className="page">
      <div className="col-640">
        <h1 className="h2">{t('errors.NOT_FOUND')}</h1>
        <p className="muted mt-2">{t('notFound.hint')}</p>
        <p className="mt-4">
          <Link href="/">{t('notFound.home')}</Link>
        </p>
      </div>
    </main>
  );
}
