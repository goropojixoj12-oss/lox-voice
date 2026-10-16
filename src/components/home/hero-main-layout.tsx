"use client";

import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type HeroMainLayoutProps = {
  copy: ReactNode;
  aside: ReactNode;
  className?: string;
};

export function HeroMainLayout({ copy, aside, className }: HeroMainLayoutProps) {
  const copyRef = useRef<HTMLDivElement>(null);
  const [asideHeight, setAsideHeight] = useState<number | null>(null);

  useLayoutEffect(() => {
    const el = copyRef.current;
    if (!el) return;

    const mq = window.matchMedia("(min-width: 1024px)");

    const update = () => {
      if (!mq.matches) {
        setAsideHeight(null);
        return;
      }
      setAsideHeight(el.getBoundingClientRect().height);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    mq.addEventListener("change", update);
    window.addEventListener("resize", update);

    return () => {
      ro.disconnect();
      mq.removeEventListener("change", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div
      className={cn(
        "grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10",
        className,
      )}
    >
      <div ref={copyRef} className="min-w-0 text-white">
        {copy}
      </div>
      <div
        className="flex w-full min-h-0 flex-col lg:justify-self-end"
        style={asideHeight != null ? { height: asideHeight } : undefined}
      >
        {aside}
      </div>
    </div>
  );
}
