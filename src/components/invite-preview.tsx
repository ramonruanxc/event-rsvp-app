import { Check, Link as LinkIcon, MapPin, Users } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { DEMO_SLUG } from '@/lib/demo-seed';
import { Icon } from './ui/icon';

/**
 * Decorative preview of the demo guest page on the home page (REQ-81). Its own content is the
 * demo event's fixed text, not translated (BR-77); only the caption around it is localized.
 */
export async function InvitePreview(): Promise<React.JSX.Element> {
  const t = await getTranslations();
  return (
    <figure className="invite-preview">
      <div className="ip-card" aria-hidden="true">
        <div className="ip-bar">
          <Icon icon={LinkIcon} size={12} />
          <span>/e/{DEMO_SLUG}</span>
        </div>
        <div className="ip-body">
          <p className="ip-title">Community Picnic in the Park</p>
          <p className="small ip-meta">
            <Icon icon={MapPin} />
            Riverside Park
          </p>
          <p className="small ip-meta num">
            <Icon icon={Users} />
            {t('totals.peopleGoing', { count: 7 })}
          </p>
          <div className="ip-seg">
            <span className="on">
              <Icon icon={Check} />
              {t('rsvp.going')}
            </span>
            <span>{t('rsvp.notGoing')}</span>
          </div>
          <span className="ip-submit">{t('rsvp.submit')}</span>
        </div>
      </div>
      <figcaption className="small muted">{t('home.previewCaption')}</figcaption>
    </figure>
  );
}
