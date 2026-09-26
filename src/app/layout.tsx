import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Arabic, Almarai, Readex_Pro } from "next/font/google";
import "./globals.css";
import { siteUrl } from "@/lib/site-url";

/*
 * ثلاثة خطوط متجانسة — كلها بلا زخارف ومتقاربة السُّمك — لكلٍّ دور
 * (توزيع الأدوار في globals.css):
 *
 * ١. IBM Plex Sans Arabic — العناوين الكبيرة + النص العادي.
 *    أثقل وزن فيه 700، فأصناف 800/900 تُعرض بـ 700.
 *    latin ضروري للأرقام اللاتينية (7,500 فرنك).
 */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

/* ٢. Almarai — العناوين الصغيرة: مضغوط، فلا تلتفّ العناوين الطويلة.
 *    لا يحتوي حروفًا لاتينية، فأرقامه تأتي من IBM Plex (التالي في السلسلة). */
const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

/* ٣. Readex Pro — الأزرار والشارات والقوائم: هندسي واسع، واضح بالأحجام الصغيرة */
const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-readex",
  display: "swap",
});

export const metadata: Metadata = {
  // أساس الروابط المطلقة (صورة المشاركة، og:url). بدونه تبقى الروابط على
  // localhost في الإنتاج فلا تظهر بطاقة المشاركة في واتساب وفيسبوك.
  metadataBase: new URL(siteUrl()),
  title: {
    default: "الدليل الشامل لمنهجية الإجابة في التاريخ والجغرافيا | Bac Arabe Sénégal",
    template: "%s | Bac Arabe Sénégal",
  },
  description:
    "برنامج تدريبي مسجّل بالفيديو لطلبة البكالوريا — ابدأ متى شئت وتعلّم بإيقاعك — لإتقان منهجية الإجابة في التاريخ والجغرافيا: الإنشاء التاريخي، التعليق على الوثائق، المقالة الجغرافية، وإنجاز المبيانات.",
  keywords: [
    "البكالوريا",
    "التاريخ والجغرافيا",
    "منهجية الإنشاء التاريخي",
    "المبيانات",
    "Bac Arabe Sénégal",
  ],
  openGraph: {
    type: "website",
    locale: "ar",
    siteName: "Bac Arabe Sénégal",
  },
};

export const viewport: Viewport = {
  themeColor: "#005461",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`${plexArabic.variable} ${almarai.variable} ${readex.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
