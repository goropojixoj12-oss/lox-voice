"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { Agent } from "@/lib/types";
import { agentPhotoUrl } from "@/lib/agent-photo";
import { cn } from "@/lib/utils";

type AgentAvatarProps = {
  agent: Agent;
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizeClass: Record<NonNullable<AgentAvatarProps["size"]>, string> = {
  sm: "h-14 w-14 min-h-14 min-w-14",
  md: "h-20 w-20 min-h-20 min-w-20",
  lg: "h-40 w-40 min-h-40 min-w-40",
};

const sizePixels: Record<NonNullable<AgentAvatarProps["size"]>, number> = {
  sm: 56,
  md: 80,
  lg: 160,
};

const initialsClass: Record<NonNullable<AgentAvatarProps["size"]>, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-2xl",
};

function agentInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) {
    const one = parts[0]!;
    return one.slice(0, 2).toUpperCase();
  }
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function AgentAvatar({
  agent,
  displayName,
  size = "sm",
  className,
  priority = false,
}: AgentAvatarProps) {
  const label = displayName?.trim() || agent.name;
  const px = sizePixels[size];
  const initials = useMemo(() => agentInitials(label), [label]);

  const [src, setSrc] = useState(() => agentPhotoUrl(agent));
  const [showInitials, setShowInitials] = useState(false);

  return (
    <div
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[rgba(212,175,55,0.45)] bg-[var(--color-mist)]",
        sizeClass[size],
        className,
      )}
      role="img"
      aria-label={label}
    >
      {showInitials ? (
        <span
          className={cn(
            "select-none font-semibold tracking-wide text-[var(--color-accent-soft)]",
            initialsClass[size],
          )}
        >
          {initials}
        </span>
      ) : (
        <Image
          src={src}
          alt=""
          fill
          unoptimized
          className="object-cover object-center"
          sizes={`${px}px`}
          priority={priority}
          onError={() => {
            if (src !== agent.photo) {
              setSrc(agent.photo);
              return;
            }
            setShowInitials(true);
          }}
        />
      )}
    </div>
  );
}
