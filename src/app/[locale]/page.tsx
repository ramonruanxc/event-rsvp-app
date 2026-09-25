import { getTranslations } from 'next-intl/server';
import { DEMO_SLUG } from '@/lib/demo-seed';
import { Link } from '@/i18n/navigation';
import { signInRedirectPath } from '@/lib/auth-redirect';
import { getCurrentUserId } from '@/lib/session';
import { buttonClass } from '@/components/ui/button';
import { InvitePreview } from '@/components/invite-preview';

/** The app's signed-out landing page and signed-in shortcut to the dashboard (REQ-39, REQ-81, BR-52). */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const userId = await getCurrentUserId();

  return (
    <main className="page">
      <div className="col-960">
        <div className="home">
          <div className="home-copy">
            <h1 className="display">{t('home.headline')}</h1>
            <p className="prose muted">{t('home.explanation')}</p>
            <div className="btn-row">
              {userId ? (
                <Link className={buttonClass('primary', 'lg')} href="/dashboard">
                  {t('nav.myEvents')}
                </Link>
              ) : (
                <a
                  className={buttonClass('primary', 'lg')}
                  href={signInRedirectPath(`/${locale}/dashboard`)}
                >
                  {t('nav.signIn')}
                </a>
              )}
              <Link className={buttonClass('secondary', 'lg')} href={`/e/${DEMO_SLUG}`}>
                {t('home.demoLink')}
              </Link>
            </div>
          </div>
          <InvitePreview />
        </div>
      </div>
    </main>
  );
}
