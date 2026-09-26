'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { buildInviteUrl } from '@/lib/invite-url';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';

/** Props of {@link CopyInviteLinkButton}. */
export interface CopyInviteLinkButtonProps {
  slug: string;
  /** How long the "Copied" state lasts before returning, in ms (default 2000, REQ-70). */
  copiedMs?: number;
  /** When true, the hint says replies are closed instead of inviting more replies (REQ-152). */
  ended?: boolean;
}

/**
 * Read-only invite link field with a button that copies it to the clipboard, confirming with a
 * polite live region and a temporary "Copied" label (REQ-38, REQ-79, REQ-85, BR-51).
 */
export function CopyInviteLinkButton({
  slug,
  copiedMs = 2000,
  ended = false,
}: CopyInviteLinkButtonProps) {
  const t = useTranslations();
  const [url, setUrl] = useState('');
  const [copied, setCopied] = useState(false);

  // The origin is only known in the browser; deferred to an effect so the server-rendered
  // markup (which cannot know it) matches the first client render.
  useEffect(() => {
    setUrl(buildInviteUrl(window.location.origin, slug));
  }, [slug]);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), copiedMs);
    return () => clearTimeout(id);
  }, [copied, copiedMs]);

  async function handleClick() {
    await navigator.clipboard.writeText(buildInviteUrl(window.location.origin, slug));
    setCopied(true);
  }

  return (
    <div className="panel">
      <div className="field">
        <label className="label" htmlFor="invite-link">
          {t('event.inviteLink')}
        </label>
        <div className="copy-row">
          <input
            className="input"
            id="invite-link"
            readOnly
            value={url}
            aria-describedby="invite-link-hint"
          />
          <Button className={copied ? 'is-copied' : undefined} onClick={handleClick}>
            <Icon icon={copied ? Check : Copy} />
            {copied ? t('event.copied') : t('event.copyLink')}
          </Button>
        </div>
        <p className="hint" id="invite-link-hint">
          {ended ? t('event.endedHint') : t('event.inviteHint')}
        </p>
        <p className="sr-only" aria-live="polite">
          {copied ? t('event.linkCopied') : ''}
        </p>
      </div>
    </div>
  );
}
