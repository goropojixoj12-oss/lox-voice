/** Client-safe mirror of server flag (must match SEAPS_ENABLE_SITE_CHANGE_REQUESTS on Vercel). */
export function publicAdminSiteChangeAutomationEnabled(): boolean {
  const raw = process.env.NEXT_PUBLIC_SEAPS_ENABLE_SITE_CHANGE_REQUESTS?.trim().toLowerCase();
  return raw === "1" || raw === "true" || raw === "yes";
}
