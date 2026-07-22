import { redis } from "../../../lib/redis";
import QuoteDocument from "../../../components/QuoteDocument";
import SignaturePad from "../../../components/SignaturePad";

export default async function PublicQuotePage({ params }) {
  const raw = await redis.hget("ibox:quote", params.id);
  const quote = raw ? (typeof raw === "string" ? JSON.parse(raw) : raw) : null;

  if (!quote) {
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
        <p style={{ color: "#8B8574" }}>ההצעה לא נמצאה, או שהקישור שגוי.</p>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ minHeight: "100vh", backgroundColor: "#FAF7EF", padding: "24px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }} className="space-y-4">
        <QuoteDocument quote={quote} />
        {quote.status !== "accepted" && <SignaturePad quoteId={quote.id} />}
      </div>
    </div>
  );
}
