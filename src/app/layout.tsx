import type { Metadata, Viewport } from "next";
import "./globals.css";
import { fontVariableClasses } from "./fonts";
import { siteUrl } from "@/lib/site-url";
import { getSettings } from "@/lib/settings";
import { DEFAULT_FONTS, FONT_ROLES, fontStack, normalizeFonts } from "@/lib/fonts";

/*
 * الخطوط: كلّها معرّفة في app/fonts.ts ومتاحة عبر متغيّراتها. الخطّ المستعمل
 * لكل دور (النصّ، العناوين الكبيرة، العناوين الصغيرة، الأزرار) يختاره المدير
 * من «تصميم الموقع»؛ القيم الافتراضية في globals.css، والمختار يتغلّب عليها
 * من style على <html>.
 */

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    // أساس الروابط المطلقة (صورة المشاركة، og:url). بدونه تبقى الروابط على
    // localhost في الإنتاج فلا تظهر بطاقة المشاركة في واتساب وفيسبوك.
    metadataBase: new URL(siteUrl()),
    title: {
      default: settings["site.seoTitle"],
      template: "%s | Bac Arabe Sénégal",
    },
    description: settings["site.seoDescription"],
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
      title: settings["site.seoTitle"],
      description: settings["site.seoDescription"],
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#005461",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSettings();
  const fonts = normalizeFonts(settings["theme.fonts"]);

  // الأدوار التي غيّرها المدير فقط؛ الباقي من globals.css كما كان
  const fontStyle: Record<string, string> = {};
  for (const role of FONT_ROLES) {
    if (fonts[role.key] !== DEFAULT_FONTS[role.key]) fontStyle[role.cssVar] = fontStack(fonts[role.key]);
  }

  return (
    <html
      lang="ar"
      dir="rtl"
      className={fontVariableClasses}
      style={fontStyle as React.CSSProperties}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
