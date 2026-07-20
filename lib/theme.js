// קבועים ופונקציות טהורות (בלי React hooks) - ניתן לייבא גם מ-Server Components וגם מ-Client Components.

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

export const inputStyle = {
  backgroundColor: COLORS.surfaceSoft,
  border: `1px solid ${COLORS.border}`,
  color: COLORS.textPrimary,
};
