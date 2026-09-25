import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations();
  return (
    <main className="page">
      <div className="col-640">
        <h1 className="h2">{t('errors.NOT_FOUND')}</h1>
      </div>
    </main>
  );
}
