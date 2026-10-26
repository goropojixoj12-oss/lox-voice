import type { UserRole } from "@/lib/types";

/** Platform super-user (executive desk). Legacy `admin` is treated the same in checks. */
export function isGod(role: UserRole): boolean {
  return role === "god" || role === "admin";
}

export function hasAdminDeskAccess(role: UserRole): boolean {
  return isGod(role);
}

export function canManageAgentDesk(operatorRole: UserRole): boolean {
  return isGod(operatorRole);
}

export function roleDisplayLabel(role: UserRole): string {
  switch (role) {
    case "god":
      return "God";
    case "admin":
      return "God";
    case "agent":
      return "Agent";
    case "buyer":
      return "Buyer";
    case "owner":
      return "Owner";
    case "guest":
      return "Guest";
    default: {
      const _exhaustive: never = role;
      return _exhaustive;
    }
  }
}
