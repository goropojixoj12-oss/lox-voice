/** Base path for the platform admin desk (role: admin). */
export const ADMIN_DESK_BASE = "/dashboard/admin";

export function adminDeskPath(...segments: string[]): string {
  const tail = segments
    .map((s) => s.replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return tail ? `${ADMIN_DESK_BASE}/${tail}` : ADMIN_DESK_BASE;
}
