import { cn } from "@/lib/utils";

/**
 * Archived living-gold look (--gold-flow + seapsGoldFlow) with a visible
 * #d4af37 underlay when background-clip:text fails (Chrome header nav).
 */
export function SeapsGoldLabel({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("seaps-gold-label", className)}>
      <span className="seaps-gold-label__under">{children}</span>
      <span className="seaps-gold-label__flow" aria-hidden>
        {children}
      </span>
    </span>
  );
}
