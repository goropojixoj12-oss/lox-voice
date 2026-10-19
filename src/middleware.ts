import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname === "/dashboard/agent/list-property") {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard/agent/list-property/step1";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/agent/list-property"],
};
