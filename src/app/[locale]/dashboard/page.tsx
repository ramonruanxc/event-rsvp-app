import { getTranslations } from 'next-intl/server';
import { requireUserId } from '@/lib/session';

/** The signed-in organizer's list of events (content added in TASK-65). */
export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await requireUserId(`/${locale}/dashboard`);
  const t = await getTranslations();
  return (
    <main>
      <h1>{t('dashboard.title')}</h1>
    </main>
  );
}
