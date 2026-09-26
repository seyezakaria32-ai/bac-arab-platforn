/**
 * مواضع المحتوى القابل للإدارة (العارضات والأزرار) في الموقع.
 *
 * قائمة ثابتة لا حقل حرّ: كل موضع مكان مُعَدّ في الصفحة بتنسيقه وهوامشه،
 * فيبقى الموقع متناسقًا مهما أُضيف إليه. الترتيب هنا هو ترتيب الظهور في
 * الموقع، وبه تُرتَّب القوائم في لوحة الإدارة.
 *
 * kinds: ما يصلح في الموضع — الواجهة الأولى ضيّقة وداكنة، يصلح فيها زرّ لا عارض.
 * dark: خلفية الموضع داكنة، فتُلوَّن النصوص حول الزرّ بما يُقرأ عليها.
 */

export type BlockKind = "slider" | "button";

type PlacementDef = {
  key: string;
  label: string;
  kinds: readonly BlockKind[];
  dark?: boolean;
};

const BOTH = ["slider", "button"] as const;

export const SITE_PLACEMENTS = [
  { key: "home.hero", label: "الصفحة الرئيسية — داخل الواجهة الأولى، تحت زرَّي البداية", kinds: ["button"], dark: true },
  { key: "home.top", label: "الصفحة الرئيسية — بعد شريط المزايا", kinds: BOTH },
  { key: "home.afterVideo", label: "الصفحة الرئيسية — بعد الفيديو التعريفي", kinds: BOTH },
  { key: "home.about", label: "الصفحة الرئيسية — داخل «عن البرنامج»", kinds: BOTH },
  { key: "home.afterAbout", label: "الصفحة الرئيسية — بعد «عن البرنامج»", kinds: BOTH },
  { key: "home.afterLearn", label: "الصفحة الرئيسية — بعد «ماذا ستتعلّم؟»", kinds: BOTH },
  { key: "home.afterCurriculum", label: "الصفحة الرئيسية — بعد «محتوى البرنامج»", kinds: BOTH },
  { key: "home.afterSteps", label: "الصفحة الرئيسية — بعد «كيف يعمل البرنامج؟»", kinds: BOTH },
  { key: "home.afterPlans", label: "الصفحة الرئيسية — بعد الباقات", kinds: BOTH },
  { key: "home.afterFaq", label: "الصفحة الرئيسية — بعد الأسئلة الشائعة", kinds: BOTH },
  { key: "dashboard.top", label: "لوحة الطالب — في الأعلى (للإعلانات)", kinds: BOTH },
  { key: "dashboard.bottom", label: "لوحة الطالب — في الأسفل", kinds: BOTH },
  { key: "lesson.bottom", label: "صفحة الدرس — أسفل محتوى الدرس", kinds: BOTH },
] as const satisfies readonly PlacementDef[];

export type PlacementKey = (typeof SITE_PLACEMENTS)[number]["key"];

export const placementsFor = (kind: BlockKind) =>
  SITE_PLACEMENTS.filter((p) => (p.kinds as readonly BlockKind[]).includes(kind));

export const isPlacementFor = (kind: BlockKind, key: string): key is PlacementKey =>
  placementsFor(kind).some((p) => p.key === key);

export const placementLabel = (key: string) =>
  SITE_PLACEMENTS.find((p) => p.key === key)?.label ?? "موضع غير معروف";

export const isDarkPlacement = (key: string) =>
  SITE_PLACEMENTS.some((p) => p.key === key && "dark" in p && p.dark);

/** لترتيب القوائم في لوحة الإدارة بترتيب الظهور في الموقع */
export const placementRank = (key: string) => SITE_PLACEMENTS.findIndex((p) => p.key === key);
