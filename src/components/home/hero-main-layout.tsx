import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroMainLayoutProps = {
  /** Logo and brand line — occupies the first row on large screens. */
  copyLead?: ReactNode;
  /** Body copy below copyLead; omit when copyLead includes the full intro column. */
  copy?: ReactNode;
  aside: ReactNode;
  className?: string;
};

export function HeroMainLayout({ copyLead, copy, aside, className }: HeroMainLayoutProps) {
  const copyLeadRows = copy ? 2 : 1;

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
          {copy ? (
            <div className="min-w-0 text-white lg:col-start-1 lg:row-start-2 lg:-mt-2">{copy}</div>
          ) : null}
          <div
            className={cn(
              "flex w-full min-w-0 flex-col lg:col-start-2 lg:row-start-1 lg:justify-center lg:justify-self-stretch lg:pl-2 xl:pl-4",
              copyLeadRows === 2 ? "lg:row-span-2" : "lg:row-span-1",
            )}
          >
            {aside}
          </div>
        </>
      ) : (
        <>
          <div className="min-w-0 text-white">{copy ?? null}</div>
          <div className="flex w-full min-w-0 flex-col lg:justify-self-end">{aside}</div>
        </>
      )}
    </div>
  );
}
