import { cn } from "@/lib/utils";

type SeapsLogoProps = {
  className?: string;
  compact?: boolean;
};

export function SeapsLogo({ className, compact = false }: SeapsLogoProps) {
  const gid = compact ? "seapsGoldCompact" : "seapsGoldFull";
  const glowId = compact ? "seapsGlowCompact" : "seapsGlowFull";

  return (
    <span
      className={cn("seaps-logo inline-flex items-center justify-center", className)}
      aria-label="SEAPS — South East Asia Property Services"
    >
      <svg
        viewBox="0 0 320 210"
        className={cn(compact ? "h-11 w-auto sm:h-12" : "h-[4.5rem] w-auto md:h-24", "seaps-gold-shine")}
        role="img"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7A5E14" />
            <stop offset="22%" stopColor="#C9A227" />
            <stop offset="48%" stopColor="#FFE9A8" />
            <stop offset="72%" stopColor="#D4AF37" />
            <stop offset="100%" stopColor="#7A5E14" />
            <animate
              attributeName="x1"
              values="-80%;20%;-80%"
              dur="8s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="x2"
              values="20%;120%;20%"
              dur="8s"
              repeatCount="indefinite"
            />
          </linearGradient>
          <filter id={glowId} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g
          fill="none"
          stroke={`url(#${gid})`}
          strokeWidth="5.5"
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
            fontSize: "58px",
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
            fontSize: "12px",
            fontWeight: 500,
            letterSpacing: "0.16em",
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
