"use client";
import React, { useState, useEffect } from "react";
import { X, Trash2 } from "lucide-react";

export {
  COLORS, shadowSm, shadowMd, INCOME_CATEGORIES, EXPENSE_CATEGORIES,
  genId, todayStr, monthKeyOf, currentMonthKey, fmtCurrency, fmtDate, isToday, monthLabel,
  inputStyle,
} from "../lib/theme";
import { COLORS, inputStyle } from "../lib/theme";

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

// category chip grid - faster than a dropdown, plus a free-text option for anything not on the list
export function CategoryPicker({ categories, value, onChange }) {
  const isPreset = categories.some((c) => c.name === value);
  const [customMode, setCustomMode] = useState(!!value && !isPreset);
  const [customText, setCustomText] = useState(!isPreset ? value || "" : "");
  const [customTag, setCustomTag] = useState("פרטי");

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {categories.map((c) => {
          const selected = !customMode && value === c.name;
          const tagColor = c.tag === "עסקי" ? COLORS.tagBiz : COLORS.tagPersonal;
          return (
            <button
              key={c.name}
              type="button"
              onClick={() => {
                setCustomMode(false);
                onChange(c.name, c.tag);
              }}
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
        <button
          type="button"
          onClick={() => setCustomMode(true)}
          className="px-3 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            backgroundColor: customMode ? COLORS.goldTint : COLORS.surfaceSoft,
            border: `1.5px solid ${customMode ? COLORS.gold : COLORS.border}`,
            color: customMode ? COLORS.goldSoft : COLORS.textPrimary,
          }}
        >
          + קטגוריה אחרת
        </button>
      </div>
      {customMode && (
        <div className="mt-2 flex items-center gap-2">
          <input
            type="text"
            autoFocus
            value={customText}
            onChange={(e) => {
              setCustomText(e.target.value);
              onChange(e.target.value, customTag);
            }}
            placeholder="הקלד קטגוריה משלך..."
            className="flex-1 rounded-xl px-3 py-2 outline-none text-sm"
            style={inputStyle}
          />
          <div className="flex gap-1 shrink-0">
            {["עסקי", "פרטי"].map((t) => {
              const tagColor = t === "עסקי" ? COLORS.tagBiz : COLORS.tagPersonal;
              const selected = customTag === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    setCustomTag(t);
                    onChange(customText, t);
                  }}
                  className="px-2.5 py-2 rounded-xl text-xs font-medium"
                  style={{
                    backgroundColor: selected ? tagColor + "20" : COLORS.surfaceSoft,
                    border: `1.5px solid ${selected ? tagColor : COLORS.border}`,
                    color: selected ? tagColor : COLORS.textMuted,
                  }}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
