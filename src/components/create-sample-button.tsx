'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { detectBrowserTimeZone } from '@/lib/browser-timezone';
import type { ActionResult } from '@/lib/action-result';
import type { ErrorCode } from '@/domain/errors';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/field';

/** Props of {@link CreateSampleButton}. */
export interface CreateSampleButtonProps {
  create: (timezone: string) => Promise<ActionResult<{ slug: string }>>;
}

/** Button that creates the sample event and navigates to its owner page (REQ-37, BR-49). */
export function CreateSampleButton({ create }: CreateSampleButtonProps) {
  const t = useTranslations();
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<ErrorCode | null>(null);

  async function handleClick() {
    setError(null);
    setPending(true);
    const result = await create(detectBrowserTimeZone());
    if (result.ok) {
      router.push(`/e/${result.data.slug}`);
    } else {
      setPending(false);
      setError(result.code); // REQ-142
    }
  }

  return (
    <>
      <Button loading={pending} onClick={handleClick}>
        {t('dashboard.createSample')}
      </Button>
      {error && <Alert>{t(`errors.${error}`)}</Alert>}
    </>
  );
}
