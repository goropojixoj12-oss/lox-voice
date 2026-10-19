import { cn } from "@/lib/utils";

type ProfileCompletionRingProps = {
  percent: number;
  size?: number;
  className?: string;
};

export function ProfileCompletionRing({
  percent,
  size = 132,
  className,
}: ProfileCompletionRingProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Profile ${clamped} percent complete`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(212, 175, 55, 0.2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-accent-soft)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="font-[family-name:var(--font-display)] text-3xl text-[var(--color-accent-soft)]">
          {clamped}%
        </span>
        <span className="text-[0.65rem] uppercase tracking-wide text-[var(--color-muted)]">
          Profile
        </span>
      </div>
    </div>
  );
}
