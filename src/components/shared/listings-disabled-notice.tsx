import Link from "next/link";
import { LISTINGS_DISABLED_MESSAGE } from "@/lib/listings-policy";

export function ListingsDisabledNotice({ className }: { className?: string }) {
  return (
    <div
      className={
        className ??
        "rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center"
      }
    >
      <p className="text-[var(--color-muted)]">{LISTINGS_DISABLED_MESSAGE}</p>
      <p className="mt-4">
        <Link href="/contact" className="font-semibold text-[var(--color-accent-soft)] underline">
          Contact us
        </Link>
      </p>
    </div>
  );
}
