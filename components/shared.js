import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";

// ---------- design tokens (light, friendly) ----------
export const COLORS = {
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

export const shadowSm = "0 1px 3px rgba(44,42,36,0.06), 0 1px 2px rgba(44,42,36,0.04)";
export const shadowMd = "0 4px 14px rgba(44,42,36,0.08)";

export const INCOME_CATEGORIES = [
  { name: "הכנסה מאירוע", tag: "עסקי" },
  { name: "הכנסה עסקית אחרת", tag: "עסקי" },
  { name: "משכורת", tag: "פרטי" },
  { name: "הכנסה פרטית אחרת", tag: "פרטי" },
];

export const EXPENSE_CATEGORIES = [
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

export const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
export const todayStr = () => new Date().toISOString().slice(0, 10);
export const monthKeyOf = (dateStr) => dateStr.slice(0, 7);
export const currentMonthKey = () => todayStr().slice(0, 7);

export const fmtCurrency = (n) =>
  new Intl.NumberFormat("he-IL", { style: "currency", currency: "ILS", maximumFractionDigits: 0 }).format(n || 0);

export const fmtDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("he-IL", { day: "2-digit", month: "2-digit", year: "numeric" });
  } catch {
    return d;
  }
};

export const isToday = (d) => d === todayStr();

export const monthLabel = (key) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString("he-IL", { month: "short" });
};

// ---------- small building blocks ----------

export function TagBadge({ tag }) {
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

export function ConfirmDelete({ onConfirm }) {
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

export function BottomSheet({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" style={{ backgroundColor: "#2C2A2466" }}>
      <div
        className="w-full max-w-md rounded-t-3xl p-5 pb-8 max-h-[90vh] overflow-y-auto"
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

export function FieldLabel({ children }) {
  return <label className="text-xs font-medium block mb-1.5" style={{ color: COLORS.textMuted }}>{children}</label>;
}

export const inputStyle = {
  backgroundColor: COLORS.surfaceSoft,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textPrimary,
};

// category chip grid - faster than a dropdown
export function CategoryPicker({ categories, value, onChange }) {
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
