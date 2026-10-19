import Image from "next/image";
import type { Agent } from "@/lib/types";
import { agentPhotoUrl } from "@/lib/agent-photo";
import { cn } from "@/lib/utils";

type AgentAvatarProps = {
  agent: Agent;
  /** Overrides agent.name for alt text when profile name differs. */
  displayName?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizeClass: Record<NonNullable<AgentAvatarProps["size"]>, string> = {
  sm: "h-14 w-14",
  md: "h-20 w-20",
  lg: "h-40 w-40",
};

const sizePixels: Record<NonNullable<AgentAvatarProps["size"]>, number> = {
  sm: 56,
  md: 80,
  lg: 160,
};

export function AgentAvatar({
  agent,
  displayName,
  size = "sm",
  className,
  priority = false,
}: AgentAvatarProps) {
  const px = sizePixels[size];
  const alt = displayName?.trim() || agent.name;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-[rgba(212,175,55,0.45)] bg-[var(--color-mist)]",
        sizeClass[size],
        className,
      )}
    >
      <Image
        src={agentPhotoUrl(agent)}
        alt={alt}
        fill
        className="object-cover"
        sizes={`${px}px`}
        priority={priority}
      />
    </div>
  );
}
