"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, TrendingUp, TrendingDown, Users, Wallet,
  LayoutGrid, ArrowUpCircle, ArrowDownCircle, Loader2, Receipt, Pencil, Check, LogOut, CalendarDays, FileText,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid
} from "recharts";
import {
  COLORS, shadowSm, shadowMd, INCOME_CATEGORIES, EXPENSE_CATEGORIES,
  genId, todayStr, monthKeyOf, currentMonthKey, fmtCurrency, fmtDate, isToday, monthLabel,
  TagBadge, ConfirmDelete, BottomSheet, FieldLabel, inputStyle, CategoryPicker,
} from "./shared";
import EventsCalendar from "./EventsCalendar";
import Quotes from "./Quotes";

function AddTransactionModal({ initialType, initialDate, onClose, onSave }) {
  const [type, setType] = useState(initialType || "expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [tag, setTag] = useState("פרטי");
  const [date, setDate] = useState(initialDate || todayStr());
  const [editingDate, setEditingDate] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const typeColor = type === "income" ? COLORS.income : COLORS.expense;

  useEffect(() => {
    setCategory("");
    setTag("פרטי");
  }, [type]);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("צריך למלא סכום תקין");
    if (!category.trim()) return setError("צריך לבחור או להקליד קטגוריה");
    onSave({
      id: genId(),
      type,
      amount: num,
      category: category.trim(),
      tag,
      date,
      note: note.trim(),
    });
  };

  return (
    <BottomSheet title={type === "income" ? "הכנסה חדשה" : "הוצאה חדשה"} onClose={onClose}>
      <div className="flex gap-2 mb-4">
        {[
          { key: "expense", label: "הוצאה", icon: ArrowDownCircle, color: COLORS.expense, tint: COLORS.expenseTint },
          { key: "income", label: "הכנסה", icon: ArrowUpCircle, color: COLORS.income, tint: COLORS.incomeTint },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setType(opt.key)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{
              backgroundColor: type === opt.key ? opt.tint : COLORS.surfaceSoft,
              border: `1.5px solid ${type === opt.key ? opt.color : COLORS.border}`,
              color: type === opt.key ? opt.color : COLORS.textMuted,
            }}
          >
            <opt.icon size={17} />
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-4">
        <FieldLabel>סכום (₪)</FieldLabel>
        <input
          type="number"
          inputMode="decimal"
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl px-4 py-3 text-2xl font-bold tabular-nums outline-none"
          style={{ ...inputStyle, color: typeColor }}
        />
      </div>

      <div className="mb-4">
        <FieldLabel>קטגוריה</FieldLabel>
        <CategoryPicker
          key={type}
          categories={categories}
          value={category}
          onChange={(name, t) => {
            setCategory(name);
            if (t) setTag(t);
          }}
        />
      </div>

      <div className="mb-4 flex items-center gap-2">
        {editingDate ? (
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-xl px-3 py-2 outline-none text-sm"
            style={inputStyle}
          />
        ) : (
          <button
            onClick={() => setEditingDate(true)}
            className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl"
            style={{ backgroundColor: COLORS.surfaceSoft, color: COLORS.textMuted }}
          >
            <Pencil size={13} />
            {isToday(date) ? "היום" : fmtDate(date)}
          </button>
        )}
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="הערה קצרה (לא חובה)"
          className="flex-1 rounded-xl px-3 py-2 outline-none text-sm"
          style={inputStyle}
        />
      </div>

      {error && <p className="text-sm mb-3" style={{ color: COLORS.expense }}>{error}</p>}

      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-xl font-semibold text-white"
        style={{ backgroundColor: typeColor, boxShadow: shadowMd }}
      >
        שמור {type === "income" ? "הכנסה" : "הוצאה"}
      </button>
    </BottomSheet>
  );
}

function AddDebtModal({ onClose, onSave, initialDirection }) {
  const [direction, setDirection] = useState(initialDirection || "owedToMe");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!name.trim()) return setError("צריך למלא שם");
    if (!num || num <= 0) return setError("צריך למלא סכום תקין");
    onSave({
      id: genId(),
      direction,
      name: name.trim(),
      amount: num,
      note: note.trim(),
      date: todayStr(),
      settled: false,
    });
  };

  return (
    <BottomSheet title="רישום חוב חדש" onClose={onClose}>
      <div className="flex gap-2 mb-4">
        {[
          { key: "owedToMe", label: "חייבים לי" },
          { key: "iOwe", label: "אני חייב" },
        ].map((opt) => (
          <button
            key={opt.key}
            onClick={() => setDirection(opt.key)}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-colors"
            style={{
              backgroundColor: direction === opt.key ? COLORS.goldTint : COLORS.surfaceSoft,
              border: `1.5px solid ${direction === opt.key ? COLORS.gold : COLORS.border}`,
              color: direction === opt.key ? COLORS.goldSoft : COLORS.textMuted,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="mb-3">
        <FieldLabel>שם</FieldLabel>
        <input
          type="text"
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="שם האדם / הלקוח"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>סכום (₪)</FieldLabel>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0"
          className="w-full rounded-xl px-3 py-2.5 text-lg font-semibold tabular-nums outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-4">
        <FieldLabel>על מה זה (לא חובה)</FieldLabel>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="לדוגמה: מקדמה לאירוע 14.8"
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
        שמור
      </button>
    </BottomSheet>
  );
}

function TransactionDetailsModal({ t, onClose, onDelete }) {
  const isIncome = t.type === "income";
  return (
    <BottomSheet title={t.category} onClose={onClose}>
      <div className="mb-4 flex items-center gap-2">
        <TagBadge tag={t.tag} />
        <span className="text-sm" style={{ color: COLORS.textMuted }}>{fmtDate(t.date)}</span>
      </div>

      <div
        className="rounded-xl p-4 mb-4 text-center"
        style={{ backgroundColor: isIncome ? COLORS.incomeTint : COLORS.expenseTint }}
      >
        <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>{isIncome ? "הכנסה" : "הוצאה"}</p>
        <p className="text-2xl font-extrabold tabular-nums" style={{ color: isIncome ? COLORS.income : COLORS.expense }}>
          {isIncome ? "+" : "-"}{fmtCurrency(t.amount)}
        </p>
      </div>

      <div className="mb-5">
        <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>מקור / הערה</p>
        <p className="text-sm">{t.note || "אין הערה"}</p>
      </div>

      <div className="flex items-center justify-between px-1">
        <span className="text-sm" style={{ color: COLORS.textMuted }}>מחיקת התנועה</span>
        <ConfirmDelete
          onConfirm={() => {
            onDelete();
            onClose();
          }}
        />
      </div>
    </BottomSheet>
  );
}

// ---------- main app ----------

export default function FinanceTracker() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [events, setEvents] = useState([]);
  const [quotes, setQuotes] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickAddType, setQuickAddType] = useState(null);
  const [quickAddDate, setQuickAddDate] = useState(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [debtDirection, setDebtDirection] = useState("owedToMe");
  const [openTransaction, setOpenTransaction] = useState(null);
  const [filterTag, setFilterTag] = useState("all");
  const [ledgerMonthOffset, setLedgerMonthOffset] = useState(0);
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/data");
        if (res.status === 401) {
          window.location.href = "/login";
          return;
        }
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        setTransactions(data.transactions || []);
        setDebts(data.debts || []);
        setEvents(data.events || []);
        setQuotes(data.quotes || []);
        setCatalog(data.catalog || []);
      } catch {
        setLoadError("לא הצלחתי לטעון את הנתונים. רענן את הדף ונסה שוב.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (entity, action, id, item) => {
    try {
      const res = await fetch("/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, action, id, item }),
      });
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) throw new Error("save failed");
      setSaveError("");
    } catch {
      setSaveError("השמירה לא הצליחה, נסה שוב");
    }
  }, []);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    window.location.href = "/login";
  };

  const addTransaction = (tx) => {
    const updated = [tx, ...transactions];
    setTransactions(updated);
    persist("transactions", "upsert", tx.id, tx);
    setQuickAddType(null);
    setQuickAddDate(null);
  };

  const deleteTransaction = (id) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    persist("transactions", "delete", id);
  };

  const addDebt = (debt) => {
    const updated = [debt, ...debts];
    setDebts(updated);
    persist("debts", "upsert", debt.id, debt);
    setShowAddDebt(false);
  };

  const deleteDebt = (id) => {
    const updated = debts.filter((d) => d.id !== id);
    setDebts(updated);
    persist("debts", "delete", id);
  };

  const toggleSettled = (id) => {
    const updated = debts.map((d) => (d.id === id ? { ...d, settled: !d.settled } : d));
    setDebts(updated);
    persist("debts", "upsert", id, updated.find((d) => d.id === id));
  };

  const addEvent = (event) => {
    const updated = [event, ...events];
    setEvents(updated);
    persist("events", "upsert", event.id, event);
  };

  const deleteEvent = (id) => {
    const updated = events.filter((e) => e.id !== id);
    setEvents(updated);
    persist("events", "delete", id);
  };

  // כשאירוע מסומן כגמור, ההכנסה וכל ההוצאות שהוגדרו לו נכנסות אוטומטית לתנועות
  const completeEvent = (event) => {
    const newTransactions = [];
    if (event.income > 0) {
      newTransactions.push({
        id: genId(),
        type: "income",
        amount: event.income,
        category: event.incomeCategory || "הכנסה מאירוע",
        tag: "עסקי",
        date: event.date,
        note: `אירוע: ${event.name}`,
      });
    }
    (event.expenses || []).forEach((exp) => {
      if (exp.amount > 0) {
        newTransactions.push({
          id: genId(),
          type: "expense",
          amount: exp.amount,
          category: exp.category,
          tag: "עסקי",
          date: event.date,
          note: `אירוע: ${event.name}`,
        });
      }
    });

    const updatedTransactions = [...newTransactions, ...transactions];
    setTransactions(updatedTransactions);
    newTransactions.forEach((tx) => persist("transactions", "upsert", tx.id, tx));

    const updatedEvent = { ...event, status: "done" };
    const updatedEvents = events.map((e) => (e.id === event.id ? updatedEvent : e));
    setEvents(updatedEvents);
    persist("events", "upsert", event.id, updatedEvent);
  };

  const addQuote = (quote) => {
    const updated = [quote, ...quotes];
    setQuotes(updated);
    persist("quotes", "upsert", quote.id, quote);
  };

  const deleteQuote = (id) => {
    const updated = quotes.filter((q) => q.id !== id);
    setQuotes(updated);
    persist("quotes", "delete", id);
  };

  // כשלקוח מאשר הצעת מחיר, נוצר ממנה אירוע מתוכנן (ההכנסה תיכנס בפועל רק כשהאירוע יסומן כגמור)
  const acceptQuote = (quote) => {
    const newEvent = {
      id: genId(),
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
    addEvent(newEvent);

    const updatedQuote = { ...quote, status: "accepted" };
    const updatedQuotes = quotes.map((q) => (q.id === quote.id ? updatedQuote : q));
    setQuotes(updatedQuotes);
    persist("quotes", "upsert", quote.id, updatedQuote);
  };

  const addCatalogItem = (item) => {
    const exists = catalog.some((c) => c.id === item.id);
    const updated = exists ? catalog.map((c) => (c.id === item.id ? item : c)) : [item, ...catalog];
    setCatalog(updated);
    persist("catalog", "upsert", item.id, item);
  };

  const deleteCatalogItem = (id) => {
    const updated = catalog.filter((c) => c.id !== id);
    setCatalog(updated);
    persist("catalog", "delete", id);
  };

  const stats = useMemo(() => {
    const cmk = currentMonthKey();
    let monthIncome = 0, monthExpense = 0, allIncome = 0, allExpense = 0;
    transactions.forEach((t) => {
      if (t.type === "income") {
        allIncome += t.amount;
        if (monthKeyOf(t.date) === cmk) monthIncome += t.amount;
      } else {
        allExpense += t.amount;
        if (monthKeyOf(t.date) === cmk) monthExpense += t.amount;
      }
    });
    const owedToMe = debts.filter((d) => d.direction === "owedToMe" && !d.settled).reduce((s, d) => s + d.amount, 0);
    const iOwe = debts.filter((d) => d.direction === "iOwe" && !d.settled).reduce((s, d) => s + d.amount, 0);
    return {
      monthIncome, monthExpense, monthBalance: monthIncome - monthExpense,
      allBalance: allIncome - allExpense, owedToMe, iOwe,
    };
  }, [transactions, debts]);

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ key, label: monthLabel(key), הכנסות: 0, הוצאות: 0 });
    }
    transactions.forEach((t) => {
      const mk = monthKeyOf(t.date);
      const bucket = months.find((m) => m.key === mk);
      if (bucket) bucket[t.type === "income" ? "הכנסות" : "הוצאות"] += t.amount;
    });
    return months;
  }, [transactions]);

  const ledgerViewDate = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + ledgerMonthOffset);
    return d;
  }, [ledgerMonthOffset]);
  const ledgerMonthKey = `${ledgerViewDate.getFullYear()}-${String(ledgerViewDate.getMonth() + 1).padStart(2, "0")}`;
  const ledgerMonthName = ledgerViewDate.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  const ledgerIncome = useMemo(() => {
    return transactions
      .filter((t) => t.type === "income" && monthKeyOf(t.date) === ledgerMonthKey)
      .filter((t) => filterTag === "all" || t.tag === filterTag)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, ledgerMonthKey, filterTag]);

  const ledgerExpense = useMemo(() => {
    return transactions
      .filter((t) => t.type === "expense" && monthKeyOf(t.date) === ledgerMonthKey)
      .filter((t) => filterTag === "all" || t.tag === filterTag)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, ledgerMonthKey, filterTag]);

  const ledgerIncomeTotal = ledgerIncome.reduce((s, t) => s + t.amount, 0);
  const ledgerExpenseTotal = ledgerExpense.reduce((s, t) => s + t.amount, 0);

  const openLedgerAdd = (type) => {
    setQuickAddType(type);
    setQuickAddDate(ledgerMonthKey === currentMonthKey() ? todayStr() : `${ledgerMonthKey}-01`);
  };

  const activeDebts = debts.filter((d) => !d.settled);
  const settledDebts = debts.filter((d) => d.settled);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: COLORS.bg }}>
        <Loader2 className="animate-spin" style={{ color: COLORS.gold }} size={28} />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen max-w-md mx-auto relative flex flex-col"
      style={{ backgroundColor: COLORS.bg, color: COLORS.textPrimary }}
    >
      <div className="px-5 pt-6 pb-3 sticky top-0 z-10" style={{ backgroundColor: COLORS.bg }}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Wallet size={17} style={{ color: COLORS.gold }} />
            <span className="text-sm font-medium tracking-wide" style={{ color: COLORS.textMuted }}>I-BOX · ניהול כספי</span>
          </div>
          <button onClick={handleLogout} className="p-1.5 rounded-full" style={{ color: COLORS.textMuted }} title="התנתק">
            <LogOut size={17} />
          </button>
        </div>
        <h1 className="text-2xl font-bold">שלום יגאל</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-28">
        {loadError && (
          <div className="text-center py-4 mb-3 rounded-2xl text-sm" style={{ backgroundColor: COLORS.expenseTint, color: COLORS.expense }}>
            {loadError}
          </div>
        )}

        {activeTab === "dashboard" && (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={() => setQuickAddType("income")}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold"
                style={{ backgroundColor: COLORS.incomeTint, color: COLORS.income, boxShadow: shadowSm }}
              >
                <Plus size={18} />
                הכנסה
              </button>
              <button
                onClick={() => setQuickAddType("expense")}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl font-semibold"
                style={{ backgroundColor: COLORS.expenseTint, color: COLORS.expense, boxShadow: shadowSm }}
              >
                <Plus size={18} />
                הוצאה
              </button>
            </div>

            <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={{ color: COLORS.textPrimary }}>הכנסות מול הוצאות</p>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.income }} />הכנסות</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS.expense }} />הוצאות</span>
                </div>
              </div>
              <div style={{ height: 190 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={4}>
                    <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: COLORS.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      formatter={(v) => fmtCurrency(v)}
                      contentStyle={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 10, direction: "rtl", boxShadow: shadowMd }}
                      labelStyle={{ color: COLORS.textPrimary, fontWeight: 600 }}
                      cursor={{ fill: COLORS.surfaceSoft }}
                    />
                    <Bar dataKey="הכנסות" fill={COLORS.income} radius={[6, 6, 0, 0]} maxBarSize={22} />
                    <Bar dataKey="הוצאות" fill={COLORS.expense} radius={[6, 6, 0, 0]} maxBarSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl p-5" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
              <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>יתרה כוללת (כל הזמנים)</p>
              <p className="text-4xl font-extrabold tabular-nums mb-4" style={{ color: stats.allBalance >= 0 ? COLORS.goldSoft : COLORS.expense }}>
                {fmtCurrency(stats.allBalance)}
              </p>
              <div className="flex gap-4 text-sm">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS.incomeTint }}>
                  <TrendingUp size={14} style={{ color: COLORS.income }} />
                  <span className="font-semibold tabular-nums" style={{ color: COLORS.income }}>{fmtCurrency(stats.monthIncome)}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: COLORS.expenseTint }}>
                  <TrendingDown size={14} style={{ color: COLORS.expense }} />
                  <span className="font-semibold tabular-nums" style={{ color: COLORS.expense }}>{fmtCurrency(stats.monthExpense)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setDebtDirection("owedToMe");
                  setShowAddDebt(true);
                }}
                className="rounded-2xl p-4 text-right"
                style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}
              >
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>חייבים לי</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: COLORS.goldSoft }}>{fmtCurrency(stats.owedToMe)}</p>
              </button>
              <button
                onClick={() => {
                  setDebtDirection("iOwe");
                  setShowAddDebt(true);
                }}
                className="rounded-2xl p-4 text-right"
                style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}
              >
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>אני חייב</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: COLORS.expense }}>{fmtCurrency(stats.iOwe)}</p>
              </button>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">תנועות אחרונות</p>
              {transactions.length === 0 ? (
                <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted, boxShadow: shadowSm }}>
                  <p className="text-sm">אין עדיין תנועות. תלחץ על "הכנסה" או "הוצאה" למעלה כדי להתחיל 👆</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {transactions.slice(0, 5).map((t) => (
                    <TransactionRow key={t.id} t={t} onDelete={() => deleteTransaction(t.id)} onOpen={() => setOpenTransaction(t)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-2xl p-2" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
              <button
                onClick={() => setLedgerMonthOffset((m) => m - 1)}
                className="p-2 rounded-full"
                style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSoft }}
              >
                <ChevronRight size={18} />
              </button>
              <p className="text-sm font-bold">{ledgerMonthName}</p>
              <button
                onClick={() => setLedgerMonthOffset((m) => m + 1)}
                className="p-2 rounded-full"
                style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSoft }}
              >
                <ChevronLeft size={18} />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: "all", label: "הכל" },
                { key: "עסקי", label: "עסקי" },
                { key: "פרטי", label: "פרטי" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterTag(f.key)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: filterTag === f.key ? COLORS.surfaceSoft : COLORS.surface,
                    color: filterTag === f.key ? COLORS.goldSoft : COLORS.textMuted,
                    boxShadow: shadowSm,
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <LedgerTable
              title="הכנסות"
              rows={ledgerIncome}
              total={ledgerIncomeTotal}
              color={COLORS.income}
              tint={COLORS.incomeTint}
              onAdd={() => openLedgerAdd("income")}
              onOpenRow={(t) => setOpenTransaction(t)}
              emptyLabel="אין הכנסות בחודש זה"
            />

            <LedgerTable
              title="הוצאות"
              rows={ledgerExpense}
              total={ledgerExpenseTotal}
              color={COLORS.expense}
              tint={COLORS.expenseTint}
              onAdd={() => openLedgerAdd("expense")}
              onOpenRow={(t) => setOpenTransaction(t)}
              emptyLabel="אין הוצאות בחודש זה"
            />
          </div>
        )}

        {activeTab === "debts" && (
          <div className="space-y-5">
            <button
              onClick={() => {
                setDebtDirection("owedToMe");
                setShowAddDebt(true);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, boxShadow: shadowSm }}
            >
              <Plus size={16} /> חוב חדש
            </button>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  setDebtDirection("owedToMe");
                  setShowAddDebt(true);
                }}
                className="rounded-2xl p-4 text-right"
                style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}
              >
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>סה"כ חייבים לי</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: COLORS.goldSoft }}>{fmtCurrency(stats.owedToMe)}</p>
              </button>
              <button
                onClick={() => {
                  setDebtDirection("iOwe");
                  setShowAddDebt(true);
                }}
                className="rounded-2xl p-4 text-right"
                style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}
              >
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>סה"כ אני חייב</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: COLORS.expense }}>{fmtCurrency(stats.iOwe)}</p>
              </button>
            </div>

            {activeDebts.length === 0 ? (
              <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted, boxShadow: shadowSm }}>
                <p className="text-sm">אין חובות פתוחים כרגע</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm font-semibold">פתוחים</p>
                {activeDebts.map((d) => (
                  <DebtRow key={d.id} d={d} onToggle={() => toggleSettled(d.id)} onDelete={() => deleteDebt(d.id)} />
                ))}
              </div>
            )}

            {settledDebts.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold" style={{ color: COLORS.textMuted }}>שולמו</p>
                {settledDebts.map((d) => (
                  <DebtRow key={d.id} d={d} onToggle={() => toggleSettled(d.id)} onDelete={() => deleteDebt(d.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "events" && (
          <EventsCalendar
            events={events}
            onAddEvent={addEvent}
            onDeleteEvent={deleteEvent}
            onCompleteEvent={completeEvent}
            catalog={catalog}
          />
        )}

        {activeTab === "quotes" && (
          <Quotes
            quotes={quotes}
            onAddQuote={addQuote}
            onDeleteQuote={deleteQuote}
            onAcceptQuote={acceptQuote}
            catalog={catalog}
            onSaveCatalogItem={addCatalogItem}
            onDeleteCatalogItem={deleteCatalogItem}
          />
        )}

        {saveError && (
          <p className="text-xs mt-3 text-center" style={{ color: COLORS.expense }}>{saveError}</p>
        )}
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md flex items-center justify-around h-16 z-10"
        style={{ backgroundColor: COLORS.surface, borderTop: `1px solid ${COLORS.border}` }}
      >
        {[
          { key: "dashboard", label: "בית", icon: LayoutGrid },
          { key: "transactions", label: "תנועות", icon: Receipt },
          { key: "events", label: "יומן", icon: CalendarDays },
          { key: "quotes", label: "הצעות", icon: FileText },
          { key: "debts", label: "חובות", icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex flex-col items-center gap-1 text-[11px] font-medium px-2 py-2"
            style={{ color: activeTab === tab.key ? COLORS.gold : COLORS.textMuted }}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {quickAddType && (
        <AddTransactionModal
          initialType={quickAddType}
          initialDate={quickAddDate}
          onClose={() => {
            setQuickAddType(null);
            setQuickAddDate(null);
          }}
          onSave={addTransaction}
        />
      )}
      {showAddDebt && (
        <AddDebtModal onClose={() => setShowAddDebt(false)} onSave={addDebt} initialDirection={debtDirection} />
      )}
      {openTransaction && (
        <TransactionDetailsModal
          t={openTransaction}
          onClose={() => setOpenTransaction(null)}
          onDelete={() => deleteTransaction(openTransaction.id)}
        />
      )}
    </div>
  );
}

function TransactionRow({ t, onDelete, onOpen }) {
  const isIncome = t.type === "income";
  return (
    <div
      onClick={onOpen}
      className="flex items-center gap-3 p-3 rounded-2xl cursor-pointer"
      style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: isIncome ? COLORS.incomeTint : COLORS.expenseTint }}
      >
        {isIncome ? (
          <ArrowUpCircle size={18} style={{ color: COLORS.income }} />
        ) : (
          <ArrowDownCircle size={18} style={{ color: COLORS.expense }} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate">{t.category}</p>
          <TagBadge tag={t.tag} />
        </div>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {fmtDate(t.date)}{t.note ? ` · ${t.note}` : ""}
        </p>
      </div>
      <p className="font-semibold tabular-nums shrink-0" style={{ color: isIncome ? COLORS.income : COLORS.expense }}>
        {isIncome ? "+" : "-"}{fmtCurrency(t.amount)}
      </p>
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDelete onConfirm={onDelete} />
      </div>
    </div>
  );
}

function DebtRow({ d, onToggle, onDelete }) {
  const owedToMe = d.direction === "owedToMe";
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-2xl"
      style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm, opacity: d.settled ? 0.55 : 1 }}
    >
      <button
        onClick={onToggle}
        className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
        style={{
          border: `1.5px solid ${d.settled ? COLORS.income : COLORS.border}`,
          backgroundColor: d.settled ? COLORS.income : "transparent",
          color: "#fff",
        }}
        title={d.settled ? "סומן כשולם" : "סמן כשולם"}
      >
        {d.settled && <Check size={14} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ textDecoration: d.settled ? "line-through" : "none" }}>{d.name}</p>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {fmtDate(d.date)}{d.note ? ` · ${d.note}` : ""}
        </p>
      </div>
      <p className="font-semibold tabular-nums shrink-0" style={{ color: owedToMe ? COLORS.goldSoft : COLORS.expense }}>
        {fmtCurrency(d.amount)}
      </p>
      <ConfirmDelete onConfirm={onDelete} />
    </div>
  );
}

function LedgerTable({ title, rows, total, color, tint, onAdd, onOpenRow, emptyLabel }) {
  return (
    <div className="rounded-2xl p-3" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <span className="text-sm font-bold tabular-nums" style={{ color }}>{fmtCurrency(total)}</span>
        </div>
        <button
          onClick={onAdd}
          className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
          style={{ backgroundColor: tint, color }}
        >
          <Plus size={13} /> הוסף
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-center py-5" style={{ color: COLORS.textMuted }}>{emptyLabel}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                <th className="text-right py-1.5 px-1.5 font-medium" style={{ color: COLORS.textMuted }}>תאריך</th>
                <th className="text-right py-1.5 px-1.5 font-medium" style={{ color: COLORS.textMuted }}>קטגוריה</th>
                <th className="text-right py-1.5 px-1.5 font-medium" style={{ color: COLORS.textMuted }}>הערה</th>
                <th className="text-left py-1.5 px-1.5 font-medium" style={{ color: COLORS.textMuted }}>סכום</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr
                  key={t.id}
                  onClick={() => onOpenRow(t)}
                  className="cursor-pointer"
                  style={{ borderBottom: `1px solid ${COLORS.border}` }}
                >
                  <td className="py-2 px-1.5 whitespace-nowrap" style={{ color: COLORS.textMuted }}>
                    {t.date.slice(8, 10)}.{t.date.slice(5, 7)}
                  </td>
                  <td className="py-2 px-1.5">{t.category}</td>
                  <td className="py-2 px-1.5 truncate max-w-[70px]" style={{ color: COLORS.textMuted }}>{t.note || "—"}</td>
                  <td className="py-2 px-1.5 text-left font-semibold tabular-nums whitespace-nowrap" style={{ color }}>
                    {fmtCurrency(t.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
