import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

/** Localized not-found page, rendered inside the locale layout (REQ-135, BR-181). */
export default function NotFound() {
  const t = useTranslations();
  return (
    <main className="page">
      <div className="col-640">
        <h1 className="h2">{t('errors.NOT_FOUND')}</h1>
        <p className="muted mt-2">{t('notFound.hint')}</p>
        <p className="mt-4">
          <Link href="/">{t('notFound.home')}</Link>
        </p>
      </div>
    </main>
  );
}
