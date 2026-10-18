import { cn } from "@/lib/utils";

/**
 * Visible gold label + animated gradient layer on top.
 * If background-clip:text fails, the base layer stays readable.
 */
export function LivingGold({
  children,
  className,
  as: Tag = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "div";
}) {
  return (
    <Tag className={cn("seaps-living-gold", className)}>
      <span className="seaps-living-gold__base">{children}</span>
      <span className="seaps-living-gold__flow" aria-hidden>
        {children}
      </span>
    </Tag>
  );
}
