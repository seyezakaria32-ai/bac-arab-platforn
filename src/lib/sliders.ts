import "server-only";
import { db } from "@/lib/db";
import { getSettings, setSetting } from "@/lib/settings";

/**
 * عارضات الصور: المواضع المتاحة في الموقع، أشكال الإطار، والتحميل.
 *
 * المواضع قائمة ثابتة لا حقل حرّ: كل موضع مكان مُعَدّ في الصفحة بتنسيقه
 * وهوامشه، فيبقى الموقع متناسقًا مهما أُضيف من عارضات.
 */

export const SLIDER_PLACEMENTS = [
  { key: "home.top", label: "الصفحة الرئيسية — أعلى الصفحة، بعد شريط المزايا" },
  { key: "home.about", label: "الصفحة الرئيسية — داخل «عن البرنامج» بجانب النص" },
  { key: "home.afterAbout", label: "الصفحة الرئيسية — بعد «عن البرنامج»" },
  { key: "home.afterLearn", label: "الصفحة الرئيسية — بعد «ماذا ستتعلّم؟»" },
  { key: "home.afterCurriculum", label: "الصفحة الرئيسية — بعد «محتوى البرنامج»" },
  { key: "home.afterSteps", label: "الصفحة الرئيسية — بعد «كيف يعمل البرنامج؟»" },
  { key: "home.afterPlans", label: "الصفحة الرئيسية — بعد الباقات" },
  { key: "home.afterFaq", label: "الصفحة الرئيسية — بعد الأسئلة الشائعة" },
  { key: "dashboard.top", label: "لوحة الطالب — في الأعلى (للإعلانات)" },
] as const;

export type SliderPlacement = (typeof SLIDER_PLACEMENTS)[number]["key"];

export const placementLabel = (key: string) =>
  SLIDER_PLACEMENTS.find((p) => p.key === key)?.label ?? "موضع غير معروف";

export const isPlacement = (key: string): key is SliderPlacement =>
  SLIDER_PLACEMENTS.some((p) => p.key === key);

export const SLIDER_ASPECTS = [
  { key: "poster", label: "ملصق طولي (≈ 9:10)", css: "760 / 853" },
  { key: "square", label: "مربّع (1:1)", css: "1 / 1" },
  { key: "landscape", label: "عرضي (16:9)", css: "16 / 9" },
  { key: "banner", label: "شريط إعلاني عريض (21:9)", css: "21 / 9" },
] as const;

export type SliderAspect = (typeof SLIDER_ASPECTS)[number]["key"];

export const aspectCss = (key: string) =>
  SLIDER_ASPECTS.find((a) => a.key === key)?.css ?? SLIDER_ASPECTS[0].css;

/** العدد مع المعدود بقواعد العربية: صورة واحدة، صورتان، 3 صور، 11 صورة */
export function imagesCount(n: number) {
  if (n === 1) return "صورة واحدة";
  if (n === 2) return "صورتان";
  if (n >= 3 && n <= 10) return `${n} صور`;
  return `${n} صورة`;
}

/** ألوان زرّ الدعوة تحت العارض — التصميم في globals.css (.cta) */
export const CTA_TONES = [
  { key: "brand", label: "فيروزي (لون الهوية)" },
  { key: "gold", label: "ذهبي (للعروض والباقة المميّزة)" },
  { key: "dark", label: "داكن بإطار متلألئ" },
] as const;

export type CtaTone = (typeof CTA_TONES)[number]["key"];

export const isCtaTone = (key: string): key is CtaTone => CTA_TONES.some((t) => t.key === key);

export type SliderCta = { label: string; href: string; tone: CtaTone; note: string | null };

/** الزرّ لا يظهر إلا مكتملًا: نصّ ورابط */
export function toCta(s: {
  ctaLabel: string | null;
  ctaUrl: string | null;
  ctaTone: string;
  ctaNote: string | null;
}): SliderCta | null {
  if (!s.ctaLabel || !s.ctaUrl) return null;
  return {
    label: s.ctaLabel,
    href: s.ctaUrl,
    tone: isCtaTone(s.ctaTone) ? s.ctaTone : "brand",
    note: s.ctaNote,
  };
}

export const PER_VIEW_OPTIONS = [1, 2, 3, 4] as const;
export const INTERVAL_OPTIONS_S = [1, 1.5, 2, 3, 4, 5, 7] as const;

/** ما يحتاجه العرض للزائر — بلا حقول الإدارة */
export type SliderView = {
  id: string;
  title: string | null;
  perView: number;
  intervalMs: number;
  aspect: string;
  autoplay: boolean;
  slides: { id: string; src: string; alt: string; href: string | null }[];
  cta: SliderCta | null;
};

/**
 * أوّل تشغيل بعد إضافة العارضات: ملصقات «عن البرنامج» كانت مخزّنة في
 * الإعدادات (site.gallery). ننقلها إلى عارض حقيقي مرّة واحدة، حتى لا يختفي
 * العارض الحالي من الموقع. العلَم يمنع إعادة إنشائه إن حذفه المدير لاحقًا.
 */
export async function ensureDefaultSlider() {
  const settings = await getSettings();
  const flags = settings as unknown as Record<string, unknown>;
  if (flags["sliders.initialized"] === true) return;

  if ((await db.slider.count()) === 0) {
    const gallery = settings["site.gallery"];
    await db.slider.create({
      data: {
        name: "ملصقات «عن البرنامج»",
        placement: "home.about",
        perView: 2,
        intervalMs: 2000,
        aspect: "poster",
        slides: {
          create: gallery.map((img, i) => ({ imageUrl: img.src, alt: img.alt, order: i })),
        },
      },
    });
  }
  await setSetting("sliders.initialized", true, "site");
}

/** العارضات المفعّلة ذات الصور، مجمّعة حسب الموضع، لصفحة واحدة */
export async function getSlidersByPlacement(
  prefix: "home" | "dashboard",
): Promise<Partial<Record<SliderPlacement, SliderView[]>>> {
  const rows = await db.slider
    .findMany({
      where: { isActive: true, placement: { startsWith: `${prefix}.` } },
      orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      include: { slides: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
    })
    // قاعدة قديمة لم تُنشأ فيها الجداول بعد: الموقع يعمل بلا عارضات بدل أن يسقط
    .catch(() => []);

  const byPlacement: Partial<Record<SliderPlacement, SliderView[]>> = {};
  for (const s of rows) {
    if (!isPlacement(s.placement) || s.slides.length === 0) continue;
    (byPlacement[s.placement] ??= []).push({
      id: s.id,
      title: s.title,
      perView: s.perView,
      intervalMs: s.intervalMs,
      aspect: s.aspect,
      autoplay: s.autoplay,
      cta: toCta(s),
      slides: s.slides.map((sl) => ({
        id: sl.id,
        src: sl.imageUrl,
        alt: sl.alt,
        href: sl.linkUrl,
      })),
    });
  }
  return byPlacement;
}
