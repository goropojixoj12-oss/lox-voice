"use client";

import Image from "next/image";
import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type ParallaxSectionProps = {
  /** Cover photo. Without it the block falls back to the brand gradient. */
  imageUrl?: string | null;
  alt?: string;
  /** Media travel in pixels for every pixel scrolled; content drifts the other way. */
  speed?: number;
  className?: string;
  contentClassName?: string;
  /** Badge over the photo, usually "For sale · Condominium". */
  priority?: boolean;
  children: ReactNode;
};

/**
 * Full-bleed photo band where the photo moves slower than the page and the
 * content drifts the opposite way. One scroll listener per block, work happens
 * inside requestAnimationFrame, and nothing at all happens when the visitor
 * asks for reduced motion.
 */
export function ParallaxSection({
  imageUrl,
  alt = "",
  speed = 0.28,
  className,
  contentClassName,
  priority = false,
  children,
}: ParallaxSectionProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      // How much of the block has already passed the top of the viewport.
      const passed = Math.max(0, Math.min(rect.height, -rect.top));
      root.style.setProperty("--seaps-parallax", `${passed * speed}px`);
      root.style.setProperty(
        "--seaps-parallax-fade",
        String(Math.max(0.25, 1 - passed / (rect.height * 1.1))),
      );
    };
    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [speed]);

  return (
    <div ref={rootRef} className={cn("relative isolate overflow-hidden", className)}>
      {imageUrl ? (
        <div className="absolute inset-0 -z-10">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            priority={priority}
            sizes="100vw"
            className="seaps-parallax-media object-cover"
          />
        </div>
      ) : (
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(160deg,var(--color-primary)_0%,var(--color-primary-soft)_55%,#04080e_100%)]" />
      )}

      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_top,rgba(4,8,14,0.97)_0%,rgba(4,8,14,0.84)_36%,rgba(4,8,14,0.34)_66%,rgba(4,8,14,0.72)_100%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(4,8,14,0.74)_0%,rgba(4,8,14,0.34)_52%,rgba(4,8,14,0.04)_100%)]" />

      <div className={cn("seaps-parallax-content relative", contentClassName)}>{children}</div>
    </div>
  );
}