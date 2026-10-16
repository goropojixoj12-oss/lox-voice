import type { DemoUser } from "@/lib/types";

/** Staff and client accounts for SEAPS platform access. */
export const demoUsers: DemoUser[] = [
  {
    id: "user-buyer",
    email: "buyer@seaps.com.kh",
    password: "seaps-buyer-123",
    name: "Alex Buyer",
    role: "buyer",
  },
  {
    id: "user-owner",
    email: "owner@seaps.com.kh",
    password: "seaps-owner-123",
    name: "Sam Owner",
    role: "owner",
  },
  {
    id: "user-agent",
    email: "agent@seaps.com.kh",
    password: "seaps-agent-123",
    name: "Sokha Meas",
    role: "agent",
    agencyId: "ag-mekong",
  },
  {
    id: "user-admin",
    email: "admin@seaps.com.kh",
    password: "seaps-admin-123",
    name: "Jordan Admin",
    role: "admin",
  },
];

export function findUserByEmail(email: string) {
  return demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
