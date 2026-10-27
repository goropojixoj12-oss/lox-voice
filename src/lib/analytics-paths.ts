/** Paths we record for site analytics (real HTTP navigations + SPA route changes). */
export function isAnalyticsPath(pathname: string): boolean {
  if (!pathname || pathname.startsWith("/api")) return false;
  if (pathname.startsWith("/_next")) return false;
  if (pathname.startsWith("/media/")) return false;
  if (pathname.startsWith("/videos/")) return false;
  if (pathname.startsWith("/brand/")) return false;
  if (pathname.startsWith("/fonts/")) return false;
  if (pathname.startsWith("/scripts/")) return false;
  if (/\.[a-z0-9]{2,5}$/i.test(pathname)) return false;
  return true;
}

export function isDocumentNavigation(request: Request): boolean {
  const dest = request.headers.get("sec-fetch-dest");
  if (dest === "document") return true;
  const mode = request.headers.get("sec-fetch-mode");
  if (mode === "navigate") return true;
  const accept = request.headers.get("accept") ?? "";
  return accept.includes("text/html");
}
