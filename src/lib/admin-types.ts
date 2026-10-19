export type PageViewEvent = {
  id: string;
  path: string;
  at: string;
  sessionKey: string;
  referrer?: string;
};

export type AdminTaskStatus = "open" | "in_progress" | "done";

export type AdminTask = {
  id: string;
  assigneeStaffId: string;
  title: string;
  body: string;
  status: AdminTaskStatus;
  dueDate: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
};

export type AdminCommentSubject =
  | { type: "staff"; id: string }
  | { type: "listing"; id: string }
  | { type: "legal_doc"; id: string }
  | { type: "task"; id: string };

export type AdminComment = {
  id: string;
  subject: AdminCommentSubject;
  body: string;
  authorUserId: string;
  authorName: string;
  createdAt: string;
};

export type LegalDocCategory =
  | "employment"
  | "compliance"
  | "listing_policy"
  | "privacy"
  | "other";

export type LegalDocRecord = {
  id: string;
  title: string;
  category: LegalDocCategory;
  summary: string;
  fileUrl: string;
  updatedAt: string;
};
