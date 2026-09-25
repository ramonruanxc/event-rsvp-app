'use client';

/** Props for {@link UserMenu}. */
export interface UserMenuProps {
  name: string | null;
  initial: string;
  signOutAction: () => Promise<void>;
}

/** Signed-in account menu: avatar initial, "My events" and "Sign out" (REQ-80). */
export function UserMenu(_props: UserMenuProps): React.JSX.Element {
  return null as unknown as React.JSX.Element;
}
