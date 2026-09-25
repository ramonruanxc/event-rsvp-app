import type { PasswordHasher } from '@/lib/password';

/** Fast fake PasswordHasher for service tests: hash(p) = "fake:" + p; records every verify call. */
export function fakeHasher(): {
  hasher: PasswordHasher;
  verified: Array<{ password: string; stored: string }>;
} {
  const verified: Array<{ password: string; stored: string }> = [];
  const hasher: PasswordHasher = {
    hash: async (password) => `fake:${password}`,
    verify: async (password, stored) => {
      verified.push({ password, stored });
      return stored === `fake:${password}`;
    },
  };
  return { hasher, verified };
}
