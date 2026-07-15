import { Rubik } from "next/font/google";

const rubik = Rubik({ subsets: ["hebrew", "latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata = {
  title: "I-BOX · ניהול כספי",
  description: "מעקב הכנסות, הוצאות וחובות",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className={rubik.className} style={{ backgroundColor: "#FAF7EF", margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
