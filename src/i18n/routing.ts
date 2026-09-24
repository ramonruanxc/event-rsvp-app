import { defineRouting } from 'next-intl/routing';

/** Supported locales; URLs are always prefixed (/en, /fr, /pt-BR). */
export const routing = defineRouting({ locales: ['en', 'fr', 'pt-BR'], defaultLocale: 'en' });
export type Locale = (typeof routing.locales)[number];
