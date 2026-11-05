import type { Metadata } from "next";
import Link from "next/link";
import { EmptyState } from "@/components/shared/states";
import { InquiryReplyModal } from "@/components/inquiry/inquiry-reply-modal";
import { requireRole } from "@/lib/auth";
import { getInquiriesForSession } from "@/lib/inquiry-access";
import { redirect } from "next/navigation";
import { InquiryList } from "@/components/inquiry/inquiry-list";

export const metadata: Metadata = { title: "Inquiries" };

export default async function DashboardInquiriesPage() {
  const session = await requireRole(["owner", "agent", "admin", "buyer"]);
  if (!session) redirect("/auth/login");
  const inquiries = await getInquiriesForSession(session);

  if (!inquiries.length) {
    return (
      <EmptyState
        title="No inquiries yet"
        description="When someone submits a property inquiry form, it appears here."
        actionHref="/search"
        actionLabel="Browse listings"
      />
    );
  }

  return <InquiryList inquiries={inquiries} />;
}
