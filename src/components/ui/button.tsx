import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "bg-[var(--color-accent)] text-[#0B1C33] hover:bg-[var(--color-accent-soft)] shadow-[var(--shadow-soft)]",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-sand)]",
  ghost: "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-mist)]",
  accent:
    "bg-[linear-gradient(110deg,#8a6a1a,#d4af37,#f8e7a1,#d4af37,#8a6a1a)] bg-[length:220%_100%] text-[#0B1C33] shadow-[var(--shadow-lift)] hover:brightness-105 animate-[seapsGoldSlide_7s_ease-in-out_infinite]",
  outline:
    "border border-[var(--color-accent)]/40 bg-[var(--color-surface)] text-[var(--color-accent-soft)] hover:border-[var(--color-accent)]",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none";

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props} />
  );
}

export function ButtonLink({
  href,
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: Variant; size?: Size }) {
  return (
    <Link
      href={href}
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </Link>
  );
}
