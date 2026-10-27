import { brand } from "@/config/brand";
import { cn } from "@/lib/utils";
import {
  FacebookIcon,
  InstagramIcon,
  LinkedInIcon,
  RedditIcon,
  TelegramIcon,
  TikTokIcon,
  WeChatIcon,
  WhatsAppIcon,
} from "@/components/home/social-icons";

const iconClass = "h-[1.35rem] w-[1.35rem] sm:h-6 sm:w-6";

const networks = [
  { key: "telegram" as const, label: "Telegram", Icon: TelegramIcon },
  { key: "facebook" as const, label: "Facebook", Icon: FacebookIcon },
  { key: "whatsapp" as const, label: "WhatsApp", Icon: WhatsAppIcon },
  { key: "tiktok" as const, label: "TikTok", Icon: TikTokIcon },
  { key: "linkedin" as const, label: "LinkedIn", Icon: LinkedInIcon },
  { key: "reddit" as const, label: "Reddit", Icon: RedditIcon },
  { key: "wechat" as const, label: "WeChat", Icon: WeChatIcon },
  { key: "instagram" as const, label: "Instagram", Icon: InstagramIcon },
];

export function HeroSocialLinks({ className }: { className?: string }) {
  return (
    <ul
      className={cn(
        "flex flex-wrap items-center justify-center gap-2.5 sm:gap-3",
        className,
      )}
      aria-label="SEAPS on social media"
    >
      {networks.map(({ key, label, Icon }) => {
        const href = brand.social[key];
        const isPlaceholder = !href || href === "#";
        return (
          <li key={key}>
            <a
              href={href || "#"}
              target={isPlaceholder ? undefined : "_blank"}
              rel={isPlaceholder ? undefined : "noopener noreferrer"}
              aria-label={label}
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full border border-[rgba(212,175,55,0.55)] bg-[rgba(255,255,255,0.08)] text-[var(--color-accent-soft)] transition hover:border-[rgba(240,215,140,0.85)] hover:bg-[rgba(212,175,55,0.18)] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
            >
              <Icon className={iconClass} />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
