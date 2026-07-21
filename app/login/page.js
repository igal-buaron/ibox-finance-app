"use client";
import { useState, useEffect } from "react";

export default function LoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submitLogin = async (pwd) => {
    if (!pwd || loading) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "קוד שגוי, נסה שוב");
      }
    } catch {
      setError("שגיאה בהתחברות, נסה שוב");
    } finally {
      setLoading(false);
    }
  };

  // נכנס אוטומטית קצת אחרי שמפסיקים להקליד, בלי צורך ללחוץ על הכפתור
  useEffect(() => {
    if (!password) return;
    const timer = setTimeout(() => submitLogin(password), 700);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [password]);

  const handleSubmit = (e) => {
    e.preventDefault();
    submitLogin(password);
  };

  return (
    <div
      dir="rtl"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#FAF7EF",
        padding: 20,
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs p-6 rounded-2xl bg-white"
        style={{ boxShadow: "0 4px 20px rgba(44,42,36,0.08)" }}
      >
        <h1 className="text-xl font-bold mb-1 text-center">I-BOX · ניהול כספי</h1>
        <p className="text-sm text-center mb-5" style={{ color: "#8B8574" }}>
          הזן קוד גישה
        </p>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full rounded-xl px-4 py-3 text-center text-lg mb-3 outline-none border"
          style={{ borderColor: "#ECE6D6" }}
          placeholder="••••"
        />
        {error && (
          <p className="text-sm text-center mb-3" style={{ color: "#C24A3F" }}>
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl font-semibold text-white"
          style={{ backgroundColor: "#B8892E" }}
        >
          {loading ? "בודק..." : "כניסה"}
        </button>
      </form>
    </div>
  );
}
