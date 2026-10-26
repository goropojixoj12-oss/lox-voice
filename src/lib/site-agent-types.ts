export type SiteChangeRequestStatus = "queued" | "in_progress" | "done" | "failed";

/** Only public-site UI and signed-in user experiences (not infra, billing, or legal HR). */
export type SiteChangeScope = "ui_auth";

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
  secondAttachment?: SiteChangeAttachment | null;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  agentNote?: string;
  commitUrl?: string;
};
