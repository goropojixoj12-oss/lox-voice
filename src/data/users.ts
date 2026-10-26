import type { DemoUser } from "@/lib/types";

/**
 * Staff and client accounts for SEAPS platform access.
 * Passwords are bcrypt hashes only (never plaintext). Demo login secrets
 * are documented for local/dev use outside this file; rotate for production.
 */
export const demoUsers: DemoUser[] = [
  {
    id: "user-buyer",
    email: "buyer@seaps.com.kh",
    passwordHash:
      "$2b$12$NdXXHxba5KVo6jLzHsCrIOFL0eSXRN4nnc2Dz6k87kdm2auo8jC4.",
    name: "Adam James",
    role: "buyer",
  },
  {
    id: "user-owner",
    email: "owner@seaps.com.kh",
    passwordHash:
      "$2b$12$mqQ57ez2XIO1DZXpHsuIA.uajrUsmZ7aNu2LnVjo5A6/Sefc/Heo6",
    name: "Adam James",
    role: "owner",
  },
  {
    id: "user-agent",
    email: "agent@seaps.com.kh",
    passwordHash:
      "$2b$12$RQPhXJlWKqPvrZaupgAE0OrcUjg8IzzkKTqDdmTpmv5I.k.FcFsge",
    name: "Adam James",
    role: "agent",
    agencyId: "ag-mekong",
  },
  {
    id: "user-admin",
    email: "ceo@seaps.asia",
    passwordHash:
      "$2b$12$SbWirmamu/u3LkIH.BzOBOA2F2T1kZuGyPV8G7.H6icJhtp0.KxNm",
    name: "SEAPS CEO",
    role: "god",
  },
];

export function findUserByEmail(email: string) {
  return demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
