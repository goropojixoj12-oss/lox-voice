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
        "grid gap-7 sm:gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start lg:gap-x-12 lg:gap-y-5",
        className,
      )}
    >
      {copyLead ? (
        <>
          <div className="min-w-0 text-white lg:col-start-1 lg:row-start-1">{copyLead}</div>
          <div className="min-w-0 text-white lg:col-start-1 lg:row-start-2 lg:-mt-2">{copy}</div>
          <div className="flex w-full min-w-0 flex-col lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:justify-center lg:justify-self-stretch lg:pl-2 xl:pl-4">
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
