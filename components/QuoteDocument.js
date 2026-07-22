import React from "react";
import { COLORS, fmtDate } from "../lib/theme";

// פרטי העסק שמופיעים על גבי כל הצעת מחיר
export const BUSINESS = {
  name: "I-BOX EVENTS",
  ownerName: "יגאל בוארון",
  email: "iboxattraction@gmail.com",
  phone: "052-8606446",
  companyId: "325187193",
};

export const DEFAULT_TERMS = [
  "אין צורך במקדמה.",
  "התשלום המלא יבוצע עד שבוע לאחר האירוע.",
  "ביטול עד שבועיים לפני מועד האירוע - ללא חיוב. ביטול לאחר מכן - חייב בגובה 50% מסכום ההצעה.",
  'המחיר כולל מע"מ כדין.',
  "ההצעה תקפה ל-14 יום ממועד הוצאתה.",
];

export const fmtILS = (n) => `₪ ${Math.round(n || 0).toLocaleString("he-IL")}`;

// תוכן הצעת המחיר עצמה - משותף בין התצוגה בתוך האפליקציה לבין עמוד השיתוף הציבורי
export default function QuoteDocument({ quote, innerRef }) {
  const total = quote.items.reduce((s, it) => s + it.price, 0);
  const dark = "#211E1A";

  return (
    <div
      ref={innerRef}
      dir="rtl"
      className="rounded-2xl p-5 relative overflow-hidden"
      style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}
    >
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url(/quote-bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.18,
        }}
      />
      <div className="relative">
      <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mb-5 text-sm">
        <div>
          <p><b>לכבוד:</b> {quote.clientName}</p>
          {quote.clientPhone && <p><b>טלפון:</b> {quote.clientPhone}</p>}
          {quote.eventType && <p><b>סוג אירוע:</b> {quote.eventType}</p>}
        </div>
        <div>
          {quote.location && <p><b>מיקום:</b> {quote.location}</p>}
          <p><b>תאריך אירוע:</b> {fmtDate(quote.date)}</p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        {quote.items.map((it) => (
          <div key={it.id} className="rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: dark }}>
              <span className="font-bold text-sm" style={{ color: COLORS.gold }}>{fmtILS(it.price)}</span>
              <span className="font-bold text-sm" style={{ color: "#fff" }}>{it.description}</span>
            </div>
            {it.details && it.details.length > 0 && (
              <ul className="px-4 py-2 space-y-1" style={{ backgroundColor: COLORS.surfaceSoft }}>
                {it.details.map((d, idx) => (
                  <li key={idx} className="flex items-center justify-end gap-1.5 text-xs">
                    <span>{d}</span>
                    <span style={{ color: COLORS.gold }}>◆</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg mb-4" style={{ backgroundColor: dark }}>
        <span className="font-bold text-sm" style={{ color: COLORS.gold }}>{fmtILS(total)}</span>
        <span className="font-bold text-sm" style={{ color: COLORS.gold }}>סה"כ לתשלום (כולל מע"מ)</span>
      </div>

      <div className="mb-4">
        <p className="font-semibold text-sm text-center mb-2">תנאים כלליים</p>
        <ul className="space-y-1">
          {DEFAULT_TERMS.map((t, idx) => (
            <li key={idx} className="flex items-start justify-end gap-1.5 text-xs">
              <span className="text-right">{t}</span>
              <span className="shrink-0">•</span>
            </li>
          ))}
          {quote.notes && (
            <li className="flex items-start justify-end gap-1.5 text-xs">
              <span className="text-right">{quote.notes}</span>
              <span className="shrink-0">•</span>
            </li>
          )}
        </ul>
      </div>

      {quote.signature && (
        <div className="mb-4 rounded-xl p-3" style={{ backgroundColor: COLORS.incomeTint }}>
          <p className="text-xs font-semibold mb-2 text-center" style={{ color: COLORS.income }}>
            נחתם ואושר על ידי הלקוח{quote.signedAt ? ` · ${fmtDate(quote.signedAt)}` : ""}
          </p>
          <img src={quote.signature} alt="חתימת הלקוח" className="mx-auto" style={{ maxHeight: 80, backgroundColor: "#fff", borderRadius: 8 }} />
        </div>
      )}

      <p className="text-sm mb-0.5">בברכה,</p>
      <p className="text-sm font-bold mb-3">{BUSINESS.name} | {BUSINESS.ownerName}</p>

      <div style={{ borderTop: `1px solid ${COLORS.gold}` }} className="pt-2">
        <p className="text-center text-xs" style={{ color: COLORS.textMuted }}>
          {BUSINESS.email} | {BUSINESS.phone} | ח.פ {BUSINESS.companyId} | {BUSINESS.name}
        </p>
      </div>
      </div>
    </div>
  );
}
