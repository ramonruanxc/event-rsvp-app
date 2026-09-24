'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { buildInviteUrl } from '@/lib/invite-url';

/** Props of {@link CopyInviteLinkButton}. */
export interface CopyInviteLinkButtonProps {
  slug: string;
}

/** Copies the event's invite link to the clipboard and confirms with a status message (REQ-38, BR-51). */
export function CopyInviteLinkButton({ slug }: CopyInviteLinkButtonProps) {
  const t = useTranslations();
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    await navigator.clipboard.writeText(buildInviteUrl(window.location.origin, slug));
    setCopied(true);
  }

  return (
    <>
      <button onClick={handleClick}>{t('event.copyLink')}</button>
      {copied && <span role="status">{t('event.linkCopied')}</span>}
    </>
  );
}
