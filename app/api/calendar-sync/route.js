import { NextResponse } from "next/server";
import { verifySessionToken } from "../../../lib/auth";
import {
  getSyncSettings, saveCalendarUrl, syncCalendar, normalizeCalendarUrl, createRemindersKey,
} from "../../../lib/icalSync";

async function checkAuth(request) {
  const token = request.cookies.get("ibox_session")?.value;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  return verifySessionToken(token, secret);
}

export async function GET(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  const settings = await getSyncSettings();
  return NextResponse.json({
    connected: Boolean(settings.url),
    lastSyncAt: settings.lastSyncAt || 0,
    lastError: settings.lastError || "",
    remindersConnected: Boolean(settings.remindersKeyHash),
    remindersLastAt: settings.remindersLastAt || 0,
    remindersCount: settings.remindersCount || 0,
  });
}

// action: "connect" (שמירת קישור + סנכרון), "disconnect", או "sync" (סנכרון אם עברו כמה דקות; force=true תמיד)
export async function POST(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }
  try {
    if (body.action === "connect") {
      const url = normalizeCalendarUrl(body.url);
      if (!url) {
        return NextResponse.json({ error: "הקישור לא תקין - צריך קישור webcal של לוח שנה ציבורי מ-iCloud" }, { status: 400 });
      }
      await saveCalendarUrl(url);
      return NextResponse.json(await syncCalendar({ force: true }));
    }
    if (body.action === "disconnect") {
      await saveCalendarUrl("");
      return NextResponse.json({ ok: true });
    }
    if (body.action === "createRemindersKey") {
      // מפתח חדש מבטל את הקודם
      return NextResponse.json({ ok: true, key: await createRemindersKey() });
    }
    if (body.action === "sync") {
      return NextResponse.json(await syncCalendar({ force: Boolean(body.force) }));
    }
    return NextResponse.json({ error: "פעולה לא תקינה" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: "שגיאה בסנכרון היומן" }, { status: 500 });
  }
}
