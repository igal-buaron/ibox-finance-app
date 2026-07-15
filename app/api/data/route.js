import { NextResponse } from "next/server";
import { redis } from "../../../lib/redis";
import { verifySessionToken } from "../../../lib/auth";

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

export async function GET(request) {
  if (!(await checkAuth(request))) {
    return NextResponse.json({ error: "לא מחובר" }, { status: 401 });
  }
  try {
    const rawTx = await redis.get("ibox:transactions");
    const rawDebts = await redis.get("ibox:debts");
    return NextResponse.json({
      transactions: parseValue(rawTx, []),
      debts: parseValue(rawDebts, []),
    });
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
  const { key, value } = body;
  if (key !== "transactions" && key !== "debts") {
    return NextResponse.json({ error: "מפתח לא תקין" }, { status: 400 });
  }
  try {
    await redis.set(`ibox:${key}`, JSON.stringify(value));
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "שגיאה בשמירת נתונים בשרת" }, { status: 500 });
  }
}
