import { NextResponse } from "next/server";
import { verifySessionToken } from "./lib/auth";

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|api/login|quote/|api/public-quote/).*)"],
};

export async function middleware(request) {
  const token = request.cookies.get("ibox_session")?.value;
  const secret = process.env.SESSION_SECRET;
  const valid = secret ? await verifySessionToken(token, secret) : false;

  if (!valid) {
    if (request.nextUrl.pathname.startsWith("/api")) {
      return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}
