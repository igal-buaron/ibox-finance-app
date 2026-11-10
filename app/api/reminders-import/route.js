import { NextResponse } from "next/server";
import { verifyRemindersKey, importReminders } from "../../../lib/icalSync";

// נקודת קליטה לקיצור (Shortcut) באייפון ששולח את רשימת התזכורות.
// מאומת עם מפתח סודי שנוצר במסך היומן, לא עם עוגיית התחברות.
export async function POST(request) {
  const auth = request.headers.get("authorization") || "";
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }
  const key = auth.replace(/^Bearer\s+/i, "") || body?.key;
  if (!(await verifyRemindersKey(key))) {
    return NextResponse.json({ error: "מפתח לא תקין" }, { status: 401 });
  }
  const items = Array.isArray(body) ? body : body?.items;
  try {
    const result = await importReminders(items);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: "שגיאה בקליטת התזכורות" }, { status: 500 });
  }
}
