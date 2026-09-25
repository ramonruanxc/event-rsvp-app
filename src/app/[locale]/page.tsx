import { getTranslations } from 'next-intl/server';
import { DEMO_SLUG } from '@/lib/demo-seed';
import { Link } from '@/i18n/navigation';
import { signInRedirectPath } from '@/lib/auth-redirect';
import { getCurrentUserId } from '@/lib/session';

/** The app's signed-out landing page and signed-in shortcut to the dashboard (REQ-39, BR-52). */
export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations();
  const userId = await getCurrentUserId();

  return (
    <main>
      <h1>{t('home.headline')}</h1>
      <p>{t('home.explanation')}</p>
      {userId ? (
        <Link href="/dashboard">{t('nav.myEvents')}</Link>
      ) : (
        <a href={signInRedirectPath(`/${locale}/dashboard`)}>{t('nav.signIn')}</a>
      )}
      <Link href={`/e/${DEMO_SLUG}`}>{t('home.demoLink')}</Link>
    </main>
  );
}
