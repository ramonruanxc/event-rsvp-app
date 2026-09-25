import { UnauthenticatedError } from '@/domain/errors';
import { getServices } from '@/lib/container';
import { getCurrentUserId } from '@/lib/session';
import { dismissPasswordNoticeAction } from '@/app/[locale]/account/actions';
import { PasswordNotice } from '@/components/password-notice';

/** Shows the cleared-password notice under the header while it is pending for the signed-in user (REQ-123). */
export async function PasswordNoticeSlot(): Promise<React.JSX.Element | null> {
  const userId = await getCurrentUserId();
  if (!userId) return null;
  try {
    const account = await getServices().getAccount.execute({ userId });
    if (!account.passwordNotice) return null;
  } catch (error) {
    if (error instanceof UnauthenticatedError) return null;
    throw error;
  }
  return (
    <div className="site-notice">
      <PasswordNotice dismiss={dismissPasswordNoticeAction} />
    </div>
  );
}
