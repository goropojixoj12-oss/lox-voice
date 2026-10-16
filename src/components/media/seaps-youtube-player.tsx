"use client";

type SeapsYoutubePlayerProps = {
  videoId: string;
  title: string;
};

/** Prestige-framed YouTube embed — gold chrome matches SEAPS site system. */
export function SeapsYoutubePlayer({ videoId, title }: SeapsYoutubePlayerProps) {
  const embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div className="seaps-youtube-player group relative">
      <div
        className="pointer-events-none absolute -inset-px rounded-[var(--radius-xl)] opacity-80"
        aria-hidden
        style={{
          background:
            "linear-gradient(105deg, #9a7420, #d4af37, #fff8dc, #d4af37, #9a7420)",
          backgroundSize: "200% 200%",
          animation: "seapsGoldFlow 8s linear infinite",
        }}
      />
      <div className="seaps-card relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-background)] p-2 sm:p-3">
        <div className="border-b border-[rgba(212,175,55,0.35)] px-3 py-2 sm:px-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-accent-soft)]">
            Awards & recognition
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted)]">{title}</p>
        </div>
        <div className="relative mt-2 aspect-video overflow-hidden rounded-[var(--radius-lg)] bg-[#050d18] shadow-[inset_0_0_40px_rgba(0,0,0,0.45)]">
          <iframe
            src={embedSrc}
            title={title}
            className="absolute inset-0 h-full w-full border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
