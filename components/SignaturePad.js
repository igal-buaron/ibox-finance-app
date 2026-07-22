"use client";
import { useRef, useState, useEffect } from "react";
import { COLORS } from "../lib/theme";

export default function SignaturePad({ quoteId }) {
  const canvasRef = useRef(null);
  const drawing = useRef(false);
  const hasDrawn = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const ctx = canvasRef.current.getContext("2d");
    ctx.strokeStyle = COLORS.textPrimary;
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const point = e.touches ? e.touches[0] : e;
    return {
      x: (point.clientX - rect.left) * scaleX,
      y: (point.clientY - rect.top) * scaleY,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawing.current = true;
    hasDrawn.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawing.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const end = () => {
    drawing.current = false;
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    hasDrawn.current = false;
    setError("");
  };

  const submit = async () => {
    if (!hasDrawn.current) {
      setError("צריך לחתום לפני האישור");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const signature = canvasRef.current.toDataURL("image/png");
      const res = await fetch(`/api/public-quote/${quoteId}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature }),
      });
      if (!res.ok) throw new Error("failed");
      setDone(true);
    } catch {
      setError("האישור נכשל, נסה שוב");
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="rounded-2xl p-5 text-center" style={{ backgroundColor: COLORS.incomeTint }}>
        <p className="font-semibold text-sm" style={{ color: COLORS.income }}>תודה! ההצעה אושרה בהצלחה.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5" style={{ backgroundColor: "#fff", border: `1px solid ${COLORS.border}` }}>
      <p className="font-semibold text-sm mb-1.5 text-center">אישור וחתימה דיגיטלית</p>
      <p className="text-xs text-center mb-3" style={{ color: COLORS.textMuted }}>
        החתימה כאן מהווה אישור להצעת המחיר ולתנאים הכלליים
      </p>
      <canvas
        ref={canvasRef}
        width={500}
        height={200}
        className="w-full rounded-xl"
        style={{ backgroundColor: COLORS.surfaceSoft, border: `1px solid ${COLORS.border}`, touchAction: "none" }}
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={end}
        onMouseLeave={end}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={end}
      />
      {error && (
        <p className="text-xs text-center mt-2" style={{ color: COLORS.expense }}>{error}</p>
      )}
      <div className="flex gap-2 mt-3">
        <button
          type="button"
          onClick={clear}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium"
          style={{ backgroundColor: COLORS.surfaceSoft, color: COLORS.textPrimary }}
        >
          נקה
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={submitting}
          className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ backgroundColor: COLORS.income }}
        >
          {submitting ? "שולח..." : "אשר וחתום"}
        </button>
      </div>
    </div>
  );
}
