"use client";

import { useState } from "react";
import Link from "next/link";
import type { Inquiry } from "@/lib/types";
import { InquiryReplyModal } from "./inquiry-reply-modal";

type Props = { inquiries: Inquiry[] };

export function InquiryList({ inquiries }: Props) {
  const [active, setActive] = useState<Inquiry | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  function handleSent() {
    setActive(null);
    setRefreshKey((k) => k + 1);
  }

  return (
    <div key={refreshKey}>
      <h1 className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
        Inquiries
      </h1>
      <ul className="mt-5 space-y-3">
        {inquiries.map((inquiry) => (
          <li key={inquiry.id} className="rounded-[var(--radius-md)] seaps-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold">{inquiry.propertyTitle}</p>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs uppercase tracking-wide ${
                    inquiry.status === "new"
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-muted)]"
                  }`}
                >
                  {inquiry.status}
                </span>
                {inquiry.status !== "closed" && (
                  <button
                    type="button"
                    onClick={() => setActive(inquiry)}
                    className="rounded-[var(--radius-sm)] border border-[var(--color-accent)] px-2.5 py-1 text-xs font-medium text-[var(--color-accent)] transition hover:bg-[var(--color-accent)] hover:text-[#0B1C33]"
                  >
                    Reply
                  </button>
                )}
              </div>
            </div>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              {inquiry.name} · {inquiry.contact}
            </p>
            {inquiry.propertySlug ? (
              <Link
                href={`/property/${inquiry.propertySlug}`}
                className="mt-1 inline-block text-sm text-[var(--color-accent-soft)] underline-offset-4 hover:underline"
              >
                /property/{inquiry.propertySlug}
              </Link>
            ) : null}
            <p className="mt-2 text-sm">{inquiry.message}</p>
          </li>
        ))}
      </ul>

      <InquiryReplyModal inquiry={active} onClose={() => setActive(null)} onSent={handleSent} />
    </div>
  );
}
