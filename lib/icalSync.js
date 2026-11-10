// סנכרון חד-כיווני מיומן האייפון (לוח שנה ציבורי ב-iCloud) לאירועים באתר.
import ICAL from "ical.js";
import { redis } from "./redis";
import { EXPENSE_CATEGORIES } from "./theme";

const EVENTS_KEY = "ibox:event";
const SETTINGS_KEY = "ibox:calendarSync";
const IGNORED_KEY = "ibox:calendarIgnored";
const ID_PREFIX = "ical_";
const REMINDER_PREFIX = "rem_";
const DAYS_BACK = 30;
const DAYS_AHEAD = 365;
const MIN_INTERVAL_MS = 5 * 60 * 1000;

export const isPhoneEventId = (id) =>
  typeof id === "string" && (id.startsWith(ID_PREFIX) || id.startsWith(REMINDER_PREFIX));

function israelParts(jsDate) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jerusalem",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(jsDate);
  const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  return { date: `${map.year}-${map.month}-${map.day}`, time: `${map.hour}:${map.minute}` };
}

function dateOnly(time) {
  return `${time.year}-${String(time.month).padStart(2, "0")}-${String(time.day).padStart(2, "0")}`;
}

function parseValue(raw) {
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  return raw;
}

export function normalizeCalendarUrl(url) {
  const trimmed = String(url || "").trim();
  const httpsUrl = trimmed.replace(/^webcal:\/\//i, "https://");
  let parsed;
  try {
    parsed = new URL(httpsUrl);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:") return null;
  // רק קישורים של iCloud או גוגל, כדי שהשרת לא ישמש לשליפת כתובות שרירותיות
  if (!/(^|\.)icloud\.com$/i.test(parsed.hostname) && parsed.hostname !== "calendar.google.com") return null;
  return parsed.toString();
}

// מפרק את קובץ היומן לרשימת מופעים בטווח התאריכים, כולל אירועים חוזרים.
export function parseCalendar(icsText, now = new Date()) {
  const root = new ICAL.Component(ICAL.parse(icsText));
  for (const tz of root.getAllSubcomponents("vtimezone")) {
    ICAL.TimezoneService.register(tz);
  }

  const rangeStart = new Date(now.getTime() - DAYS_BACK * 86400000);
  const rangeEnd = new Date(now.getTime() + DAYS_AHEAD * 86400000);

  const vevents = root.getAllSubcomponents("vevent");
  const overrides = vevents.filter((v) => v.hasProperty("recurrence-id"));
  const masters = vevents.filter((v) => !v.hasProperty("recurrence-id"));

  const occurrences = [];
  const pushOccurrence = (event, start, end, key) => {
    const jsStart = start.toJSDate();
    if (jsStart > rangeEnd) return false;
    const jsEnd = end ? end.toJSDate() : jsStart;
    if (jsEnd < rangeStart) return true;
    const allDay = start.isDate;
    const s = allDay ? { date: dateOnly(start), time: "" } : israelParts(jsStart);
    const e = allDay || !end ? { time: "" } : israelParts(jsEnd);
    occurrences.push({
      id: `${ID_PREFIX}${key}`.replace(/[^a-zA-Z0-9_\-]/g, "").slice(0, 120),
      name: (event.summary || "").trim() || "אירוע מהיומן",
      date: s.date,
      startTime: s.time,
      endTime: e.time,
      location: (event.location || "").trim(),
      note: (event.description || "").trim(),
    });
    return true;
  };

  for (const vevent of masters) {
    const event = new ICAL.Event(vevent);
    for (const o of overrides) {
      if (o.getFirstPropertyValue("uid") === event.uid) event.relateException(o);
    }
    if (!event.isRecurring()) {
      pushOccurrence(event, event.startDate, event.endDate, event.uid);
      continue;
    }
    const iterator = event.iterator();
    let next;
    let guard = 0;
    while ((next = iterator.next()) && guard++ < 2000) {
      const details = event.getOccurrenceDetails(next);
      const keepGoing = pushOccurrence(
        details.item,
        details.startDate,
        details.endDate,
        `${event.uid}_${dateOnly(next)}`
      );
      if (!keepGoing) break;
    }
  }
  return occurrences;
}

export async function getSyncSettings() {
  return parseValue(await redis.get(SETTINGS_KEY)) || {};
}

async function updateSyncSettings(patch) {
  const current = await getSyncSettings();
  const next = { ...current, ...patch };
  await redis.set(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

export async function saveCalendarUrl(url) {
  await updateSyncSettings({ url, lastSyncAt: 0, lastError: "" });
}

export async function ignorePhoneEvent(id) {
  await redis.sadd(IGNORED_KEY, id);
}

// מפתח סודי לקיצור באייפון. נשמר רק כ-hash, כך שגם מי שרואה את מסד הנתונים לא יכול להשתמש בו.
async function sha256(text) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createRemindersKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  const key = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
  await updateSyncSettings({ remindersKeyHash: await sha256(key) });
  return key;
}

export async function verifyRemindersKey(key) {
  if (!key || typeof key !== "string") return false;
  const settings = await getSyncSettings();
  if (!settings.remindersKeyHash) return false;
  return (await sha256(key.trim())) === settings.remindersKeyHash;
}

function toAmount(text) {
  const n = parseFloat(String(text).replace(/[,₪\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

// קורא סכומים מההערות של אירוע/תזכורת באייפון, שורה לכל סכום:
//   הכנסה 3500
//   הוצאה דלק 200
// שורות הסכומים יורדות מההערה, ושאר הטקסט נשאר.
export function parseMoneyFromNote(note, idBase = "") {
  const lines = String(note || "").split(/\r?\n/);
  const rest = [];
  let income = 0;
  const expenses = [];
  let found = false;
  for (const line of lines) {
    const trimmed = line.trim();
    const incomeMatch = trimmed.match(/^(?:הכנסה|הכנסות)\s*[:\-]?\s*₪?\s*([\d,.]+)\s*₪?$/);
    if (incomeMatch && toAmount(incomeMatch[1])) {
      income += toAmount(incomeMatch[1]);
      found = true;
      continue;
    }
    const expenseMatch = trimmed.match(/^(?:הוצאה|הוצאות)\s*[:\-]?\s*(.*?)\s*[:\-]?\s*₪?\s*([\d,.]+)\s*₪?$/);
    if (expenseMatch && toAmount(expenseMatch[2])) {
      const label = expenseMatch[1].trim();
      const known = label && EXPENSE_CATEGORIES.find((c) => c.name.includes(label) || label.includes(c.name));
      expenses.push({
        id: `${idBase}_e${expenses.length}`,
        category: known ? known.name : label || "הוצאה עסקית אחרת",
        amount: toAmount(expenseMatch[2]),
      });
      found = true;
      continue;
    }
    rest.push(line);
  }
  return { found, income, expenses, note: rest.join("\n").trim() };
}

// מכניס לאתר את רשימת המופעים ממקור אחד (יומן או תזכורות) ומוחק את מה שנעלם ממנו.
// אירועים שנוספו מהאתר, או ממקור אחר, לא נוגעים בהם.
async function applyOccurrences(occurrences, idPrefix) {
  const [eventsHash, ignored] = await Promise.all([redis.hgetall(EVENTS_KEY), redis.smembers(IGNORED_KEY)]);
  const ignoredSet = new Set(ignored || []);
  const existing = {};
  for (const [id, raw] of Object.entries(eventsHash || {})) {
    if (id.startsWith(idPrefix)) existing[id] = parseValue(raw);
  }

  const upserts = {};
  const seen = new Set();
  for (const rawOcc of occurrences) {
    if (ignoredSet.has(rawOcc.id)) continue;
    seen.add(rawOcc.id);
    const prev = existing[rawOcc.id];
    const money = parseMoneyFromNote(rawOcc.note, rawOcc.id);
    const occ = { ...rawOcc, note: money.note };
    // סכומים שכתבת בהערות באייפון קובעים. בלי סכומים בהערות - שומרים את מה שהוזן באתר.
    // אירוע שכבר הושלם לא משנים לו סכומים, כי הם כבר נכנסו לתנועות.
    const financial =
      money.found && prev?.status !== "done" ? { income: money.income, expenses: money.expenses } : {};
    const merged = prev
      ? {
          ...prev,
          name: occ.name,
          date: occ.date,
          startTime: occ.startTime,
          endTime: occ.endTime,
          location: occ.location,
          note: occ.note,
          ...financial,
        }
      : {
          ...occ,
          status: "planned",
          source: "iphone",
          clientPhone: "",
          eventType: "",
          attractions: [],
          supplierName: "",
          income: 0,
          incomeCategory: "הכנסה מאירוע",
          expenses: [],
          ...financial,
        };
    if (!prev || JSON.stringify(prev) !== JSON.stringify(merged)) upserts[occ.id] = JSON.stringify(merged);
  }

  // אירוע שנמחק מהטלפון נמחק גם כאן, אלא אם כבר סימנת אותו כהושלם.
  // אירועים ישנים שיצאו מטווח הסנכרון נשארים כמו שהם.
  const cutoff = israelParts(new Date(Date.now() - DAYS_BACK * 86400000)).date;
  const removals = Object.entries(existing)
    .filter(([id, ev]) => !seen.has(id) && ev && ev.status !== "done" && ev.date >= cutoff)
    .map(([id]) => id);

  if (Object.keys(upserts).length > 0) await redis.hset(EVENTS_KEY, upserts);
  if (removals.length > 0) await redis.hdel(EVENTS_KEY, ...removals);

  return {
    ok: true,
    changed: Object.keys(upserts).length + removals.length > 0,
    added: Object.keys(upserts).length,
    removed: removals.length,
  };
}

// מושך את היומן מהקישור ומעדכן את האירועים.
export async function syncCalendar({ force = false } = {}) {
  const settings = await getSyncSettings();
  if (!settings.url) return { ok: true, skipped: "no-url", changed: false };
  if (!force && settings.lastSyncAt && Date.now() - settings.lastSyncAt < MIN_INTERVAL_MS) {
    return { ok: true, skipped: "recent", changed: false, lastSyncAt: settings.lastSyncAt };
  }

  let occurrences;
  try {
    const res = await fetch(settings.url, { cache: "no-store", redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    occurrences = parseCalendar(await res.text());
  } catch (e) {
    const lastError = "לא הצלחתי לקרוא את היומן מהקישור";
    await updateSyncSettings({ lastSyncAt: Date.now(), lastError });
    return { ok: false, error: lastError, changed: false };
  }

  const result = await applyOccurrences(occurrences, ID_PREFIX);
  const lastSyncAt = Date.now();
  await updateSyncSettings({ lastSyncAt, lastError: "" });
  return { ...result, lastSyncAt };
}

function pick(obj, ...keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && String(obj[k]).trim() !== "") return String(obj[k]).trim();
  }
  return "";
}

// הקיצור באייפון שולח רשימת תזכורות. כל תזכורת עם תאריך הופכת לאירוע.
export function parseReminders(items, now = new Date()) {
  // קיצורים לפעמים שולחים את הרשימה כטקסט: מילון JSON אחד בכל שורה
  if (typeof items === "string") {
    try {
      items = JSON.parse(items);
    } catch {
      items = items.split(/\r?\n/).filter((line) => line.trim());
    }
  }
  const list = Array.isArray(items) ? items : items ? [items] : [];
  const rangeStart = israelParts(new Date(now.getTime() - DAYS_BACK * 86400000)).date;
  const rangeEnd = israelParts(new Date(now.getTime() + DAYS_AHEAD * 86400000)).date;
  const occurrences = [];
  const usedIds = new Set();

  for (let raw of list) {
    if (typeof raw === "string") {
      try {
        raw = JSON.parse(raw);
      } catch {
        continue;
      }
    }
    if (!raw || typeof raw !== "object") continue;
    const title = pick(raw, "title", "Title", "כותרת", "name");
    const dueRaw = pick(raw, "due", "Due Date", "dueDate", "date");
    if (!title || !dueRaw) continue;
    const due = new Date(dueRaw);
    if (Number.isNaN(due.getTime())) continue;

    const { date, time } = israelParts(due);
    if (date < rangeStart || date > rangeEnd) continue;

    // מזהה קבוע לפי תאריך היצירה של התזכורת, כך ששינוי כותרת או תאריך מעדכן ולא משכפל
    const created = pick(raw, "created", "Creation Date", "creationDate");
    const base = created ? `${title}|${created}` : `${title}|${dueRaw}`;
    let hash = 0;
    for (let i = 0; i < base.length; i++) hash = (hash * 31 + base.charCodeAt(i)) >>> 0;
    let id = `${REMINDER_PREFIX}${hash.toString(36)}`;
    while (usedIds.has(id)) id += "x";
    usedIds.add(id);

    occurrences.push({
      id,
      name: title,
      date,
      startTime: time === "00:00" ? "" : time,
      endTime: "",
      location: pick(raw, "location", "Location"),
      note: pick(raw, "notes", "Notes", "note"),
    });
  }
  return occurrences;
}

export async function importReminders(items) {
  const occurrences = parseReminders(items);
  const result = await applyOccurrences(occurrences, REMINDER_PREFIX);
  await updateSyncSettings({ remindersLastAt: Date.now(), remindersCount: occurrences.length });
  return { ...result, received: occurrences.length };
}
