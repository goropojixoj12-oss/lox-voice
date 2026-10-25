import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroMainLayoutProps = {
  /** Logo and brand line — occupies the first row on large screens. */
  copyLead?: ReactNode;
  copy: ReactNode;
  aside: ReactNode;
  className?: string;
};

export function HeroMainLayout({ copyLead, copy, aside, className }: HeroMainLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-x-10 lg:gap-y-4",
        className,
      )}
    >
      {copyLead ? (
        <>
          <div className="min-w-0 text-white lg:col-start-1 lg:row-start-1">{copyLead}</div>
          <div className="min-w-0 text-white lg:col-start-1 lg:row-start-2 lg:-mt-2">{copy}</div>
          <div className="flex w-full min-w-0 flex-col lg:col-start-2 lg:row-start-2 lg:-mt-5 lg:justify-self-stretch xl:-mt-6">
            {aside}
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 text-white">{copy}</div>
          <div className="flex w-full min-w-0 flex-col lg:justify-self-end">{aside}</div>
        </>
      )}
    </div>
  );
}
