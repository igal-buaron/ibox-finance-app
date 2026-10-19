import { NextResponse } from "next/server";
import { Ratelimit } from "@upstash/ratelimit";
import webpush from "web-push";
import { redis } from "../../../../lib/redis";
import { genId, todayStr } from "../../../../lib/theme";

// קבלת הצעת מחיר שלקוח בנה וחתם עליה באתר I-BOX EVENTS.
// אין דרישת התחברות (הנתיב מוחרג ב-middleware כמו /api/public-quote/<id>/sign), ולכן:
//  • מגבלת קצב לכל IP
//  • בדיקה קפדנית של כל שדה וגודל
//  • ההצעה נשמרת כטיוטה (status: "draft") עם source: "website" — המחירים הגיעו מהדפדפן של הלקוח,
//    ולכן לא נוצר אירוע ולא נרשמת הכנסה עד שיגאל בודק ומאשר אותה בעצמו באפליקציה.
// כתובות האתר שמורשות לשלוח (CORS) מוגדרות במשתנה הסביבה SITE_ORIGINS (מופרדות בפסיק).

const DEFAULT_ORIGINS = ["http://localhost:5173", "http://localhost:4173"];
const allowedOrigins = () =>
  (process.env.SITE_ORIGINS || "").split(",").map((s) => s.trim()).filter(Boolean).concat(DEFAULT_ORIGINS);

const siteQuoteRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 h"),
  prefix: "ibox:ratelimit:sitequote",
});

function corsHeaders(request) {
  const origin = request.headers.get("origin");
  if (!origin || !allowedOrigins().includes(origin)) return null;
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

function validate(body) {
  const clientName = str(body.clientName, 80);
  const clientPhone = str(body.clientPhone, 20);
  const date = str(body.date, 10);
  if (!clientName) return { error: "חסר שם" };
  if (!/^[0-9+\-\s()]{9,20}$/.test(clientPhone)) return { error: "מספר טלפון לא תקין" };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "תאריך לא תקין" };

  if (!Array.isArray(body.items) || body.items.length === 0 || body.items.length > 25) {
    return { error: "רשימת האטרקציות לא תקינה" };
  }
  const items = [];
  for (const it of body.items) {
    const description = str(it?.description, 100);
    const price = Number(it?.price);
    if (!description || !Number.isFinite(price) || price < -10000 || price > 100000) {
      return { error: "פריט לא תקין בהצעה" };
    }
    const details = Array.isArray(it.details)
      ? it.details.slice(0, 15).map((d) => str(d, 200)).filter(Boolean)
      : [];
    items.push({ id: genId(), description, price, hoursFrom: "", hoursTo: "", details });
  }

  // חתימה: תמונת PNG בקידוד base64, עד כ-300KB
  let signature = "";
  if (body.signature !== undefined && body.signature !== null && body.signature !== "") {
    if (typeof body.signature !== "string" || !body.signature.startsWith("data:image/png;base64,") || body.signature.length > 400000) {
      return { error: "חתימה לא תקינה" };
    }
    signature = body.signature;
  }

  return {
    quote: {
      id: genId(),
      clientName,
      clientPhone,
      eventType: str(body.eventType, 40),
      location: str(body.location, 80),
      date,
      startTime: "",
      endTime: "",
      items,
      notes: "",
      status: "draft",
      source: "website",
      approvedOnWebsite: body.approved === true,
      signature,
      signedAt: signature ? new Date().toISOString() : "",
      createdAt: todayStr(),
    },
  };
}

// התראת פוש לטלפון של יגאל — אותו מנגנון כמו תזכורות האירועים. כישלון כאן לא מפיל את ההצעה.
async function notifyOwner(quote) {
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return;
  webpush.setVapidDetails(subject, pub, priv);
  const subsHash = (await redis.hgetall("ibox:push")) || {};
  const payload = JSON.stringify({
    title: "הצעת מחיר חדשה מהאתר",
    body: `${quote.clientName}${quote.eventType ? " · " + quote.eventType : ""}${quote.signature ? " · חתומה" : ""}`,
    tag: `ibox-site-quote-${quote.id}`,
  });
  await Promise.allSettled(
    Object.values(subsHash).map((v) => webpush.sendNotification(typeof v === "string" ? JSON.parse(v) : v, payload))
  );
}

export async function OPTIONS(request) {
  const headers = corsHeaders(request);
  return new NextResponse(null, { status: headers ? 204 : 403, headers: headers || {} });
}

export async function POST(request) {
  const headers = corsHeaders(request);
  if (!headers) {
    return NextResponse.json({ error: "מקור לא מורשה" }, { status: 403 });
  }

  const ip = (request.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const { success } = await siteQuoteRatelimit.limit(ip);
  if (!success) {
    return NextResponse.json({ error: "יותר מדי בקשות, נסו שוב מאוחר יותר" }, { status: 429, headers });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "בקשה לא תקינה" }, { status: 400, headers });
  }

  const { quote, error } = validate(body || {});
  if (error) {
    return NextResponse.json({ error }, { status: 400, headers });
  }

  await redis.hset("ibox:quote", { [quote.id]: JSON.stringify(quote) });
  try {
    await notifyOwner(quote);
  } catch {
    // ההצעה כבר נשמרה — התראה שנכשלה לא צריכה להחזיר שגיאה ללקוח
  }

  const url = `${new URL(request.url).origin}/quote/${quote.id}`;
  return NextResponse.json({ ok: true, id: quote.id, url }, { headers });
}
