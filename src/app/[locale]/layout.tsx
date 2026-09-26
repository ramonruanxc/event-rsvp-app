import { Geist, Geist_Mono } from 'next/font/google';
import { cookies } from 'next/headers';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { routing } from '@/i18n/routing';
import { parseTheme, THEME_COOKIE } from '@/lib/theme';
import { SiteHeader } from '@/components/site-header';
import { PasswordNoticeSlot } from '@/components/password-notice-slot';
import '../globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

/** Localized title template and description for every page (REQ-134, BR-174). */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) return {};
  const t = await getTranslations({ locale });
  return {
    title: { default: t('meta.title'), template: `%s · ${t('meta.title')}` },
    description: t('meta.description'),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html
      lang={locale}
      data-theme={theme}
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body>
        <NextIntlClientProvider>
          <SiteHeader locale={locale} theme={theme} />
          <PasswordNoticeSlot />
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
