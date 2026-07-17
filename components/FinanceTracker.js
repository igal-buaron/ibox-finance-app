"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus, X, TrendingUp, TrendingDown, Users, Trash2, Wallet,
  LayoutGrid, ArrowUpCircle, ArrowDownCircle, Loader2, Receipt, Pencil, Check, LogOut
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, CartesianGrid
} from "recharts";

// ---------- design tokens (light, friendly) ----------
const COLORS = {
  bg: "#FAF7EF",
  surface: "#FFFFFF",
  surfaceSoft: "#F3EEE1",
  border: "#ECE6D6",
  gold: "#B8892E",
  goldSoft: "#8A6A22",
  goldTint: "#F3E7C9",
  textPrimary: "#2C2A24",
  textMuted: "#8B8574",
  income: "#2F9563",
  incomeTint: "#E3F3EA",
  expense: "#C24A3F",
  expenseTint: "#FBEAE7",
  tagBiz: "#B8892E",
  tagPersonal: "#4E7C8C",
};

const shadowSm = "0 1px 3px rgba(44,42,36,0.06), 0 1px 2px rgba(44,42,36,0.04)";
const shadowMd = "0 4px 14px rgba(44,42,36,0.08)";

const INCOME_CATEGORIES = [
  { name: "הכנסה מאירוע", tag: "עסקי" },
  { name: "הכנסה עסקית אחרת", tag: "עסקי" },
  { name: "משכורת", tag: "פרטי" },
  { name: "הכנסה פרטית אחרת", tag: "פרטי" },
];

const EXPENSE_CATEGORIES = [
  { name: "ציוד ותחזוקה", tag: "עסקי" },
  { name: "דלק ורכב עסקי", tag: "עסקי" },
  { name: "פרסום ושיווק", tag: "עסקי" },
  { name: "הוצאה עסקית אחרת", tag: "עסקי" },
  { name: "אוכל", tag: "פרטי" },
  { name: "בית ומשק בית", tag: "פרטי" },
  { name: "תחבורה", tag: "פרטי" },
  { name: "בילויים ופנאי", tag: "פרטי" },
  { name: "בריאות", tag: "פרטי" },
  { name: "הוצאה פרטית אחרת", tag: "פרטי" },
];

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const todayStr = () => new Date().toISOString().slice(0, 10);
const monthKeyOf = (dateStr) => dateStr.slice(0, 7);
const currentMonthKey = () => todayStr().slice(0, 7);

const fmtCurrency = (n) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
};

const isToday = (d) => d === todayStr();

const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("he-IL", { month: "short" });
};

// ---------- small building blocks ----------

function TagBadge({ tag }) {
  const color = tag === "עסקי" ? COLORS.tagBiz : COLORS.tagPersonal;
  return (
    <span
      className="text-[11px] px-2 py-0.5 rounded-full font-medium shrink-0"
      style={{ color, backgroundColor: color + "1A" }}
    >
      {tag}
    </span>
  );
}

function ConfirmDelete({ onConfirm }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2500);
    return () => clearTimeout(t);
  }, [armed]);
  return (
    <button
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className="p-2 rounded-lg transition-colors shrink-0"
      style={{
        color: armed ? "#fff" : COLORS.textMuted,
        backgroundColor: armed ? COLORS.expense : "transparent",
      }}
      title={armed ? "לחץ שוב לאישור" : "מחק"}
    >
      <Trash2 size={16} />
    </button>
  );
}

function BottomSheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "#2C2A2466" }}>
      <div
        className="w-full max-w-md rounded-t-3xl p-5 pb-8"
        style={{ backgroundColor: COLORS.surface, boxShadow: "0 -8px 30px rgba(44,42,36,0.18)" }}
      >
        <div className="w-10 h-1 rounded-full mx-auto mb-4" style={{ backgroundColor: COLORS.border }} />
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold" style={{ color: COLORS.textPrimary }}>{title}</h3>
          <button onClick={onClose} className="p-1.5 rounded-full" style={{ color: COLORS.textMuted, backgroundColor: COLORS.surfaceSoft }}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FieldLabel({ children }) {
  return <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.textMuted }}>{children}</label>;
}

const inputStyle = {
  backgroundColor: COLORS.surfaceSoft,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textPrimary,
};

function CategoryPicker({ categories, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((c) => {
        const selected = value === c.name;
        const tagColor = c.tag === "עסקי" ? COLORS.tagBiz : COLORS.tagPersonal;
        return (
          <button
            key={c.name}
            type="button"
            onClick={() => onChange(c.name)}
            className="px-3 py-2 rounded-xl text-sm font-medium transition-colors"
            style={{
              backgroundColor: selected ? tagColor + "20" : COLORS.surfaceSoft,
              border: `1.5px solid ${selected ? tagColor : COLORS.border}`,
              color: selected ? tagColor : COLORS.textPrimary,
            }}
          >
            {c.name}
          </button>
        );
      })}
    </div>
  );
}

function AddTransactionModal({ initialType, onClose, onSave }) {
  const [type, setType] = useState(initialType || "expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(todayStr());
  const [editingDate, setEditingDate] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const typeColor = type === "income" ? COLORS.income : COLORS.expense;

  useEffect(() => {
    setCategory("");
  }, [type]);

  const handleSave = () => {
    const num = parseFloat(amount);
    if (!num || num <= 0) return setError("צריך למלא סכום תקין");
    if (!category) return setError("צריך לבחור קטגוריה");
    const cat = categories.find((c) => c.name === category);
    onSave({
      id: genId(),
      type,
      amount: num,
      category,
      tag: cat ? cat.tag : "פרטי",
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
        <CategoryPicker categories={categories} value={category} onChange={setCategory} />
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

function AddDebtModal({ onClose, onSave }) {
  const [direction, setDirection] = useState("owedToMe");
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

// ---------- main app ----------

export default function FinanceTracker() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [debts, setDebts] = useState([]);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [quickAddType, setQuickAddType] = useState(null);
  const [showAddDebt, setShowAddDebt] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
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

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((t) => filterType === "all" || t.type === filterType)
      .filter((t) => filterTag === "all" || t.tag === filterTag)
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [transactions, filterType, filterTag]);

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
              <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>חייבים לי</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: COLORS.goldSoft }}>{fmtCurrency(stats.owedToMe)}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>אני חייב</p>
                <p className="text-xl font-bold tabular-nums" style={{ color: COLORS.expense }}>{fmtCurrency(stats.iOwe)}</p>
              </div>
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
                    <TransactionRow key={t.id} t={t} onDelete={() => deleteTransaction(t.id)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="space-y-3">
            <div className="flex gap-3">
              <button
                onClick={() => setQuickAddType("income")}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: COLORS.incomeTint, color: COLORS.income, boxShadow: shadowSm }}
              >
                <Plus size={16} /> הכנסה
              </button>
              <button
                onClick={() => setQuickAddType("expense")}
                className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm"
                style={{ backgroundColor: COLORS.expenseTint, color: COLORS.expense, boxShadow: shadowSm }}
              >
                <Plus size={16} /> הוצאה
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1">
              {[
                { key: "all", label: "הכל" },
                { key: "income", label: "הכנסות" },
                { key: "expense", label: "הוצאות" },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilterType(f.key)}
                  className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap"
                  style={{
                    backgroundColor: filterType === f.key ? COLORS.gold : COLORS.surface,
                    color: filterType === f.key ? "#fff" : COLORS.textMuted,
                    boxShadow: shadowSm,
                  }}
                >
                  {f.label}
                </button>
              ))}
              <span className="w-px my-1" style={{ backgroundColor: COLORS.border }} />
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

            {filteredTransactions.length === 0 ? (
              <div className="text-center py-10 rounded-2xl" style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted, boxShadow: shadowSm }}>
                <p className="text-sm">אין תנועות שמתאימות לסינון</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTransactions.map((t) => (
                  <TransactionRow key={t.id} t={t} onDelete={() => deleteTransaction(t.id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "debts" && (
          <div className="space-y-5">
            <button
              onClick={() => setShowAddDebt(true)}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm"
              style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, boxShadow: shadowSm }}
            >
              <Plus size={16} /> חוב חדש
            </button>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>סה"כ חייבים לי</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: COLORS.goldSoft }}>{fmtCurrency(stats.owedToMe)}</p>
              </div>
              <div className="rounded-2xl p-4" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
                <p className="text-xs mb-1" style={{ color: COLORS.textMuted }}>סה"כ אני חייב</p>
                <p className="text-lg font-bold tabular-nums" style={{ color: COLORS.expense }}>{fmtCurrency(stats.iOwe)}</p>
              </div>
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
          { key: "debts", label: "חובות", icon: Users },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className="flex flex-col items-center gap-1 text-xs font-medium px-4 py-2"
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
          onClose={() => setQuickAddType(null)}
          onSave={addTransaction}
        />
      )}
      {showAddDebt && <AddDebtModal onClose={() => setShowAddDebt(false)} onSave={addDebt} />}
    </div>
  );
}

function TransactionRow({ t, onDelete }) {
  const isIncome = t.type === "income";
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}>
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
      <ConfirmDelete onConfirm={onDelete} />
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
