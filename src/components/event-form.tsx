'use client';

import type { EventFormValues } from '@/domain/schemas';
import type { ActionResult } from '@/lib/action-result';

type FieldName = 'name' | 'description' | 'date' | 'time' | 'timezone' | 'location';

/** Props of {@link EventForm}: optional prefilled values and the submit handler (server action). */
export interface EventFormProps {
  initialValues?: Partial<Record<FieldName, string>>;
  submit: (values: EventFormValues) => Promise<ActionResult<{ slug: string }>>;
}

/** Create/edit event form: client-side validation, then delegates persistence to `submit` (REQ-15). */
export function EventForm(_props: EventFormProps) {
  throw new Error('not implemented');
}
