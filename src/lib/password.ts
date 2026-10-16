import { compare, hash } from "bcryptjs";

/** bcrypt cost factor for new hashes (login verify accepts any stored cost). */
export const PASSWORD_HASH_ROUNDS = 12;

/**
 * Dummy bcrypt hash used when the email is unknown, so response timing
 * is closer to a real failed password check (mitigates user enumeration).
 * Not a real account password.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$12$nfxNQcEWP/nxkf9kf3e1XOyWLJ21IzEnqBVwl9D9UzkFs2Jr6tRna";

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, PASSWORD_HASH_ROUNDS);
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  if (!plain || !passwordHash) return false;
  return compare(plain, passwordHash);
}
