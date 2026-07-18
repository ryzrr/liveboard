import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  if (!req.auth) {
    const url = new URL("/auth/signin", req.url);
    url.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: [
    "/overview/:path*",
    "/endpoints/:path*",
    "/traces/:path*",
    "/alerts/:path*",
    "/pipelines/:path*",
    "/settings/:path*",
  ],
};
