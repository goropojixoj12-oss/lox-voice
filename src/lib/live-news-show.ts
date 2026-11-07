const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** Vue Aston studio listing (Koh Norea). */
export const VUE_ASTON_STUDIO_ZERO_PHOTO_SLUG =
  "cheapest-ever-studio-sold-vue-aston-never-seen-before-foreign-ownership-approved-hard-title-_ZFWs";

/** Kampot architect house: the owner asked for no news box on this card. */
export const KAMPOT_ARCHITECT_ZERO_PHOTO_SLUG =
  "stunning-architectural-masterpiece-large-executive-3-bedroom-all-ensuites-modern-colonial-style-house-beautiful-pool-western-award-winning-architect-a-personal-project-designed-built-and-proudly-displayed-by-one-of-cambodia-s-most-respected-and-trusted-architect-builders-dA5Dl";

const LISTINGS_WITHOUT_LIVE_NEWS_PANEL: ReadonlySet<string> = new Set([
  KAMPOT_ARCHITECT_ZERO_PHOTO_SLUG,
]);

/** When false, a zero-photo gallery renders nothing instead of the news box. */
export function shouldShowLiveNewsPanelForListing(slug: string | undefined): boolean {
  if (!slug) return true;
  return !LISTINGS_WITHOUT_LIVE_NEWS_PANEL.has(slug);
}

/** Resolves the optional live news iframe src from public env (YouTube video, channel live, or full embed URL). */
export function getLiveNewsEmbedSrc(): string | null {
  const raw = process.env.NEXT_PUBLIC_LIVE_NEWS_EMBED_URL?.trim();
  if (raw) return raw;

  const videoId = process.env.NEXT_PUBLIC_LIVE_NEWS_YOUTUBE_VIDEO_ID?.trim();
  if (videoId) {
    return `${YOUTUBE_EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  }

  const channelId = process.env.NEXT_PUBLIC_LIVE_NEWS_YOUTUBE_CHANNEL_ID?.trim();
  if (channelId) {
    return `${YOUTUBE_EMBED_ORIGIN}/embed/live_stream?channel=${encodeURIComponent(channelId)}&autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1`;
  }

  return null;
}

export const LIVE_NEWS_HIGHLIGHTS_VIDEO_ID = "Ii9DyLywO3Q";

export function getLiveNewsHighlightsEmbedSrc(): string {
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${LIVE_NEWS_HIGHLIGHTS_VIDEO_ID}?rel=0&modestbranding=1&playsinline=1`;
}