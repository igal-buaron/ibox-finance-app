"use client";
import React, { useState, useMemo } from "react";
import { Plus, ChevronLeft, ChevronRight, Check, X, CalendarDays } from "lucide-react";
import {
  COLORS, shadowSm, shadowMd, EXPENSE_CATEGORIES,
  genId, todayStr, fmtCurrency, fmtDate, isToday,
  BottomSheet, FieldLabel, inputStyle, CategoryPicker, ConfirmDelete,
} from "./shared";

function AddEventModal({ initialDate, onClose, onSave }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState(initialDate || todayStr());
  const [income, setIncome] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [note, setNote] = useState("");
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
      id: genId(),
      name: name.trim(),
      date,
      status: "planned",
      income: incomeNum,
      incomeCategory: "הכנסה מאירוע",
      expenses: cleanExpenses,
      note: note.trim(),
    });
  };

  return (
    <BottomSheet title="אירוע חדש" onClose={onClose}>
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

function EventDetailsModal({ event, onClose, onComplete, onDelete }) {
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
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>{fmtDate(event.date)}</p>
      </div>
      <p className="font-semibold tabular-nums shrink-0 text-sm" style={{ color: COLORS.income }}>
        {fmtCurrency(event.income)}
      </p>
    </button>
  );
}

export default function EventsCalendar({ events, onAddEvent, onDeleteEvent, onCompleteEvent }) {
  const [monthOffset, setMonthOffset] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [addDate, setAddDate] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);

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
      <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => setMonthOffset((m) => m - 1)} className="p-1.5 rounded-full" style={{ color: COLORS.textMuted }}>
            <ChevronRight size={18} />
          </button>
          <p className="text-sm font-semibold">{monthName}</p>
          <button onClick={() => setMonthOffset((m) => m + 1)} className="p-1.5 rounded-full" style={{ color: COLORS.textMuted }}>
            <ChevronLeft size={18} />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center mb-1">
          {["א", "ב", "ג", "ד", "ה", "ו", "ש"].map((d) => (
            <span key={d} className="text-[11px] font-medium" style={{ color: COLORS.textMuted }}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (day === null) return <div key={idx} />;
            const key = dateKeyFor(day);
            const dayEvents = eventsByDate[key] || [];
            const today = isToday(key);
            return (
              <button
                key={idx}
                onClick={() => {
                  if (dayEvents.length > 0) setSelectedEvent(dayEvents[0]);
                  else {
                    setAddDate(key);
                    setShowAdd(true);
                  }
                }}
                className="aspect-square rounded-lg flex flex-col items-center justify-center text-xs relative"
                style={{
                  backgroundColor: today ? COLORS.goldTint : "transparent",
                  color: today ? COLORS.goldSoft : COLORS.textPrimary,
                  fontWeight: today ? 700 : 400,
                }}
              >
                {day}
                {dayEvents.length > 0 && (
                  <span
                    className="w-1.5 h-1.5 rounded-full absolute bottom-1"
                    style={{ backgroundColor: dayEvents.some((e) => e.status !== "done") ? COLORS.gold : COLORS.income }}
                  />
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
        />
      )}

      {selectedEvent && (
        <EventDetailsModal
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onComplete={onCompleteEvent}
          onDelete={onDeleteEvent}
        />
      )}
    </div>
  );
}
