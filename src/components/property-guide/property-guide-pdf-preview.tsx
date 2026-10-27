import { ExternalLink, FileText } from "lucide-react";

export const SEAPS_PROPERTY_GUIDE_PDF_URL =
  "https://seaps.asia/wp-content/uploads/2026/03/SEAPS-MAGAZINE-2026-0119-3.pdf";

export function PropertyGuidePdfPreview() {
  return (
    <a
      href={SEAPS_PROPERTY_GUIDE_PDF_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="group seaps-card mt-10 block max-w-md overflow-hidden rounded-[var(--radius-xl)] transition hover:border-[rgba(240,215,140,0.85)] hover:shadow-[0_0_0_1px_rgba(212,175,55,0.35)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
      aria-label="Open SEAPS Property Guide PDF on seaps.asia (opens in a new tab)"
    >
      <div className="relative aspect-[3/4] w-full bg-[linear-gradient(165deg,#0a1628_0%,#132238_45%,#1a2d4a_100%)] p-6 sm:p-8">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,rgba(212,175,55,0.12)_0%,transparent_55%)]" />
        <div className="relative flex h-full flex-col border border-[rgba(212,175,55,0.45)] bg-[rgba(5,13,24,0.35)] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent)]">
              SEAPS
            </p>
            <span className="inline-flex items-center gap-1 rounded-full border border-[rgba(212,175,55,0.5)] bg-[rgba(212,175,55,0.08)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-accent-soft)]">
              PDF
            </span>
          </div>
          <div className="mt-auto space-y-3">
            <FileText
              className="h-12 w-12 text-[var(--color-accent-soft)] opacity-90"
              strokeWidth={1.25}
              aria-hidden
            />
            <p className="font-[family-name:var(--font-display)] text-2xl leading-snug text-[var(--color-accent-soft)] sm:text-3xl">
              Property Guide
            </p>
            <p className="text-sm text-[var(--color-muted)]">SEAPS Magazine · 2026 edition</p>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-[var(--color-accent)] transition group-hover:text-[var(--color-accent-soft)]">
            <span>View or download on seaps.asia</span>
            <ExternalLink className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          </div>
        </div>
      </div>
      <p className="border-t border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-center text-sm text-[var(--color-muted)]">
        Click the preview to open the PDF on{" "}
        <span className="font-medium text-[var(--color-accent-soft)]">seaps.asia</span>
      </p>
    </a>
  );
}
