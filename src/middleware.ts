import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

/** Detects the browser's preferred locale and redirects to the matching localized route. */
export default createMiddleware(routing);

export const config = { matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'] };
