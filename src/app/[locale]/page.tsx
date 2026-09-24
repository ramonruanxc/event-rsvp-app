import { getTranslations } from 'next-intl/server';

export default async function HomePage() {
  const t = await getTranslations();
  return (
    <main>
      <h1>{t('home.headline')}</h1>
      <p>{t('home.explanation')}</p>
    </main>
  );
}
