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
    email: "admin@seaps.com.kh",
    passwordHash:
      "$2b$12$p1Vr/AKybhyYo2XlHQd6a.i6LqV//gkiTsftbCd9L6Kl/STgjtt/2",
    name: "Adam James",
    role: "admin",
  },
];

export function findUserByEmail(email: string) {
  return demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
