"use client";

import Image from "next/image";
import { cn } from "@/lib/utils";

type SeapsLogoProps = {
  className?: string;
  /** header = compact nav mark, hero = accent, footer = quiet */
  size?: "header" | "hero" | "footer";
};

/** Intrinsic asset ratio ~488×310 */
const sizeClass: Record<NonNullable<SeapsLogoProps["size"]>, string> = {
  header: "h-8 w-[50px] sm:h-9 sm:w-[56px]",
  hero: "h-12 w-[78px] sm:h-[3.25rem] sm:w-[88px]",
  footer: "h-[52px] w-[82px]",
};

export function SeapsLogo({ className, size = "header" }: SeapsLogoProps) {
  return (
    <span
      className={cn(
        "seaps-logo seaps-logo-shine-wrap relative inline-block shrink-0",
        sizeClass[size],
        className,
      )}
      aria-label="SEAPS — South East Asia Property Services"
    >
      <Image
        src="/brand/seaps-logo.png"
        alt="SEAPS — South East Asia Property Services"
        width={488}
        height={310}
        className="seaps-logo-img h-full w-full object-contain"
        priority={size !== "footer"}
      />
      <span className="seaps-logo-shine" aria-hidden="true" />
    </span>
  );
}
