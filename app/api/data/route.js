import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import { verifySessionToken } from "../../../lib/auth";

const HASH_KEYS = { transactions: "ibox:tx", debts: "ibox:debt", events: "ibox:event", quotes: "ibox:quote", catalog: "ibox:catalog" };
const LEGACY_KEYS = { transactions: "ibox:transactions", debts: "ibox:debts" };

async function checkAuth(request) {
  const token = request.cookies.get("ibox_session")?.value;
  const secret = process.env.SESSION_SECRET;
  if (!secret) return false;
  return verifySessionToken(token, secret);
}

function parseValue(raw, fallback) {
  if (raw === null || raw === undefined) return fallback;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }
  return raw;
}

// כל רשומה נשמרת כשדה נפרד ב-hash, כדי שכתיבות ממכשירים שונים לא ידרסו זו את זו.
async function readEntity(entity) {
  const hashKey = HASH_KEYS[entity];
  const hash = await redis.hgetall(hashKey);
  if (hash && Object.keys(hash).length > 0) {
    return Object.values(hash)
      .map((v) => parseValue(v, null))
      .filter(Boolean);
  }
  // מיגרציה חד-פעמית מהמבנה הישן (מערך JSON אחד תחת מפתח בודד)
  const legacyKey = LEGACY_KEYS[entity];
  if (!legacyKey) return [];
  const legacyRaw = await redis.get(legacyKey);
  const legacyArr = parseValue(legacyRaw, []);
  if (Array.isArray(legacyArr) && legacyArr.length > 0) {
    const entries = {};
    for (const item of legacyArr) {
      if (item && item.id) entries[item.id] = JSON.stringify(item);
    }
    if (Object.keys(entries).length > 0) {
      await redis.hset(hashKey, entries);
    }
    await redis.del(legacyKey);
    return legacyArr;
  }
  return [];
}

export async function GET(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  try {
    const [transactions, debts, events, quotes, catalog] = await Promise.all([
      readEntity("transactions"),
      readEntity("debts"),
      readEntity("events"),
      readEntity("quotes"),
      readEntity("catalog"),
    ]);
    return NextResponse.json({ transactions, debts, events, quotes, catalog });
  } catch (e) {
    return NextResponse.json({ error: "שגיאה בטעינת נתונים מהשרת" }, { status: 500 });
  }
}

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
  const { entity, action, id, item } = body;
  if (!HASH_KEYS[entity]) {
    return NextResponse.json({ error: "סוג נתון לא תקין" }, { status: 400 });
  }
  if (action !== "upsert" && action !== "delete") {
    return NextResponse.json({ error: "פעולה לא תקינה" }, { status: 400 });
  }
  if (!id) {
    return NextResponse.json({ error: "חסר מזהה" }, { status: 400 });
  }
  const hashKey = HASH_KEYS[entity];
  try {
    if (action === "upsert") {
      if (!item) return NextResponse.json({ error: "חסר תוכן" }, { status: 400 });
      await redis.hset(hashKey, { [id]: JSON.stringify(item) });
    } else {
      await redis.hdel(hashKey, id);
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "שגיאה בשמירת נתונים בשרת" }, { status: 500 });
  }
}
