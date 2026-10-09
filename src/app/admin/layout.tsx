import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireRole(["admin"]);
  if (!session) redirect("/auth/login");
  return children;
}
