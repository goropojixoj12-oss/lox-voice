const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** Resolves optional live news iframe src from public env (YouTube video, channel live, or full embed URL). */
export function getLiveNewsEmbedSrc(): string | null {
  const raw = process.env.NEXT_PUBLIC_LIVE_NEWS_EMBED_URL?.trim();
  if (raw) return raw;

  const videoId = process.env.NEXT_PUBLIC_LIVE_NEWS_YOUTUBE_VIDEO_ID?.trim();
  if (videoId) {
    return `${YOUTUBE_EMBED_ORIGIN}/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  }

  const channelId = process.env.NEXT_PUBLIC_LIVE_NEWS_YOUTUBE_CHANNEL_ID?.trim();
  if (channelId) {
    return `${YOUTUBE_EMBED_ORIGIN}/embed/live_stream?channel=${encodeURIComponent(channelId)}&autoplay=1&mute=1&modestbranding=1&playsinline=1`;
  }

  return null;
}

export const LIVE_NEWS_HIGHLIGHTS_VIDEO_ID = "Ii9DyLywO3Q";

export function getLiveNewsHighlightsEmbedSrc(): string {
  return `${YOUTUBE_EMBED_ORIGIN}/embed/${LIVE_NEWS_HIGHLIGHTS_VIDEO_ID}?rel=0&modestbranding=1&playsinline=1`;
}
