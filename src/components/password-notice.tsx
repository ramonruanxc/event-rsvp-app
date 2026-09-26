'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import type { ActionResult } from '@/lib/action-result';
import { Button, buttonClass } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** Props of {@link PasswordNotice}. */
export interface PasswordNoticeProps {
  dismiss: () => Promise<ActionResult<null>>;
}

/** Explains a Google-link password clearing and lets the user dismiss the notice (REQ-123). */
export function PasswordNotice({ dismiss }: PasswordNoticeProps): React.JSX.Element | null {
  const t = useTranslations();
  const router = useRouter();
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);

  if (hidden) return null;

  async function onDismiss() {
    setBusy(true);
    const result = await dismiss();
    setBusy(false);
    if (result.ok) {
      const main = document.querySelector('main');
      if (main) {
        main.tabIndex = -1;
        main.focus(); // REQ-140: the notice and its button are about to go
      }
      setHidden(true);
      router.refresh();
    }
  }

  return (
    <div className="notice" role="status">
      <Icon icon={KeyRound} />
      <div>
        <p>{t('account.passwordClearedNotice')}</p>
        <div className="btn-row">
          <Link className={buttonClass('secondary', 'sm')} href="/account">
            {t('account.goToAccount')}
          </Link>
          <Button variant="ghost" size="sm" loading={busy} onClick={onDismiss}>
            {t('account.dismiss')}
          </Button>
        </div>
      </div>
    </div>
  );
}
