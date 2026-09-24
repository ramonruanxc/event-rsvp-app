'use client';

import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { detectBrowserTimeZone } from '@/lib/browser-timezone';
import type { ActionResult } from '@/lib/action-result';

/** Props of {@link CreateSampleButton}. */
export interface CreateSampleButtonProps {
  create: (timezone: string) => Promise<ActionResult<{ slug: string }>>;
}

/** Button that creates the sample event and navigates to its owner page (REQ-37, BR-49). */
export function CreateSampleButton({ create }: CreateSampleButtonProps) {
  const t = useTranslations();
  const router = useRouter();

  async function handleClick() {
    const result = await create(detectBrowserTimeZone());
    if (result.ok) {
      router.push(`/e/${result.data.slug}`);
    }
  }

  return <button onClick={handleClick}>{t('dashboard.createSample')}</button>;
}
