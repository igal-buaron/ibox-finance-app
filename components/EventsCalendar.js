"use client";
import React, { useState, useMemo, useEffect } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, X, CalendarDays, Bell, Smartphone, RefreshCw, Pencil } from "lucide-react";
import {
  COLORS, shadowSm, shadowMd, EXPENSE_CATEGORIES,
  genId, todayStr, fmtCurrency, fmtDate, isToday,
  BottomSheet, FieldLabel, inputStyle, CategoryPicker, ConfirmDelete,
} from "./shared";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

function ReminderToggle() {
  const [status, setStatus] = useState("checking"); // checking | unsupported | off | on | denied
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        const sub = reg ? await reg.pushManager.getSubscription() : null;
        setStatus(sub ? "on" : "off");
      } catch {
        setStatus("off");
      }
    })();
  }, []);

  const enable = async () => {
    setBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus("denied");
        return;
      }
      const reg = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
      });
      await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entity: "pushSubscriptions",
          action: "upsert",
          id: btoa(sub.endpoint).slice(0, 40).replace(/[^a-zA-Z0-9]/g, ""),
          item: sub.toJSON(),
        }),
      });
      setStatus("on");
    } catch {
      setStatus("off");
    } finally {
      setBusy(false);
    }
  };

  if (status === "checking" || status === "unsupported") return null;

  if (status === "on") {
    return (
      <div
        className="flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 rounded-xl mb-3"
        style={{ backgroundColor: COLORS.incomeTint, color: COLORS.income }}
      >
        <Bell size={14} /> תזכורות אירועים פעילות בטלפון הזה
      </div>
    );
  }

  return (
    <button
      onClick={enable}
      disabled={busy}
      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm mb-3"
      style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, boxShadow: shadowSm }}
    >
      <Bell size={16} />
      {busy
        ? "מפעיל..."
        : status === "denied"
        ? "התראות חסומות - יש לאפשר בהגדרות הדפדפן"
        : "הפעל תזכורות אירועים בטלפון"}
    </button>
  );
}

function timeAgo(ts) {
  if (!ts) return "";
  const minutes = Math.round((Date.now() - ts) / 60000);
  if (minutes < 1) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דק'`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `לפני ${hours} שע'`;
  return `לפני ${Math.round(hours / 24)} ימים`;
}

function PhoneCalendarSync({ onSynced }) {
  const [status, setStatus] = useState(null); // { connected, lastSyncAt, lastError }
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const loadStatus = async () => {
    try {
      const res = await fetch("/api/calendar-sync");
      if (res.ok) setStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const call = async (payload) => {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok || result.ok === false) {
        setMessage(result.error || "משהו השתבש, נסה שוב");
        return null;
      }
      if (result.changed) onSynced();
      await loadStatus();
      return result;
    } catch {
      setMessage("משהו השתבש, נסה שוב");
      return null;
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;

  if (status.connected) {
    return (
      <div
        className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl mb-3"
        style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted, boxShadow: shadowSm }}
      >
        <Smartphone size={14} style={{ color: COLORS.income }} />
        <span className="flex-1">
          {status.lastError || message || `מסונכרן עם יומן האייפון · ${timeAgo(status.lastSyncAt)}`}
        </span>
        <button
          onClick={() => call({ action: "sync", force: true })}
          disabled={busy}
          className="p-1.5 rounded-lg"
          style={{ backgroundColor: COLORS.surfaceSoft }}
          aria-label="סנכרן עכשיו"
        >
          <RefreshCw size={14} className={busy ? "animate-spin" : ""} />
        </button>
        <button
          onClick={async () => {
            await call({ action: "disconnect" });
          }}
          disabled={busy}
          className="px-2 py-1 rounded-lg"
          style={{ backgroundColor: COLORS.surfaceSoft }}
        >
          נתק
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm mb-3"
        style={{ backgroundColor: COLORS.surface, color: COLORS.textPrimary, boxShadow: shadowSm }}
      >
        <Smartphone size={16} /> חבר את יומן האייפון
      </button>
    );
  }

  return (
    <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
      <p className="text-sm font-semibold mb-1">חיבור יומן האייפון</p>
      <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
        באייפון: לוח שנה ← לוחות שנה ← ⓘ ליד היומן ← "לוח שנה ציבורי" ← שתף קישור ← העתק. ואז הדבק כאן.
      </p>
      <input
        type="url"
        dir="ltr"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="webcal://p…-caldav.icloud.com/published/…"
        className="w-full rounded-xl px-3 py-2 outline-none text-sm mb-2"
        style={inputStyle}
      />
      {message && (
        <p className="text-xs mb-2" style={{ color: COLORS.expense }}>{message}</p>
      )}
      <div className="flex gap-2">
        <button
          onClick={async () => {
            const result = await call({ action: "connect", url });
            if (result) {
              setOpen(false);
              setUrl("");
            }
          }}
          disabled={busy || !url.trim()}
          className="flex-1 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, opacity: busy || !url.trim() ? 0.6 : 1 }}
        >
          {busy ? "מתחבר..." : "חבר וסנכרן"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{ backgroundColor: COLORS.surfaceSoft, color: COLORS.textMuted }}
        >
          ביטול
        </button>
      </div>
    </div>
  );
}

function CopyRow({ label, value }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mb-2">
      <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>{label}</p>
      <div className="flex items-center gap-2">
        <code dir="ltr" className="flex-1 text-xs rounded-lg px-2 py-2 break-all" style={{ backgroundColor: COLORS.surfaceSoft }}>
          {value}
        </code>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {}
          }}
          className="px-2.5 py-2 rounded-lg text-xs font-semibold shrink-0"
          style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft }}
        >
          {copied ? "הועתק" : "העתק"}
        </button>
      </div>
    </div>
  );
}

// חיבור לאפליקציית התזכורות באייפון דרך קיצור (Shortcut) ששולח את התזכורות לאתר
function RemindersShortcut() {
  const [status, setStatus] = useState(null);
  const [newKey, setNewKey] = useState("");
  const [busy, setBusy] = useState(false);

  const loadStatus = async () => {
    try {
      const res = await fetch("/api/calendar-sync");
      if (res.ok) setStatus(await res.json());
    } catch {}
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const createKey = async () => {
    if (status?.remindersConnected && !window.confirm("מפתח חדש יבטל את הקודם, ותצטרך לעדכן אותו בקיצור. להמשיך?")) return;
    setBusy(true);
    try {
      const res = await fetch("/api/calendar-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createRemindersKey" }),
      });
      const result = await res.json();
      if (result.key) setNewKey(result.key);
      await loadStatus();
    } finally {
      setBusy(false);
    }
  };

  if (!status) return null;

  if (newKey) {
    return (
      <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
        <p className="text-sm font-semibold mb-1">פרטים לקיצור באייפון</p>
        <p className="text-xs mb-3" style={{ color: COLORS.textMuted }}>
          תעתיק את שני אלה לקיצור. המפתח מוצג רק עכשיו - אם תאבד אותו, פשוט תיצור חדש.
        </p>
        <CopyRow label="כתובת (URL)" value={`${window.location.origin}/api/reminders-import`} />
        <CopyRow label="מפתח (לכותרת Authorization)" value={`Bearer ${newKey}`} />
        <button
          onClick={() => setNewKey("")}
          className="w-full mt-1 py-2.5 rounded-xl text-sm font-semibold"
          style={{ backgroundColor: COLORS.surfaceSoft, color: COLORS.textMuted }}
        >
          סיימתי
        </button>
      </div>
    );
  }

  if (status.remindersConnected) {
    return (
      <div
        className="flex items-center gap-2 text-xs font-medium px-3 py-2 rounded-xl mb-3"
        style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted, boxShadow: shadowSm }}
      >
        <Smartphone size={14} style={{ color: COLORS.income }} />
        <span className="flex-1">
          {status.remindersLastAt
            ? `תזכורות מהאייפון · עודכן ${timeAgo(status.remindersLastAt)} · ${status.remindersCount} עם תאריך`
            : "תזכורות מהאייפון · מחכה להרצה ראשונה של הקיצור"}
        </span>
        <button onClick={createKey} disabled={busy} className="px-2 py-1 rounded-lg" style={{ backgroundColor: COLORS.surfaceSoft }}>
          מפתח חדש
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={createKey}
      disabled={busy}
      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm mb-3"
      style={{ backgroundColor: COLORS.surface, color: COLORS.textPrimary, boxShadow: shadowSm }}
    >
      <Smartphone size={16} /> {busy ? "יוצר..." : "חבר את התזכורות מהאייפון"}
    </button>
  );
}

function AttractionTagInput({ attractions, onChange }) {
  const [draft, setDraft] = useState("");

  const addTag = () => {
    const val = draft.trim();
    if (!val) return;
    onChange([...attractions, val]);
    setDraft("");
  };

  const removeTag = (idx) => {
    onChange(attractions.filter((_, i) => i !== idx));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="לדוגמה: מתחם קפיצות"
          className="flex-1 rounded-xl px-3 py-2 outline-none text-sm"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={addTag}
          className="p-2 rounded-xl shrink-0"
          style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft }}
        >
          <Plus size={16} />
        </button>
      </div>
      {attractions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {attractions.map((a, idx) => (
            <span
              key={`${a}-${idx}`}
              className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1"
              style={{ backgroundColor: COLORS.surfaceSoft, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
            >
              {a}
              <button type="button" onClick={() => removeTag(idx)} style={{ color: COLORS.textMuted }}>
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// משמש גם להוספת אירוע חדש וגם לעריכת אירוע קיים (editingEvent)
function AddEventModal({ initialDate, editingEvent, onClose, onSave, catalog }) {
  const ev = editingEvent || {};
  const [name, setName] = useState(ev.name || "");
  const [date, setDate] = useState(ev.date || initialDate || todayStr());
  const [clientPhone, setClientPhone] = useState(ev.clientPhone || "");
  const [location, setLocation] = useState(ev.location || "");
  const [eventType, setEventType] = useState(ev.eventType || "");
  const [startTime, setStartTime] = useState(ev.startTime || "");
  const [endTime, setEndTime] = useState(ev.endTime || "");
  const [attractions, setAttractions] = useState(ev.attractions || []);
  const [supplierName, setSupplierName] = useState(ev.supplierName || "");
  const [income, setIncome] = useState(ev.income ? String(ev.income) : "");
  const [expenses, setExpenses] = useState(
    (ev.expenses || []).map((e) => ({ id: e.id || genId(), category: e.category, amount: String(e.amount) }))
  );
  const [note, setNote] = useState(ev.note || "");
  const [error, setError] = useState("");

  const addExpenseRow = () => {
    setExpenses((prev) => [...prev, { id: genId(), category: "", amount: "" }]);
  };
  const updateExpenseRow = (id, patch) => {
    setExpenses((prev) => prev.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };
  const removeExpenseRow = (id) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleSave = () => {
    if (!name.trim()) return setError("צריך למלא שם לאירוע");
    const incomeNum = parseFloat(income) || 0;
    const cleanExpenses = expenses
      .filter((e) => e.category && parseFloat(e.amount) > 0)
      .map((e) => ({ id: e.id, category: e.category, amount: parseFloat(e.amount) }));
    onSave({
      ...ev,
      id: ev.id || genId(),
      name: name.trim(),
      date,
      status: ev.status || "planned",
      clientPhone: clientPhone.trim(),
      location: location.trim(),
      eventType: eventType.trim(),
      startTime,
      endTime,
      attractions,
      supplierName: supplierName.trim(),
      income: incomeNum,
      incomeCategory: "הכנסה מאירוע",
      expenses: cleanExpenses,
      note: note.trim(),
    });
  };

  return (
    <BottomSheet title={editingEvent ? "עריכת אירוע" : "אירוע חדש"} onClose={onClose}>
      <div className="mb-3">
        <FieldLabel>שם האירוע</FieldLabel>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="לדוגמה: חתונה - משפחת כהן"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>תאריך</FieldLabel>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 outline-none text-sm"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>טלפון הלקוח</FieldLabel>
        <input
          type="tel"
          value={clientPhone}
          onChange={(e) => setClientPhone(e.target.value)}
          placeholder="050-1234567"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>מיקום האירוע</FieldLabel>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="לדוגמה: אולמי הגן, ראשון לציון"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>סוג אירוע</FieldLabel>
        <input
          type="text"
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          placeholder="לדוגמה: חתונה, בר מצווה, יום הולדת"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>שעות האירוע</FieldLabel>
        <div className="flex items-center gap-2">
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2.5 outline-none text-sm"
            style={inputStyle}
          />
          <span className="text-sm" style={{ color: COLORS.textMuted }}>עד</span>
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="flex-1 rounded-xl px-3 py-2.5 outline-none text-sm"
            style={inputStyle}
          />
        </div>
      </div>

      {catalog && catalog.length > 0 && (
        <div className="mb-3">
          <FieldLabel>מהקטלוג שלי (לחיצה מוסיפה)</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {catalog.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setAttractions([...attractions, c.name])}
                className="text-xs px-2.5 py-1.5 rounded-full"
                style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, border: `1px solid ${COLORS.gold}` }}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <FieldLabel>סוגי אטרקציות באירוע</FieldLabel>
        <AttractionTagInput attractions={attractions} onChange={setAttractions} />
      </div>

      <div className="mb-3">
        <FieldLabel>שם ספק האירוע</FieldLabel>
        <input
          type="text"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
          placeholder="לדוגמה: קייטרינג דני"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>הכנסה צפויה מהאירוע (₪)</FieldLabel>
        <input
          type="number"
          inputMode="decimal"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl px-3 py-2.5 text-lg font-semibold tabular-nums outline-none"
          style={{ ...inputStyle, color: COLORS.income }}
        />
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>הוצאות משוערות לאירוע</FieldLabel>
          <button
            type="button"
            onClick={addExpenseRow}
            className="text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1"
            style={{ color: COLORS.expense, backgroundColor: COLORS.expenseTint }}
          >
            <Plus size={13} /> הוסף הוצאה
          </button>
        </div>
        {expenses.length === 0 ? (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>אין הוצאות מוגדרות עדיין</p>
        ) : (
          <div className="space-y-2">
            {expenses.map((exp) => (
              <div
                key={exp.id}
                className="p-2.5 rounded-xl"
                style={{ backgroundColor: COLORS.surfaceSoft, border: `1px solid ${COLORS.border}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="number"
                    inputMode="decimal"
                    value={exp.amount}
                    onChange={(e) => updateExpenseRow(exp.id, { amount: e.target.value })}
                    placeholder="סכום"
                    className="w-24 rounded-lg px-2 py-1.5 text-sm font-semibold tabular-nums outline-none"
                    style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.expense }}
                  />
                  <span className="text-xs flex-1 truncate" style={{ color: COLORS.textMuted }}>
                    {exp.category || "בחר קטגוריה למטה"}
                  </span>
                  <button onClick={() => removeExpenseRow(exp.id)} className="p-1 shrink-0" style={{ color: COLORS.textMuted }}>
                    <X size={15} />
                  </button>
                </div>
                <CategoryPicker
                  categories={EXPENSE_CATEGORIES}
                  value={exp.category}
                  onChange={(cat) => updateExpenseRow(exp.id, { category: cat })}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <FieldLabel>הערה (לא חובה)</FieldLabel>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="פרטים נוספים על האירוע"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      {error && <p className="text-sm mb-3" style={{ color: COLORS.expense }}>{error}</p>}

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-xl font-semibold"
        style={{ backgroundColor: COLORS.gold, color: "#fff", boxShadow: shadowMd }}
      >
        שמור אירוע
      </button>
    </BottomSheet>
  );
}

function EventDetailsModal({ event, onClose, onComplete, onDelete, onEdit }) {
  const totalExpenses = (event.expenses || []).reduce((s, e) => s + e.amount, 0);
  const done = event.status === "done";

  return (
    <BottomSheet title={event.name} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <p className="text-sm" style={{ color: COLORS.textMuted }}>{fmtDate(event.date)}</p>
        {done && (
          <span
            className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ color: COLORS.income, backgroundColor: COLORS.incomeTint }}
          >
            <Check size={12} /> הושלם
          </span>
        )}
      </div>

      {(event.clientPhone || event.location || event.eventType || event.startTime || event.supplierName) && (
        <div className="mb-3 space-y-1.5 text-sm">
          {event.clientPhone && (
            <p><span style={{ color: COLORS.textMuted }}>טלפון: </span>{event.clientPhone}</p>
          )}
          {event.eventType && (
            <p><span style={{ color: COLORS.textMuted }}>סוג אירוע: </span>{event.eventType}</p>
          )}
          {event.location && (
            <p><span style={{ color: COLORS.textMuted }}>מיקום: </span>{event.location}</p>
          )}
          {(event.startTime || event.endTime) && (
            <p>
              <span style={{ color: COLORS.textMuted }}>שעות: </span>
              {event.startTime || "?"} - {event.endTime || "?"}
            </p>
          )}
          {event.supplierName && (
            <p><span style={{ color: COLORS.textMuted }}>ספק: </span>{event.supplierName}</p>
          )}
        </div>
      )}

      {(event.attractions || []).length > 0 && (
        <div className="mb-3">
          <p className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>אטרקציות</p>
          <div className="flex flex-wrap gap-1.5">
            {event.attractions.map((a, idx) => (
              <span
                key={`${a}-${idx}`}
                className="text-xs px-2.5 py-1 rounded-full"
                style={{ backgroundColor: COLORS.surfaceSoft, border: `1px solid ${COLORS.border}` }}
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl p-3 mb-3" style={{ backgroundColor: COLORS.incomeTint }}>
        <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>הכנסה צפויה</p>
        <p className="font-semibold tabular-nums" style={{ color: COLORS.income }}>{fmtCurrency(event.income)}</p>
      </div>

      {(event.expenses || []).length > 0 && (
        <div className="mb-3">
          <p className="text-xs mb-1.5" style={{ color: COLORS.textMuted }}>הוצאות ({fmtCurrency(totalExpenses)})</p>
          <div className="space-y-1.5">
            {event.expenses.map((exp) => (
              <div
                key={exp.id}
                className="flex items-center justify-between text-sm rounded-lg px-3 py-2"
                style={{ backgroundColor: COLORS.expenseTint }}
              >
                <span>{exp.category}</span>
                <span className="font-medium tabular-nums" style={{ color: COLORS.expense }}>{fmtCurrency(exp.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {event.note && <p className="text-sm mb-4" style={{ color: COLORS.textMuted }}>{event.note}</p>}

      <div className="flex gap-2">
        {!done && (
          <button
            onClick={() => {
              onComplete(event);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-1.5"
            style={{ backgroundColor: COLORS.income, boxShadow: shadowMd }}
          >
            <Check size={16} /> סמן כגמור
          </button>
        )}
        {!done && (
          <button
            onClick={() => onEdit(event)}
            className="px-4 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5"
            style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft }}
          >
            <Pencil size={15} /> עריכה
          </button>
        )}
        <ConfirmDelete
          onConfirm={() => {
            onDelete(event.id);
            onClose();
          }}
        />
      </div>
    </BottomSheet>
  );
}

function DayAgendaModal({ date, events, onSelectEvent, onAddNew, onClose }) {
  return (
    <BottomSheet title={fmtDate(date)} onClose={onClose}>
      <div className="space-y-2 mb-3">
        {events.map((e) => (
          <EventRow key={e.id} event={e} onClick={() => onSelectEvent(e)} />
        ))}
      </div>
      <button
        onClick={onAddNew}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, boxShadow: shadowSm }}
      >
        <Plus size={16} /> הוסף אירוע נוסף בתאריך זה
      </button>
    </BottomSheet>
  );
}

function EventRow({ event, onClick }) {
  const done = event.status === "done";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-right"
      style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm, opacity: done ? 0.6 : 1 }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: done ? COLORS.incomeTint : COLORS.goldTint }}
      >
        {done ? <Check size={16} style={{ color: COLORS.income }} /> : <CalendarDays size={16} style={{ color: COLORS.gold }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ textDecoration: done ? "line-through" : "none" }}>{event.name}</p>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {fmtDate(event.date)}{event.startTime ? ` · ${event.startTime}` : ""}{event.location ? ` · ${event.location}` : ""}
          {event.source === "iphone" ? " · 📱 מהאייפון" : ""}
        </p>
      </div>
      {(event.source !== "iphone" || event.income > 0) && (
        <p className="font-semibold tabular-nums shrink-0 text-sm" style={{ color: COLORS.income }}>
          {fmtCurrency(event.income)}
        </p>
      )}
    </button>
  );
}

export default function EventsCalendar({ events, onAddEvent, onUpdateEvent, onDeleteEvent, onCompleteEvent, onEventsSynced, catalog }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [dayAgenda, setDayAgenda] = useState(null); // { date, events }

  const viewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthName = viewDate.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [events]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = new Date(year, month, 1).getDay();
  const dateKeyFor = (day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(day);

  const sortedEvents = useMemo(() => [...events].sort((a, b) => (a.date < b.date ? -1 : 1)), [events]);

  return (
    <div className="space-y-4">
      <ReminderToggle />
      <RemindersShortcut />
      <PhoneCalendarSync onSynced={onEventsSynced} />

      <div className="rounded-2xl p-5" style={{ backgroundColor: COLORS.surface, boxShadow: shadowMd }}>
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="p-2 rounded-full" style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSoft }}>
            <ChevronRight size={20} />
          </button>
          <p className="text-lg font-bold">{monthName}</p>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="p-2 rounded-full" style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSoft }}>
            <ChevronLeft size={20} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 text-center mb-2">
          {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
            <span key={d} className="text-xs font-semibold" style={{ color: COLORS.textMuted }}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const key = dateKeyFor(day);
            const dayEvents = eventsByDate[key] || [];
            const today = isToday(key);
            return (
              <button
                key={idx}
                onClick={() => {
                  if (dayEvents.length > 0) setDayAgenda({ date: key, events: dayEvents });
                  else {
                    setAddDate(key);
                    setShowAdd(true);
                  }
                }}
                className="aspect-square rounded-xl flex flex-col items-center justify-center text-base relative"
                style={{
                  backgroundColor: today ? COLORS.goldTint : "transparent",
                  color: today ? COLORS.goldSoft : COLORS.textPrimary,
                  fontWeight: today ? 700 : 500,
                  border: today ? `1.5px solid ${COLORS.gold}` : "1.5px solid transparent",
                }}
              >
                {day}
                {dayEvents.length === 1 && (
                  <span
                    className="w-2 h-2 rounded-full absolute bottom-1.5"
                    style={{ backgroundColor: COLORS.income }}
                  />
                )}
                {dayEvents.length > 1 && (
                  <span
                    className="absolute bottom-0.5 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center"
                    style={{ backgroundColor: COLORS.income, color: "#fff" }}
                  >
                    {dayEvents.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={() => {
          setAddDate(todayStr());
          setShowAdd(true);
        }}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, boxShadow: shadowSm }}
      >
        <Plus size={16} /> אירוע חדש
      </button>

      <div>
        <p className="text-sm font-semibold mb-2">כל האירועים</p>
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted, boxShadow: shadowSm }}>
            <p className="text-sm">אין עדיין אירועים. תוסיף אחד דרך הלוח למעלה או הכפתור 👆</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedEvents.map((e) => (
              <EventRow key={e.id} event={e} onClick={() => setSelectedEvent(e)} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddEventModal
          initialDate={addDate}
          onClose={() => setShowAdd(false)}
          onSave={(event) => {
            onAddEvent(event);
            setShowAdd(false);
          }}
          catalog={catalog}
        />
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComplete={onCompleteEvent}
          onDelete={onDeleteEvent}
          onEdit={(event) => {
            setSelectedEvent(null);
            setEditingEvent(event);
          }}
        />
      )}

      {editingEvent && (
        <AddEventModal
          editingEvent={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSave={(event) => {
            onUpdateEvent(event);
            setEditingEvent(null);
          }}
          catalog={catalog}
        />
      )}

      {dayAgenda && (
        <DayAgendaModal
          date={dayAgenda.date}
          events={dayAgenda.events}
          onClose={() => setDayAgenda(null)}
          onSelectEvent={(event) => {
            setDayAgenda(null);
            setSelectedEvent(event);
          }}
          onAddNew={() => {
            setAddDate(dayAgenda.date);
            setDayAgenda(null);
            setShowAdd(true);
          }}
        />
      )}
    </div>
  );
}
