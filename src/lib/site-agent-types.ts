export type SiteChangeRequestStatus = "queued" | "in_progress" | "done" | "failed";

/** What the admin is allowed to change. The queue is not limited to UI any more. */
export type SiteChangeScope = "site" | "listing" | "design" | "ui_auth";

export type SiteChangeAttachment = {
  fileName: string;
  storageKey: string;
  contentType: string;
  sizeBytes: number;
};

export type SiteChangeRequest = {
  id: string;
  message: string;
  scope: SiteChangeScope;
  status: SiteChangeRequestStatus;
  attachment: SiteChangeAttachment | null;
  secondAttachment: SiteChangeAttachment | null;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  agentNote?: string;
  commitUrl?: string;
};
