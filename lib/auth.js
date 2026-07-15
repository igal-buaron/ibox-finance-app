// עוזר התחברות - יוצר ובודק "כרטיס כניסה" חתום, בלי לשמור סיסמאות בעוגייה עצמה.

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmac(secret, message) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return toHex(sig);
}

export async function createSessionToken(secret, ttlMs = 1000 * 60 * 60 * 24 * 30) {
  const exp = Date.now() + ttlMs;
  const sig = await hmac(secret, String(exp));
  return `${exp}.${sig}`;
}

export async function verifySessionToken(token, secret) {
  if (!token || !secret || !token.includes(".")) return false;
  const [expStr, sig] = token.split(".");
  const exp = Number(expStr);
  if (!exp || Number.isNaN(exp) || Date.now() > exp) return false;
  const expected = await hmac(secret, expStr);
  return expected === sig;
}
