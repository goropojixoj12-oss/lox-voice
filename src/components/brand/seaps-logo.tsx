"use client";

import Image from "next/image";
import { useId } from "react";
import { cn } from "@/lib/utils";

type SeapsLogoProps = {
  className?: string;
  compact?: boolean;
  /** Use the brand mark image with gold treatment */
  variant?: "svg" | "image";
};

export function SeapsLogo({
  className,
  compact = false,
  variant = "svg",
}: SeapsLogoProps) {
  const uid = useId().replace(/:/g, "");
  const gid = `seapsGold-${uid}`;
  const glowId = `seapsGlow-${uid}`;

  if (variant === "image") {
    return (
      <span
        className={cn("seaps-logo inline-flex items-center justify-center", className)}
        aria-label="SEAPS — South East Asia Property Services"
      >
        <Image
          src="/brand/seaps-logo.png"
          alt="SEAPS — South East Asia Property Services"
          width={compact ? 160 : 280}
          height={compact ? 100 : 180}
          className={cn(
            "seaps-logo-img h-auto w-auto object-contain",
            compact ? "h-12 w-auto max-w-[160px] sm:h-14 sm:max-w-[200px]" : "h-24 w-auto max-w-[280px] md:h-28",
          )}
          priority
        />
      </span>
    );
  }

  return (
    <span
      className={cn("seaps-logo inline-flex items-center justify-center", className)}
      aria-label="SEAPS — South East Asia Property Services"
    >
      <svg
        viewBox={compact ? "40 10 240 170" : "0 0 320 210"}
        className={cn(
          "seaps-gold-shine block",
          compact ? "h-12 w-auto max-w-[200px] sm:h-14" : "h-24 w-auto max-w-[300px] md:h-28",
        )}
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9A227" />
            <stop offset="35%" stopColor="#FFE9A8" />
            <stop offset="65%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#C9A227" />
            <animate attributeName="x1" values="-40%;40%;-40%" dur="8s" repeatCount="indefinite" />
            <animate attributeName="x2" values="60%;140%;60%" dur="8s" repeatCount="indefinite" />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth={compact ? 6 : 5.5}
          strokeLinejoin="round"
          filter={`url(#${glowId})`}
        >
          <path d="M48 74 L160 18 L272 74" />
          <rect x="140" y="40" width="40" height="30" />
          <path d="M160 40 V70" />
          <path d="M140 55 H180" />
        </g>

        <text
          x="160"
          y="122"
          textAnchor="middle"
          fill={`url(#${gid})`}
          filter={`url(#${glowId})`}
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: compact ? "64px" : "58px",
            fontWeight: 700,
            letterSpacing: "0.1em",
          }}
        >
          SEAPS
        </text>

        <text
          x="160"
          y="152"
          textAnchor="middle"
          fill={`url(#${gid})`}
          style={{
            fontFamily: "var(--font-display), Georgia, serif",
            fontSize: compact ? "13px" : "12px",
            fontWeight: 600,
            letterSpacing: "0.12em",
          }}
        >
          SOUTH EAST ASIA PROPERTY SERVICES
        </text>

        <path
          d="M60 180 C100 164, 130 196, 160 180 C190 164, 220 196, 260 180"
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="4.5"
          strokeLinecap="round"
          filter={`url(#${glowId})`}
        />
      </svg>
    </span>
  );
}
