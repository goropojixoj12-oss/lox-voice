import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "accent" | "outline";
type Size = "sm" | "md" | "lg";

const variants: Record<Variant, string> = {
  primary:
    "seaps-btn-gold seaps-gold-shine text-[#0B1C33] shadow-[var(--shadow-soft)] hover:brightness-105",
  secondary:
    "bg-[var(--color-secondary)] text-[var(--color-text)] hover:bg-[var(--color-sand)]",
  ghost: "bg-transparent text-[var(--color-text)] hover:bg-[var(--color-mist)]",
  accent:
    "seaps-btn-gold seaps-gold-shine text-[#0B1C33] shadow-[var(--shadow-lift)] hover:brightness-105",
  outline: "seaps-btn-gold-outline",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm",
  lg: "h-12 px-5 text-base",
};

const base =
  "inline-flex items-center justify-center rounded-[var(--radius-md)] font-medium transition-[filter,transform,opacity] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)] disabled:opacity-50 disabled:pointer-events-none";

export function Button({
  className,
  variant = "primary",
  size = "md",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
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
      <span className="relative z-[1] inline-flex items-center justify-center gap-2">
        {children}
      </span>
    </Link>
  );
}
