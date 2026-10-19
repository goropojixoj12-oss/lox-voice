"use client";

import { useCallback, useState } from "react";
import {
  agentDocumentKindLabel,
  agentHasRequiredProfilePhoto,
  getProfilePhotoDocument,
  type AgentDocumentKind,
  type AgentDocumentRef,
  type AgentProfileRecord,
} from "@/lib/agent-profile-shared";
import { AgentAvatar } from "@/components/agency/agent-avatar";
import { agents } from "@/data/agencies";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const UPLOAD_SLOTS: {
  kind: AgentDocumentKind;
  hint: string;
  accept: string;
}[] = [
  {
    kind: "profile_photo",
    hint: "Required headshot for your public agent card across SEAPS (JPG, PNG, WebP — max 8 MB)",
    accept: ".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp",
  },
  {
    kind: "id_front",
    hint: "Photo or scan of the front side (JPG, PNG, WebP, PDF — max 8 MB)",
    accept: ".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf",
  },
  {
    kind: "id_back",
    hint: "Photo or scan of the back side (JPG, PNG, WebP, PDF — max 8 MB)",
    accept: ".jpg,.jpeg,.png,.webp,.pdf,image/*,application/pdf",
  },
  {
    kind: "employment_contract",
    hint: "Signed contract with SEAPS (PDF, Word, or scan — max 8 MB)",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,application/pdf",
  },
  {
    kind: "other",
    hint: "Licenses, certificates, or other HR documents (max 8 MB each)",
    accept: ".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp",
  },
];

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

function docsForKind(documents: AgentDocumentRef[], kind: AgentDocumentKind) {
  return documents.filter((d) => d.kind === kind);
}

type AgentProfilePanelProps = {
  initialProfile: AgentProfileRecord;
  sessionRole: string;
};

export function AgentProfilePanel({ initialProfile, sessionRole }: AgentProfilePanelProps) {
  const [profile, setProfile] = useState(initialProfile);
  const linkedAgent = agents.find((a) => a.platformUserId === initialProfile.userId);
  const hasPortrait = agentHasRequiredProfilePhoto(profile);
  const portraitDoc = getProfilePhotoDocument(profile);
  const [fullName, setFullName] = useState(initialProfile.fullName);
  const [email, setEmail] = useState(initialProfile.email);
  const [phone, setPhone] = useState(initialProfile.phone);
  const [residence, setResidence] = useState(initialProfile.residence);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingKind, setUploadingKind] = useState<AgentDocumentKind | null>(null);
  const [docError, setDocError] = useState<string | null>(null);

  const savePersonalInfo = useCallback(async () => {
    setSavingInfo(true);
    setInfoMessage(null);
    setInfoError(null);
    try {
      const res = await fetch("/api/dashboard/agent-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, phone, residence }),
      });
      const data = (await res.json()) as { profile?: AgentProfileRecord; error?: string };
      if (!res.ok) {
        setInfoError(data.error ?? "Could not save profile");
        return;
      }
      if (data.profile) setProfile(data.profile);
      setInfoMessage("Personal information saved.");
    } catch {
      setInfoError("Network error — try again");
    } finally {
      setSavingInfo(false);
    }
  }, [email, fullName, phone, residence]);

  async function uploadDocument(kind: AgentDocumentKind, file: File | null) {
    if (!file) return;
    setUploadingKind(kind);
    setDocError(null);
    try {
      const form = new FormData();
      form.set("kind", kind);
      form.set("file", file);
      const res = await fetch("/api/dashboard/agent-profile/documents", {
        method: "POST",
        body: form,
      });
      const data = (await res.json()) as { profile?: AgentProfileRecord; error?: string };
      if (!res.ok) {
        setDocError(data.error ?? "Upload failed");
        return;
      }
      if (data.profile) setProfile(data.profile);
    } catch {
      setDocError("Upload failed — check your connection");
    } finally {
      setUploadingKind(null);
    }
  }

  async function removeDocument(documentId: string) {
    setDocError(null);
    try {
      const res = await fetch(
        `/api/dashboard/agent-profile/documents?id=${encodeURIComponent(documentId)}`,
        { method: "DELETE" },
      );
      const data = (await res.json()) as { profile?: AgentProfileRecord; error?: string };
      if (!res.ok) {
        setDocError(data.error ?? "Could not remove file");
        return;
      }
      if (data.profile) setProfile(data.profile);
    } catch {
      setDocError("Could not remove file");
    }
  }

  return (
    <div className="mt-6 space-y-8">
      <section className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
          Agent portrait
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Your photo appears on every agent card and listing linked to your profile. Upload a clear,
          professional portrait — this field is required.
        </p>
        {!hasPortrait ? (
          <p className="mt-3 rounded-[var(--radius-md)] border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
            Portrait missing — upload your photo below to publish your public agent profile.
          </p>
        ) : null}
        <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-8">
          {linkedAgent ? (
            <div className="flex flex-col items-center gap-2 sm:shrink-0">
              <AgentAvatar
                key={portraitDoc?.uploadedAt ?? profile.updatedAt}
                agent={linkedAgent}
                displayName={fullName}
                size="lg"
              />
              <p className="text-center text-sm font-medium text-[var(--color-text)]">{fullName}</p>
            </div>
          ) : (
            <div className="flex h-40 w-40 shrink-0 items-center justify-center rounded-full border border-dashed border-[var(--color-border)] text-xs text-[var(--color-muted)]">
              Preview after link
            </div>
          )}
          <div className="w-full min-w-0 flex-1 sm:pt-2">
            {portraitDoc ? (
              <p className="text-sm text-[var(--color-muted)]">
                Current file: <span className="font-medium text-[var(--color-text)]">{portraitDoc.fileName}</span>
                {" · "}
                {new Date(portraitDoc.uploadedAt).toLocaleString()}
              </p>
            ) : null}
            <div className="mt-3">
              <Label htmlFor="upload-profile_photo">Upload portrait</Label>
              <Input
                id="upload-profile_photo"
                type="file"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                disabled={uploadingKind === "profile_photo"}
                className="cursor-pointer file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-mist)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-accent-soft)]"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  void uploadDocument("profile_photo", file);
                  e.target.value = "";
                }}
              />
              {uploadingKind === "profile_photo" ? (
                <p className="mt-1 text-xs text-[var(--color-muted)]">Uploading…</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
          Personal information
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Keep your contact details up to date for SEAPS HR and client handoffs.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="agent-full-name">Full name</Label>
            <Input
              id="agent-full-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              autoComplete="name"
            />
          </div>
          <div>
            <Label htmlFor="agent-email">Email</Label>
            <Input
              id="agent-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>
          <div>
            <Label htmlFor="agent-phone">Phone</Label>
            <Input
              id="agent-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="+855 …"
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="agent-residence">Place of residence</Label>
            <Input
              id="agent-residence"
              value={residence}
              onChange={(e) => setResidence(e.target.value)}
              placeholder="City, district, or full address"
              autoComplete="street-address"
            />
          </div>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button type="button" onClick={savePersonalInfo} disabled={savingInfo}>
            {savingInfo ? "Saving…" : "Save personal info"}
          </Button>
          {infoMessage ? (
            <p className="text-sm text-emerald-400">{infoMessage}</p>
          ) : null}
          {infoError ? <p className="text-sm text-red-400">{infoError}</p> : null}
        </div>
        <p className="mt-3 text-xs text-[var(--color-muted)]">
          Account role: <span className="capitalize">{sessionRole}</span>
          {profile.updatedAt ? (
            <>
              {" "}
              · Last updated {new Date(profile.updatedAt).toLocaleString()}
            </>
          ) : null}
        </p>
      </section>

      <section className="seaps-card rounded-[var(--radius-lg)] p-5 md:p-6">
        <h2 className="font-[family-name:var(--font-display)] text-xl text-[var(--color-accent-soft)]">
          Verification documents
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Upload ID (both sides), your signed employment contract, and any other documents HR
          requires. Files are stored securely and visible only to you and SEAPS admins.
        </p>
        {docError ? <p className="mt-3 text-sm text-red-400">{docError}</p> : null}

        <ul className="mt-6 space-y-6">
          {UPLOAD_SLOTS.filter((slot) => slot.kind !== "profile_photo").map((slot) => {
            const uploaded = docsForKind(profile.documents, slot.kind);
            const busy = uploadingKind === slot.kind;
            return (
              <li
                key={slot.kind}
                className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4"
              >
                <p className="font-medium text-[var(--color-text)]">
                  {agentDocumentKindLabel(slot.kind)}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-muted)]">{slot.hint}</p>

                {uploaded.length > 0 ? (
                  <ul className="mt-3 space-y-2">
                    {uploaded.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-sm)] bg-[var(--color-mist)]/40 px-3 py-2 text-sm"
                      >
                        <span className="min-w-0 truncate font-medium">{doc.fileName}</span>
                        <span className="text-xs text-[var(--color-muted)]">
                          {formatBytes(doc.sizeBytes)} ·{" "}
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </span>
                        <div className="flex shrink-0 gap-2">
                          <a
                            href={`/api/dashboard/agent-profile/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-[var(--color-accent-soft)] underline-offset-2 hover:underline"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            className="text-sm font-medium text-red-400 hover:underline"
                            onClick={() => removeDocument(doc.id)}
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-[var(--color-muted)]">No file uploaded yet.</p>
                )}

                <div className="mt-3">
                  <Label
                    htmlFor={`upload-${slot.kind}`}
                    className={cn(busy && "opacity-60")}
                  >
                    {slot.kind === "other" ? "Add document" : "Upload / replace"}
                  </Label>
                  <Input
                    id={`upload-${slot.kind}`}
                    type="file"
                    accept={slot.accept}
                    disabled={busy}
                    className="cursor-pointer file:mr-3 file:rounded-[var(--radius-sm)] file:border-0 file:bg-[var(--color-mist)] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-[var(--color-accent-soft)]"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      void uploadDocument(slot.kind, file);
                      e.target.value = "";
                    }}
                  />
                  {busy ? (
                    <p className="mt-1 text-xs text-[var(--color-muted)]">Uploading…</p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
