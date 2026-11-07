"use client";

import { Play } from "lucide-react";
import { cn } from "@/lib/utils";

/** The deck listens for this event, so the hero can open it from the server page. */
export const OPEN_PRESENTATION_EVENT = "seaps:open-presentation";

export function OpenPresentationButton({
  slides,
  className,
}: {
  slides: number;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new CustomEvent(OPEN_PRESENTATION_EVENT))}
      className={cn(
        "seaps-btn-gold inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[#0B1C33] shadow-[var(--shadow-lift)] transition hover:brightness-105",
        className,
      )}
    >
      <Play className="h-4 w-4 fill-current" />
      Play the presentation
      <span className="text-xs font-normal opacity-70">{slides} slides</span>
    </button>
  );
}