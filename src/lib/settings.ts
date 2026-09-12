import "server-only";
import { cache } from "react";
import { db } from "./db";

/**
 * إعدادات المنصّة القابلة للتعديل من لوحة الإدارة دون تغيير الكود.
 * القيم الافتراضية هنا، وأي قيمة محفوظة في جدول Setting تتغلّب عليها.
 */

/** صورة قابلة للاستبدال من لوحة الإدارة */
export type SiteImage = { src: string; alt: string };

export type SettingsMap = {
  "learning.sequential": boolean;
  "learning.sequentialAcrossTracks": boolean;
  "learning.requireQuizToAdvance": boolean;
  "learning.allowRewatch": boolean;
  "quiz.defaultPassScore": number;
  "quiz.defaultMaxAttempts": number;
  "quiz.showCorrectAnswers": boolean;
  "certificate.enabled": boolean;
  "certificate.minCompletion": number;
  "payment.autoActivate": boolean;
  "payment.manualEnabled": boolean;
  "site.registrationOpen": boolean;
  "site.whatsapp": string;
  "site.telegram": string;
  "site.supportEmail": string;
  /** صورة بطاقة الأستاذ في أعلى الصفحة الرئيسية */
  "site.heroImage": string;
  /** شبكة الملصقات في قسم «عن البرنامج» */
  "site.gallery": SiteImage[];
  /** فيديو التعريف بعد الـ Hero — يُخفى القسم ما دام الرابط فارغًا */
  "site.introVideo": IntroVideo;
};

export type IntroVideo = {
  /** رابط يوتيوب/فيميو أو مسار ملف مرفوع */
  url: string;
  title: string;
  description: string;
  /** صورة الغلاف قبل التشغيل — فارغة = صورة الأستاذ */
  poster: string;
};

export type SettingKey = keyof SettingsMap;

export const DEFAULT_SETTINGS: SettingsMap = {
  // ── التعلّم ──
  "learning.sequential": true, // إجبار التدرّج بين الدروس
  "learning.sequentialAcrossTracks": true, // إنهاء التاريخ قبل فتح الجغرافيا
  "learning.requireQuizToAdvance": true, // اجتياز اختبار الوحدة قبل الوحدة التالية
  "learning.allowRewatch": true, // إعادة فتح الدروس المكتملة

  // ── الاختبارات ──
  "quiz.defaultPassScore": 70,
  "quiz.defaultMaxAttempts": 0, // 0 = غير محدود
  "quiz.showCorrectAnswers": true,

  // ── الشهادات ──
  "certificate.enabled": true,
  "certificate.minCompletion": 100, // نسبة الإكمال المطلوبة

  // ── الدفع ──
  "payment.autoActivate": true, // تفعيل تلقائي عند تأكيد الدفع
  "payment.manualEnabled": true,

  // ── الموقع ──
  "site.registrationOpen": true,
  "site.whatsapp": "+212632092292",
  "site.telegram": "",
  "site.supportEmail": "contact@bacarabe.sn",

  // ── صور الواجهة (تُستبدل من لوحة الإدارة ← الواجهة) ──
  "site.heroImage": "/brand/instructor.png",
  "site.gallery": [
    { src: "/brand/poster-program.jpg", alt: "ملصق البرنامج" },
    { src: "/brand/poster-history-1.jpg", alt: "الفصل الأول — التاريخ" },
    { src: "/brand/poster-geo-2.jpg", alt: "الفصل الثاني — الجغرافيا" },
    { src: "/brand/poster-unit-1.jpg", alt: "الوحدة الأولى" },
  ],
  "site.introVideo": {
    url: "",
    title: "تعرّف على البرنامج وعلى أستاذك",
    description:
      "في دقائق قليلة: من أنا، كيف صُمّم البرنامج، وماذا ستتقن قبل يوم الامتحان.",
    poster: "",
  },
};

/** الصور الجاهزة في مجلّد public/brand — تُعرض كمكتبة للاختيار السريع */
export const BUNDLED_IMAGES: SiteImage[] = [
  { src: "/brand/poster-program.jpg", alt: "ملصق البرنامج" },
  { src: "/brand/poster-history-1.jpg", alt: "الفصل الأول — التاريخ" },
  { src: "/brand/poster-history-2.jpg", alt: "الفصل الثاني — التاريخ" },
  { src: "/brand/poster-history-3.jpg", alt: "الفصل الثالث — التاريخ" },
  { src: "/brand/poster-geo-1.jpg", alt: "الفصل الأول — الجغرافيا" },
  { src: "/brand/poster-geo-2.jpg", alt: "الفصل الثاني — الجغرافيا" },
  { src: "/brand/poster-geo-3.jpg", alt: "الفصل الثالث — الجغرافيا" },
  { src: "/brand/poster-unit-1.jpg", alt: "الوحدة الأولى" },
  { src: "/brand/poster-unit-2.jpg", alt: "الوحدة الثانية" },
  { src: "/brand/instructor.png", alt: "صورة الأستاذ" },
  { src: "/brand/logo-square.png", alt: "شعار المجموعة" },
];

export const getSettings = cache(async (): Promise<SettingsMap> => {
  const rows = await db.setting.findMany().catch(() => []);
  const merged: Record<string, unknown> = { ...DEFAULT_SETTINGS };
  for (const row of rows) {
    try {
      merged[row.key] = JSON.parse(row.value);
    } catch {
      merged[row.key] = row.value;
    }
  }
  return merged as SettingsMap;
});

export async function setSetting(key: string, value: unknown, group = "general") {
  return db.setting.upsert({
    where: { key },
    update: { value: JSON.stringify(value), group },
    create: { key, value: JSON.stringify(value), group },
  });
}
