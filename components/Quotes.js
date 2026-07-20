"use client";
import React, { useState, useRef } from "react";
import { Plus, X, FileText, Check, Download, Loader2 } from "lucide-react";
import {
  COLORS, shadowSm, shadowMd,
  genId, todayStr, fmtDate,
  BottomSheet, FieldLabel, inputStyle, ConfirmDelete,
} from "./shared";

// פרטי העסק שמופיעים על גבי כל הצעת מחיר
const BUSINESS = {
  name: "I-BOX EVENTS",
  ownerName: "יגאל בוארון",
  email: "iboxattraction@gmail.com",
  phone: "052-8606446",
  companyId: "325187193",
};

const DEFAULT_TERMS = [
  "אין צורך במקדמה.",
  "התשלום המלא יבוצע עד שבוע לאחר האירוע.",
  "ביטול עד שבועיים לפני מועד האירוע - ללא חיוב. ביטול לאחר מכן - חייב בגובה 50% מסכום ההצעה.",
  'המחיר כולל מע"מ כדין.',
  "ההצעה תקפה ל-14 יום ממועד הוצאתה.",
];

const fmtILS = (n) => `₪ ${Math.round(n || 0).toLocaleString("he-IL")}`;

function ItemDetailsInput({ details, onAdd, onRemove }) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const val = draft.trim();
    if (!val) return;
    onAdd(val);
    setDraft("");
  };

  return (
    <div className="mt-2">
      <div className="flex items-center gap-2 mb-1.5">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="פרט על השירות (לדוגמה: איש תפעול צמוד)"
          className="flex-1 rounded-lg px-2.5 py-1.5 text-xs outline-none"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={submit}
          className="p-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft }}
        >
          <Plus size={13} />
        </button>
      </div>
      {details.length > 0 && (
        <ul className="space-y-1">
          {details.map((d, idx) => (
            <li
              key={idx}
              className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg"
              style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}` }}
            >
              <span>{d}</span>
              <button type="button" onClick={() => onRemove(idx)} style={{ color: COLORS.textMuted }}>
                <X size={12} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AddQuoteModal({ onClose, onSave, catalog, onSaveCatalogItem, onDeleteCatalogItem }) {
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [eventType, setEventType] = useState("");
  const [date, setDate] = useState(todayStr());
  const [location, setLocation] = useState("");
  const [guestCount, setGuestCount] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const addItem = () => {
    setItems((prev) => [...prev, { id: genId(), description: "", price: "", details: [] }]);
  };
  const addFromCatalog = (catItem) => {
    setItems((prev) => [...prev, { id: genId(), description: catItem.name, price: "", details: [...catItem.details] }]);
  };
  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };
  const addDetail = (id, text) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, details: [...it.details, text] } : it)));
  };
  const removeDetail = (id, idx) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, details: it.details.filter((_, i) => i !== idx) } : it)));
  };

  const handleSave = () => {
    if (!clientName.trim()) return setError("צריך למלא שם לקוח");
    const cleanItems = items
      .filter((it) => it.description.trim() && parseFloat(it.price) > 0)
      .map((it) => ({ id: it.id, description: it.description.trim(), price: parseFloat(it.price), details: it.details }));
    if (cleanItems.length === 0) return setError("צריך להוסיף לפחות שירות/אטרקציה אחד עם מחיר");

    // שמירה אוטומטית של אטרקציות חדשות (עם פירוט) לקטלוג, כדי שלא יצטרך להקליד שוב בפעם הבאה
    cleanItems.forEach((it) => {
      if (it.details.length > 0 && !catalog.some((c) => c.name === it.description)) {
        onSaveCatalogItem({ id: genId(), name: it.description, details: it.details });
      }
    });

    onSave({
      id: genId(),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      eventType: eventType.trim(),
      date,
      location: location.trim(),
      guestCount: guestCount ? parseInt(guestCount, 10) : null,
      startTime,
      endTime,
      items: cleanItems,
      notes: notes.trim(),
      status: "draft",
      createdAt: todayStr(),
    });
  };

  return (
    <BottomSheet title="הצעת מחיר חדשה" onClose={onClose}>
      <div className="mb-3">
        <FieldLabel>שם הלקוח</FieldLabel>
        <input
          type="text"
          autoFocus
          value={clientName}
          onChange={(e) => setClientName(e.target.value)}
          placeholder="למי מיועדת ההצעה?"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
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
        <FieldLabel>סוג האירוע</FieldLabel>
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
        <FieldLabel>תאריך האירוע</FieldLabel>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-xl px-3 py-2.5 outline-none text-sm"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>מיקום</FieldLabel>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="איפה יתקיים האירוע?"
          className="w-full rounded-xl px-3 py-2.5 outline-none"
          style={inputStyle}
        />
      </div>

      <div className="mb-3">
        <FieldLabel>מספר אורחים משוער</FieldLabel>
        <input
          type="number"
          inputMode="numeric"
          value={guestCount}
          onChange={(e) => setGuestCount(e.target.value)}
          placeholder="לא חובה"
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

      {catalog.length > 0 && (
        <div className="mb-3">
          <FieldLabel>מהקטלוג שלי (לחיצה מוסיפה לשורות, ה-X מוחק מהקטלוג)</FieldLabel>
          <div className="flex flex-wrap gap-2">
            {catalog.map((c) => (
              <span
                key={c.id}
                className="text-xs pl-1 pr-2.5 py-1.5 rounded-full flex items-center gap-1.5"
                style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, border: `1px solid ${COLORS.gold}` }}
              >
                <button type="button" onClick={() => addFromCatalog(c)}>{c.name}</button>
                <button type="button" onClick={() => onDeleteCatalogItem(c.id)} className="p-0.5">
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>אילו שירותים / אטרקציות רוצה הלקוח, ובאיזה מחיר?</FieldLabel>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 shrink-0"
            style={{ color: COLORS.goldSoft, backgroundColor: COLORS.goldTint }}
          >
            <Plus size={13} /> הוסף מוצר
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדיין מוצרים בהצעה</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="p-2.5 rounded-xl" style={{ backgroundColor: COLORS.surfaceSoft, border: `1px solid ${COLORS.border}` }}>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={it.description}
                    onChange={(e) => updateItem(it.id, { description: e.target.value })}
                    placeholder="לדוגמה: עמדת צילום רטרו"
                    className="flex-1 rounded-lg px-2.5 py-1.5 outline-none text-sm"
                    style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
                  />
                  <input
                    type="number"
                    inputMode="decimal"
                    value={it.price}
                    onChange={(e) => updateItem(it.id, { price: e.target.value })}
                    placeholder="מחיר"
                    className="w-20 rounded-lg px-2.5 py-1.5 outline-none text-sm font-semibold tabular-nums"
                    style={{ backgroundColor: COLORS.surface, border: `1px solid ${COLORS.border}`, color: COLORS.textPrimary }}
                  />
                  <button type="button" onClick={() => removeItem(it.id)} className="p-1 shrink-0" style={{ color: COLORS.textMuted }}>
                    <X size={15} />
                  </button>
                </div>
                <ItemDetailsInput
                  details={it.details}
                  onAdd={(text) => addDetail(it.id, text)}
                  onRemove={(idx) => removeDetail(it.id, idx)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-4">
        <FieldLabel>הערות / דרישות מיוחדות</FieldLabel>
        <input
          type="text"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="יתווסף לתנאים הכלליים בהצעה"
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
        צור הצעת מחיר
      </button>
    </BottomSheet>
  );
}

function QuotePreview({ quote, onClose, onAccept, onDelete }) {
  const printRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const total = quote.items.reduce((s, it) => s + it.price, 0);
  const accepted = quote.status === "accepted";
  const dark = "#211E1A";

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(printRef.current, { scale: 2, backgroundColor: "#ffffff" });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`הצעת-מחיר-${quote.clientName}.pdf`);
    } catch (e) {
      alert("יצירת ה-PDF נכשלה, נסה שוב");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <BottomSheet title="הצעת מחיר" onClose={onClose}>
      <div ref={printRef} dir="rtl" className="rounded-2xl p-5 mb-4" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
        <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 mb-5 text-sm">
          <div>
            <p><b>לכבוד:</b> {quote.clientName}</p>
            {quote.clientPhone && <p><b>טלפון:</b> {quote.clientPhone}</p>}
            {quote.eventType && <p><b>סוג אירוע:</b> {quote.eventType}</p>}
          </div>
          <div>
            {quote.location && <p><b>מיקום:</b> {quote.location}</p>}
            <p><b>תאריך אירוע:</b> {fmtDate(quote.date)}</p>
            <p><b>תאריך הצעה:</b> {fmtDate(quote.createdAt || quote.date)}</p>
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

        <p className="text-sm mb-0.5">בברכה,</p>
        <p className="text-sm font-bold mb-3">{BUSINESS.name} | {BUSINESS.ownerName}</p>

        <div style={{ borderTop: `1px solid ${COLORS.gold}` }} className="pt-2">
          <p className="text-center text-xs" style={{ color: COLORS.textMuted }}>
            {BUSINESS.email} | {BUSINESS.phone} | ח.פ {BUSINESS.companyId} | {BUSINESS.name}
          </p>
        </div>
      </div>

      <div className="flex gap-2 mb-2">
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex-1 py-3 rounded-xl font-semibold flex items-center justify-center gap-1.5"
          style={{ backgroundColor: COLORS.surfaceSoft, color: COLORS.textPrimary, border: `1px solid ${COLORS.border}` }}
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          הורדה כ-PDF לשליחה בוואטסאפ
        </button>
      </div>

      <div className="flex gap-2">
        {!accepted && (
          <button
            onClick={() => {
              onAccept(quote);
              onClose();
            }}
            className="flex-1 py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-1.5"
            style={{ backgroundColor: COLORS.income, boxShadow: shadowMd }}
          >
            <Check size={16} /> הלקוח אישר - צור אירוע
          </button>
        )}
        <ConfirmDelete
          onConfirm={() => {
            onDelete(quote.id);
            onClose();
          }}
        />
      </div>
    </BottomSheet>
  );
}

function QuoteRow({ quote, onClick }) {
  const total = quote.items.reduce((s, it) => s + it.price, 0);
  const accepted = quote.status === "accepted";
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-right"
      style={{ backgroundColor: COLORS.surface, boxShadow: shadowSm }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: accepted ? COLORS.incomeTint : COLORS.goldTint }}
      >
        {accepted ? <Check size={16} style={{ color: COLORS.income }} /> : <FileText size={16} style={{ color: COLORS.gold }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{quote.clientName}</p>
        <p className="text-xs truncate" style={{ color: COLORS.textMuted }}>
          {fmtDate(quote.date)}{quote.eventType ? ` · ${quote.eventType}` : ""}{accepted ? " · אושרה" : ""}
        </p>
      </div>
      <p className="font-semibold tabular-nums shrink-0 text-sm" style={{ color: COLORS.goldSoft }}>
        {fmtILS(total)}
      </p>
    </button>
  );
}

export default function Quotes({ quotes, onAddQuote, onDeleteQuote, onAcceptQuote, catalog, onSaveCatalogItem, onDeleteCatalogItem }) {
  const [showAdd, setShowAdd] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);

  const sortedQuotes = [...quotes].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowAdd(true)}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl font-semibold text-sm"
        style={{ backgroundColor: COLORS.goldTint, color: COLORS.goldSoft, boxShadow: shadowSm }}
      >
        <Plus size={16} /> הצעת מחיר חדשה
      </button>

      <div>
        <p className="text-sm font-semibold mb-2">כל ההצעות</p>
        {sortedQuotes.length === 0 ? (
          <div className="text-center py-8 rounded-2xl" style={{ backgroundColor: COLORS.surface, color: COLORS.textMuted, boxShadow: shadowSm }}>
            <p className="text-sm">אין עדיין הצעות מחיר. תלחץ למעלה כדי ליצור אחת 👆</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sortedQuotes.map((q) => (
              <QuoteRow key={q.id} quote={q} onClick={() => setSelectedQuote(q)} />
            ))}
          </div>
        )}
      </div>

      {showAdd && (
        <AddQuoteModal
          onClose={() => setShowAdd(false)}
          onSave={(quote) => {
            onAddQuote(quote);
            setShowAdd(false);
          }}
          catalog={catalog}
          onSaveCatalogItem={onSaveCatalogItem}
          onDeleteCatalogItem={onDeleteCatalogItem}
        />
      )}

      {selectedQuote && (
        <QuotePreview
          quote={selectedQuote}
          onClose={() => setSelectedQuote(null)}
          onAccept={onAcceptQuote}
          onDelete={onDeleteQuote}
        />
      )}
    </div>
  );
}
