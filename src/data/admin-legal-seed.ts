import type { LegalDocRecord } from "@/lib/admin-types";

export const LEGAL_DOCS_SEED: LegalDocRecord[] = [
  {
    id: "legal-agent-contract-2026",
    title: "SEAPS agent employment contract (template)",
    category: "employment",
    summary: "Standard agency agreement for licensed sales staff in Cambodia.",
    fileUrl: "/docs/legal/agent-employment-contract.html",
    updatedAt: "2026-01-15T00:00:00.000Z",
  },
  {
    id: "legal-listing-moderation",
    title: "Listing moderation & publication policy",
    category: "listing_policy",
    summary: "Rules for pending listings, media, and public visibility.",
    fileUrl: "/docs/legal/listing-moderation-policy.html",
    updatedAt: "2026-02-01T00:00:00.000Z",
  },
  {
    id: "legal-kyc-staff",
    title: "Staff KYC & ID retention",
    category: "compliance",
    summary: "Portrait, ID copies, and contract storage requirements.",
    fileUrl: "/docs/legal/staff-kyc-policy.html",
    updatedAt: "2025-11-20T00:00:00.000Z",
  },
  {
    id: "legal-privacy-kh",
    title: "Privacy & data handling (Cambodia operations)",
    category: "privacy",
    summary: "Client and lead data handling for SEAPS platforms.",
    fileUrl: "/privacy",
    updatedAt: "2026-03-01T00:00:00.000Z",
  },
];
