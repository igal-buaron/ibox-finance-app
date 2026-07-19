"use client";
import React, { useState, useRef } from "react";
import { Plus, X, FileText, Check, Download, Loader2 } from "lucide-react";
import {
  COLORS, shadowSm, shadowMd,
  genId, todayStr, fmtCurrency, fmtDate,
  BottomSheet, FieldLabel, inputStyle, ConfirmDelete,
} from "./shared";

function AddQuoteModal({ onClose, onSave }) {
  const [clientName, setClientName] = useState("");
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
    setItems((prev) => [...prev, { id: genId(), description: "", price: "" }]);
  };
  const updateItem = (id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };
  const removeItem = (id) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const handleSave = () => {
    if (!clientName.trim()) return setError("צריך למלא שם לקוח");
    const cleanItems = items
      .filter((it) => it.description.trim() && parseFloat(it.price) > 0)
      .map((it) => ({ id: it.id, description: it.description.trim(), price: parseFloat(it.price) }));
    if (cleanItems.length === 0) return setError("צריך להוסיף לפחות שירות/אטרקציה אחד עם מחיר");
    onSave({
      id: genId(),
      clientName: clientName.trim(),
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

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <FieldLabel>אילו שירותים / אטרקציות רוצה הלקוח, ובאיזה מחיר?</FieldLabel>
          <button
            type="button"
            onClick={addItem}
            className="text-xs font-medium px-2 py-1 rounded-lg flex items-center gap-1 shrink-0"
            style={{ color: COLORS.goldSoft, backgroundColor: COLORS.goldTint }}
          >
            <Plus size={13} /> הוסף שורה
          </button>
        </div>
        {items.length === 0 ? (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>אין עדיין שורות בהצעה</p>
        ) : (
          <div className="space-y-2">
            {items.map((it) => (
              <div key={it.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={it.description}
                  onChange={(e) => updateItem(it.id, { description: e.target.value })}
                  placeholder="לדוגמה: מתחם קפיצות"
                  className="flex-1 rounded-xl px-3 py-2 outline-none text-sm"
                  style={inputStyle}
                />
                <input
                  type="number"
                  inputMode="decimal"
                  value={it.price}
                  onChange={(e) => updateItem(it.id, { price: e.target.value })}
                  placeholder="מחיר"
                  className="w-24 rounded-xl px-3 py-2 outline-none text-sm font-semibold tabular-nums"
                  style={inputStyle}
                />
                <button onClick={() => removeItem(it.id)} className="p-1.5 shrink-0" style={{ color: COLORS.textMuted }}>
                  <X size={15} />
                </button>
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
          placeholder="לדוגמה: תנאי תשלום, הערות ללקוח"
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
      // מציג הודעה פשוטה, לא קריטי אם ה-PDF נכשל, אפשר לנסות שוב
      alert("יצירת ה-PDF נכשלה, נסה שוב");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <BottomSheet title="הצעת מחיר" onClose={onClose}>
      <div ref={printRef} dir="rtl" className="rounded-2xl p-5 mb-4" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1.5">
            <FileText size={18} style={{ color: COLORS.gold }} />
            <span className="font-bold text-lg" style={{ color: COLORS.textPrimary }}>I-BOX</span>
          </div>
          <span className="text-xs" style={{ color: COLORS.textMuted }}>{fmtDate(quote.createdAt || quote.date)}</span>
        </div>

        <h3 className="text-base font-bold mb-3" style={{ color: COLORS.textPrimary }}>הצעת מחיר עבור {quote.clientName}</h3>

        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          {quote.eventType && <p><span style={{ color: COLORS.textMuted }}>סוג אירוע: </span>{quote.eventType}</p>}
          <p><span style={{ color: COLORS.textMuted }}>תאריך: </span>{fmtDate(quote.date)}</p>
          {quote.location && <p><span style={{ color: COLORS.textMuted }}>מיקום: </span>{quote.location}</p>}
          {quote.guestCount && <p><span style={{ color: COLORS.textMuted }}>אורחים: </span>{quote.guestCount}</p>}
          {(quote.startTime || quote.endTime) && (
            <p><span style={{ color: COLORS.textMuted }}>שעות: </span>{quote.startTime || "?"} - {quote.endTime || "?"}</p>
          )}
        </div>

        <div className="mb-4">
          <div className="space-y-1.5">
            {quote.items.map((it) => (
              <div key={it.id} className="flex items-center justify-between text-sm rounded-lg px-3 py-2" style={{ backgroundColor: COLORS.surfaceSoft }}>
                <span>{it.description}</span>
                <span className="font-medium tabular-nums">{fmtCurrency(it.price)}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-2 pt-2 px-3" style={{ borderTop: `1px solid ${COLORS.border}` }}>
            <span className="font-semibold text-sm">סה"כ</span>
            <span className="font-bold tabular-nums" style={{ color: COLORS.goldSoft }}>{fmtCurrency(total)}</span>
          </div>
        </div>

        {quote.notes && (
          <p className="text-xs" style={{ color: COLORS.textMuted }}>{quote.notes}</p>
        )}
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
        {fmtCurrency(total)}
      </p>
    </button>
  );
}

export default function Quotes({ quotes, onAddQuote, onDeleteQuote, onAcceptQuote }) {
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
