import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroMainLayoutProps = {
  copy: ReactNode;
  aside: ReactNode;
  className?: string;
};

export function HeroMainLayout({ copy, aside, className }: HeroMainLayoutProps) {
  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10",
        className,
      )}
    >
      <div className="min-w-0 text-white">{copy}</div>
      <div className="flex w-full min-w-0 flex-col lg:justify-self-end">{aside}</div>
    </div>
  );
}
