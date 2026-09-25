'use server';

import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { toActionError, type ActionResult } from '@/lib/action-result';

/** Sets or changes the signed-in user's password (REQ-120). */
export async function setPasswordAction(values: unknown): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId();
  try {
    await getServices().setPassword.execute({ userId, values });
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}

/** Dismisses the cleared-password notice of the signed-in user (REQ-123). */
export async function dismissPasswordNoticeAction(): Promise<ActionResult<null>> {
  const userId = await getCurrentUserId();
  try {
    await getServices().dismissPasswordNotice.execute({ userId });
    return { ok: true, data: null };
  } catch (error) {
    return toActionError(error);
  }
}
