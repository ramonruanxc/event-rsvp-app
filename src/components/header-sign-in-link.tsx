'use client';

import { usePathname } from '@/i18n/navigation';
import { buttonClass } from '@/components/ui/button';

/** Pages that are themselves the sign-in destination (REQ-146). */
const HIDDEN_ON = ['/sign-in', '/register'];

/** The header's "Sign in" link, left out on the sign-in and register pages (REQ-146). */
export function HeaderSignInLink({
  href,
  label,
}: {
  href: string;
  label: string;
}): React.JSX.Element | null {
  const pathname = usePathname();
  if (HIDDEN_ON.includes(pathname)) return null;
  return (
    <a className={buttonClass('secondary', 'sm')} href={href}>
      {label}
    </a>
  );
}
