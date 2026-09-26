import { notFound } from 'next/navigation';

/** Sends every unmatched path under a locale to the localized not-found page (REQ-135). */
export default function CatchAllPage(): never {
  notFound();
}
