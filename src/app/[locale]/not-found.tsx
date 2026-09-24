import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations();
  return (
    <main>
      <h1>{t('errors.NOT_FOUND')}</h1>
    </main>
  );
}
