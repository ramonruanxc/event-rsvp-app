'use client';

import { useEffect, useRef } from 'react';
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

/**
 * Signed-in account menu: avatar initial, "My events" and "Sign out" (REQ-80).
 * It closes on Escape (focus back on its summary), when focus moves outside it, and on a pointer
 * press outside it (REQ-145).
 */
export function UserMenu({ name, initial, signOutAction }: UserMenuProps): React.JSX.Element {
  const t = useTranslations();
  const ref = useRef<HTMLDetailsElement>(null);
  const close = () => {
    if (ref.current) ref.current.open = false;
  };

  useEffect(() => {
    function onPointerDown(event: Event) {
      const menu = ref.current;
      if (menu?.open && !menu.contains(event.target as Node)) menu.open = false;
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  function onKeyDown(event: React.KeyboardEvent<HTMLDetailsElement>) {
    const menu = ref.current;
    if (event.key !== 'Escape' || !menu?.open) return;
    menu.open = false;
    menu.querySelector('summary')?.focus();
  }

  function onBlur(event: React.FocusEvent<HTMLDetailsElement>) {
    const menu = ref.current;
    const next = event.relatedTarget;
    if (menu?.open && next instanceof Node && !menu.contains(next)) menu.open = false;
  }

  return (
    <details className="menu" ref={ref} onKeyDown={onKeyDown} onBlur={onBlur}>
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
