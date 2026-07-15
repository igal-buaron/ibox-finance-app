import { NextResponse } from "next/server";
import { createSessionToken } from "../../../lib/auth";

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }

  if (!process.env.APP_PASSWORD || !process.env.SESSION_SECRET) {
    return NextResponse.json(
      { error: "המערכת לא הוגדרה כראוי - חסרים משתני סביבה ב-Vercel" },
      { status: 500 }
    );
  }

  if (body.password !== process.env.APP_PASSWORD) {
    return NextResponse.json({ error: "קוד שגוי" }, { status: 401 });
  }

  const token = await createSessionToken(process.env.SESSION_SECRET);
  const res = NextResponse.json({ ok: true });
  res.cookies.set("ibox_session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}
