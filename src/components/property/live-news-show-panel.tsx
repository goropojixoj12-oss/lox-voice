"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { articles } from "@/data/articles";
import {
  getLiveNewsEmbedSrcForListing,
  getLiveNewsHighlightsEmbedSrc,
} from "@/lib/live-news-show";

const REFRESH_MS = 4 * 60 * 60 * 1000;

type StreamMode = "live" | "fallback";

export function LiveNewsShowPanel({ listingSlug }: { listingSlug?: string }) {
  const configuredSrc = getLiveNewsEmbedSrcForListing(listingSlug);
  const [streamMode, setStreamMode] = useState<StreamMode>(
    configuredSrc ? "live" : "fallback",
  );
  const [iframeKey, setIframeKey] = useState(0);
  const loadTimerRef = useRef<number | null>(null);

  const liveSrc = configuredSrc ?? getLiveNewsHighlightsEmbedSrc();
  const highlights = articles.filter((a) => a.category === "news" || a.category === "guides").slice(0, 3);

  const clearLoadTimer = useCallback(() => {
    if (loadTimerRef.current !== null) {
      window.clearTimeout(loadTimerRef.current);
      loadTimerRef.current = null;
    }
  }, []);

  const scheduleLoadWatch = useCallback(() => {
    clearLoadTimer();
    if (streamMode !== "live" || !configuredSrc) return;
    loadTimerRef.current = window.setTimeout(() => {
      setStreamMode("fallback");
    }, 18_000);
  }, [clearLoadTimer, configuredSrc, streamMode]);

  useEffect(() => {
    scheduleLoadWatch();
    return clearLoadTimer;
  }, [scheduleLoadWatch, clearLoadTimer, iframeKey]);

  useEffect(() => {
    const id = window.setInterval(() => {
      if (streamMode === "live" && configuredSrc) {
        setIframeKey((k) => k + 1);
      }
    }, REFRESH_MS);
    return () => window.clearInterval(id);
  }, [configuredSrc, streamMode]);

  const showLiveFrame = streamMode === "live";
  const embedSrc = showLiveFrame ? liveSrc : getLiveNewsHighlightsEmbedSrc();

  return (
    <div className="flex w-full flex-col overflow-hidden rounded-[var(--radius-xl)] border border-[rgba(212,175,55,0.35)] bg-[var(--color-secondary)] shadow-[inset_0_0_32px_rgba(0,0,0,0.35)]">
      <div className="relative aspect-[16/10] w-full bg-[#050d18]">
        {showLiveFrame ? (
          <iframe
            key={iframeKey}
            src={embedSrc}
            title="SEAPS live news show"
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
            onLoad={() => clearLoadTimer()}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col">
            <iframe
              src={embedSrc}
              title="SEAPS news highlights"
              className="min-h-0 flex-1 border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
            />
            <div className="shrink-0 border-t border-[rgba(212,175,55,0.25)] bg-[var(--color-background)] px-4 py-3">
              <p className="text-sm font-medium text-[var(--color-text)]">
                No live feed available
              </p>
              <p className="mt-1 text-xs text-[var(--color-muted)]">
                Showing property news highlights until the broadcast reconnects.
              </p>
              <ul className="mt-3 space-y-2 text-sm">
                {highlights.map((article) => {
                  const href =
                    article.category === "guides"
                      ? `/guides/${article.slug}`
                      : `/insights/${article.slug}`;
                  return (
                    <li key={article.id}>
                      <Link
                        href={href}
                        className="text-[var(--color-accent-soft)] underline-offset-2 hover:underline"
                      >
                        {article.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
              {configuredSrc ? (
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold uppercase tracking-wide text-[var(--color-accent)] hover:text-[var(--color-accent-soft)]"
                  onClick={() => {
                    setStreamMode("live");
                    setIframeKey((k) => k + 1);
                  }}
                >
                  Retry live stream
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
      <div
        className="flex items-center gap-3 border-t border-[rgba(212,175,55,0.4)] bg-[var(--color-background)] px-3 py-2"
        aria-live="polite"
      >
        <span className="relative flex h-2 w-2 shrink-0">
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${showLiveFrame && configuredSrc ? "animate-ping bg-red-500" : "bg-[var(--color-muted)]"}`}
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${showLiveFrame && configuredSrc ? "bg-red-600" : "bg-[var(--color-muted)]"}`}
          />
        </span>
        <p className="min-w-0 flex-1 truncate text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent-soft)]">
          Live News Show
        </p>
        <p className="hidden text-[10px] uppercase tracking-wider text-[var(--color-muted)] sm:block">
          {showLiveFrame && configuredSrc ? "Streaming" : "Highlights"}
        </p>
      </div>
    </div>
  );
}
