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
  header: "h-10 w-[62px] sm:h-11 sm:w-[70px]",
  hero: "h-14 w-[90px] sm:h-16 sm:w-[102px]",
  footer: "h-[64px] w-[101px]",
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
