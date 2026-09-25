'use client';

import { useRef } from 'react';
import { Calendar, ChevronDown, LogOut, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Icon } from '@/components/ui/icon';

/** Props for {@link UserMenu}. */
export interface UserMenuProps {
  name: string | null;
  initial: string;
  signOutAction: () => Promise<void>;
}

/** Signed-in account menu: avatar initial, "My events" and "Sign out" (REQ-80). */
export function UserMenu({ name, initial, signOutAction }: UserMenuProps): React.JSX.Element {
  const t = useTranslations();
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  return (
    <details className="menu" ref={ref}>
      <summary aria-label={t('nav.accountMenu')}>
        <span className="avatar" aria-hidden="true">
          {initial}
        </span>
        <Icon icon={ChevronDown} />
      </summary>
      <div className="menu-pop">
        {name && <p className="who small muted">{t('nav.signedInAs', { name })}</p>}
        <Link href="/dashboard" onClick={close}>
          <Icon icon={Calendar} />
          {t('nav.myEvents')}
        </Link>
        <Link href="/account" onClick={close}>
          <Icon icon={UserRound} />
          {t('nav.account')}
        </Link>
        <form action={signOutAction}>
          <button type="submit" className="menu-item">
            <Icon icon={LogOut} />
            {t('nav.signOut')}
          </button>
        </form>
      </div>
    </details>
  );
}
