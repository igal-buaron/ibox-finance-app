import { NextResponse } from "next/server";
import webpush from "web-push";
import { redis } from "../../../../lib/redis";

function todayInIsrael() {
  // מחזיר YYYY-MM-DD לפי שעון ישראל, ללא תלות באזור הזמן של השרת
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

export async function GET(request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "לא מורשה" }, { status: 401 });
  }

  const { VAPID_PUBLIC_KEY_RESOLVED, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = {
    VAPID_PUBLIC_KEY_RESOLVED: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY: process.env.VAPID_PRIVATE_KEY,
    VAPID_SUBJECT: process.env.VAPID_SUBJECT,
  };
  if (!VAPID_PUBLIC_KEY_RESOLVED || !VAPID_PRIVATE_KEY || !VAPID_SUBJECT) {
    return NextResponse.json({ error: "משתני VAPID חסרים" }, { status: 500 });
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY_RESOLVED, VAPID_PRIVATE_KEY);

  const today = todayInIsrael();

  const [eventsHash, subsHash] = await Promise.all([
    redis.hgetall("ibox:event"),
    redis.hgetall("ibox:push"),
  ]);

  const events = Object.values(eventsHash || {})
    .map((v) => (typeof v === "string" ? JSON.parse(v) : v))
    .filter((e) => e && e.date === today && e.status !== "done");

  if (events.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no events today" });
  }

  const subscriptions = Object.entries(subsHash || {}).map(([id, v]) => [
    id,
    typeof v === "string" ? JSON.parse(v) : v,
  ]);

  if (subscriptions.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, reason: "no subscriptions" });
  }

  let sent = 0;
  const staleIds = [];

  for (const event of events) {
    const timeStr = event.startTime ? ` בשעה ${event.startTime}` : "";
    const payload = JSON.stringify({
      title: "תזכורת: יש לך אירוע היום",
      body: `${event.name}${timeStr}${event.location ? " · " + event.location : ""}`,
      tag: `ibox-event-${event.id}`,
    });

    for (const [subId, subscription] of subscriptions) {
      try {
        await webpush.sendNotification(subscription, payload);
        sent += 1;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(subId);
        }
      }
    }
  }

  if (staleIds.length > 0) {
    await Promise.all(staleIds.map((id) => redis.hdel("ibox:push", id)));
  }

  return NextResponse.json({ ok: true, sent, events: events.length });
}
