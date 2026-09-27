/**
 * الخطوط التي يختار منها المدير، وأدوارها في الموقع.
 *
 * ملف مشترك (بلا تحميل خطوط): الخطوط نفسها تُعرَّف في src/app/fonts.ts عبر
 * next/font، فتُستضاف مع الموقع ولا يُحمَّل ملفّ خطّ إلا إن استُعمل فعلًا في
 * الصفحة. هنا أسماؤها ومتغيّرات CSS الخاصّة بها.
 */

export const FONT_OPTIONS = [
  { key: "plex", label: "IBM Plex Sans Arabic", note: "عصري ومريح للقراءة", cssVar: "--font-plex-arabic" },
  { key: "almarai", label: "Almarai (المراعي)", note: "مضغوط، للعناوين الطويلة", cssVar: "--font-almarai" },
  { key: "readex", label: "Readex Pro", note: "هندسي واضح، للأزرار", cssVar: "--font-readex" },
  { key: "cairo", label: "Cairo (القاهرة)", note: "شائع وواضح جدًّا", cssVar: "--font-cairo" },
  { key: "tajawal", label: "Tajawal (تجوّل)", note: "خفيف وأنيق", cssVar: "--font-tajawal" },
  { key: "notoKufi", label: "Noto Kufi Arabic", note: "كوفي هندسي متين", cssVar: "--font-noto-kufi" },
  { key: "notoNaskh", label: "Noto Naskh Arabic", note: "نسخ تقليدي، للنصوص الطويلة", cssVar: "--font-noto-naskh" },
  { key: "amiri", label: "Amiri (الأميري)", note: "نسخ كلاسيكي بطابع الكتب", cssVar: "--font-amiri" },
  { key: "markazi", label: "Markazi Text", note: "نسخ عصري هادئ", cssVar: "--font-markazi" },
  { key: "changa", label: "Changa", note: "عريض وقويّ، للعناوين", cssVar: "--font-changa" },
  { key: "elMessiri", label: "El Messiri (المسيري)", note: "زخرفي أنيق، للعناوين", cssVar: "--font-el-messiri" },
  { key: "reemKufi", label: "Reem Kufi (ريم كوفي)", note: "كوفي زخرفي، للعناوين", cssVar: "--font-reem-kufi" },
  { key: "alexandria", label: "Alexandria (الإسكندرية)", note: "حديث ونظيف", cssVar: "--font-alexandria" },
  { key: "zain", label: "Zain (زين)", note: "ناعم وحديث", cssVar: "--font-zain" },
  { key: "harmattan", label: "Harmattan (هرمتان)", note: "نسخ خفيف واضح", cssVar: "--font-harmattan" },
  { key: "baloo", label: "Baloo Bhaijaan 2", note: "مستدير وودود", cssVar: "--font-baloo" },
  { key: "marhey", label: "Marhey (مرحي)", note: "مرح بخطّ اليد، للعناوين", cssVar: "--font-marhey" },
  { key: "lalezar", label: "Lalezar (لاله‌زار)", note: "ثقيل جدًّا، للعناوين الكبيرة فقط", cssVar: "--font-lalezar" },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]["key"];

export const isFontKey = (k: unknown): k is FontKey => FONT_OPTIONS.some((f) => f.key === k);

/** الأدوار: كل دور متغيّر CSS تستعمله الأنماط (globals.css) */
export const FONT_ROLES = [
  { key: "body", cssVar: "--font-sans", label: "النصّ العادي", hint: "الفقرات والأوصاف وكل النصوص", sample: "برنامج مسجّل بالفيديو يأخذ بيدك خطوة بخطوة لإتقان منهجية الإجابة." },
  { key: "heading", cssVar: "--font-heading", label: "العناوين الكبيرة", hint: "عناوين الأقسام والأسعار البارزة", sample: "الدليل الشامل لمنهجية الإجابة" },
  { key: "display", cssVar: "--font-display", label: "العناوين الصغيرة", hint: "عناوين البطاقات والوحدات والأسئلة", sample: "منهجية كتابة الإنشاء التاريخي" },
  { key: "ui", cssVar: "--font-ui", label: "الأزرار والقوائم", hint: "الأزرار والشارات وروابط القائمة", sample: "ابدأ البرنامج الآن" },
] as const;

export type FontRole = (typeof FONT_ROLES)[number]["key"];
export type FontChoice = Record<FontRole, FontKey>;

/** الخطوط الحالية قبل أن تصير قابلة للاختيار */
export const DEFAULT_FONTS: FontChoice = { body: "plex", heading: "plex", display: "almarai", ui: "readex" };

export function normalizeFonts(v: unknown): FontChoice {
  const src = v && typeof v === "object" ? (v as Record<string, unknown>) : {};
  return {
    body: isFontKey(src.body) ? src.body : DEFAULT_FONTS.body,
    heading: isFontKey(src.heading) ? src.heading : DEFAULT_FONTS.heading,
    display: isFontKey(src.display) ? src.display : DEFAULT_FONTS.display,
    ui: isFontKey(src.ui) ? src.ui : DEFAULT_FONTS.ui,
  };
}

/**
 * سلسلة الخطّ لدور: الخطّ المختار، ثم IBM Plex احتياطًا — ما ينقص خطًّا من
 * حروف (الأرقام اللاتينية مثلًا) يُرسم بـ Plex بدل خطّ النظام.
 */
export function fontStack(key: FontKey): string {
  const v = FONT_OPTIONS.find((f) => f.key === key)?.cssVar ?? "--font-plex-arabic";
  const fallback = v === "--font-plex-arabic" ? "" : ", var(--font-plex-arabic)";
  return `var(${v})${fallback}, "Segoe UI", system-ui, sans-serif`;
}

/** متغيّرات CSS تُوضع على <html> فتتغلّب على القيم الافتراضية في globals.css */
export function fontVariables(choice: FontChoice): Record<string, string> {
  const out: Record<string, string> = {};
  for (const role of FONT_ROLES) out[role.cssVar] = fontStack(choice[role.key]);
  return out;
}
