import type { DemoUser } from "@/lib/types";

/** Demo accounts — passwords are plain in seed for local demo only. */
export const demoUsers: DemoUser[] = [
  {
    id: "user-buyer",
    email: "buyer@estatenova.demo",
    password: "demo-buyer-123",
    name: "Alex Buyer",
    role: "buyer",
  },
  {
    id: "user-owner",
    email: "owner@estatenova.demo",
    password: "demo-owner-123",
    name: "Sam Owner",
    role: "owner",
  },
  {
    id: "user-agent",
    email: "agent@estatenova.demo",
    password: "demo-agent-123",
    name: "Maya Ferreira",
    role: "agent",
    agencyId: "ag-atlas",
  },
  {
    id: "user-admin",
    email: "admin@estatenova.demo",
    password: "demo-admin-123",
    name: "Jordan Admin",
    role: "admin",
  },
];

export function findUserByEmail(email: string) {
  return demoUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
}
