import { NextResponse } from "next/server";
import { redis } from "../../../../../lib/redis";
import { genId } from "../../../../../lib/theme";

// חתימה ואישור הצעת מחיר על ידי הלקוח - אין דרישת התחברות, מוגן רק על ידי מזהה ההצעה שלא ניתן לניחוש.
export async function POST(request, { params }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400 });
  }
  const { signature } = body;
  if (!signature || typeof signature !== "string") {
    return NextResponse.json({ error: "חסרה חתימה" }, { status: 400 });
  }

  const raw = await redis.hget("ibox:quote", params.id);
  if (!raw) {
    return NextResponse.json({ error: "ההצעה לא נמצאה" }, { status: 404 });
  }
  const quote = typeof raw === "string" ? JSON.parse(raw) : raw;

  if (quote.status === "accepted") {
    return NextResponse.json({ ok: true, alreadyAccepted: true });
  }

  const updatedQuote = {
    ...quote,
    status: "accepted",
    signature,
    signedAt: new Date().toISOString(),
  };
  await redis.hset("ibox:quote", { [params.id]: JSON.stringify(updatedQuote) });

  // אותה לוגיקה כמו אישור ידני של ההצעה בתוך האפליקציה - יוצרת אירוע מתוכנן תואם
  const eventId = genId();
  const newEvent = {
    id: eventId,
    name: `${quote.clientName}${quote.eventType ? " - " + quote.eventType : ""}`,
    date: quote.date,
    status: "planned",
    clientPhone: quote.clientPhone,
    location: quote.location,
    eventType: quote.eventType,
    startTime: quote.startTime,
    endTime: quote.endTime,
    attractions: quote.items.map((it) => it.description),
    supplierName: "",
    income: quote.items.reduce((s, it) => s + it.price, 0),
    incomeCategory: "הכנסה מאירוע",
    expenses: [],
    note: quote.notes,
  };
  await redis.hset("ibox:event", { [eventId]: JSON.stringify(newEvent) });

  return NextResponse.json({ ok: true });
}
