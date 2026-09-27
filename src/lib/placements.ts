/**
 * أماكن المحتوى القابل للإدارة (العارضات والأزرار).
 *
 * في الصفحة الرئيسية المكان مربوط بقسم: «بعد القسم X» (home.after:<id>)، أو
 * داخل قسمين يتّسعان لذلك (الواجهة الأولى، «عن البرنامج»). فإذا رُتّبت الأقسام
 * من «تصميم الموقع» انتقل ما بعد كل قسم معه. قائمة أماكن الصفحة الرئيسية
 * تُبنى من الأقسام الحالية — انظر getPlacementOptions في src/lib/sections/server.ts.
 *
 * هنا ما لا يتغيّر: أماكن خارج الصفحة الرئيسية، وأدوات مشتركة.
 */

export type BlockKind = "slider" | "button";

export type PlacementOption = {
  key: string;
  label: string;
  /** خلفية المكان داكنة: تُلوَّن النصوص حول الزرّ بما يُقرأ عليها */
  dark?: boolean;
};

/** بعد قسم من أقسام الصفحة الرئيسية */
export const afterSection = (sectionId: string) => `home.after:${sectionId}`;

/** داخل الواجهة الأولى، تحت زرَّي البداية — للأزرار فقط */
export const IN_HERO = "home.hero";
/** داخل «عن البرنامج»: العارض بجانب النصّ، والزرّ تحته */
export const IN_ABOUT = "home.about";

export const APP_PLACEMENTS: PlacementOption[] = [
  { key: "dashboard.top", label: "لوحة الطالب — في الأعلى (للإعلانات)" },
  { key: "dashboard.bottom", label: "لوحة الطالب — في الأسفل" },
  { key: "lesson.bottom", label: "صفحة الدرس — أسفل محتوى الدرس" },
];

export const isDarkPlacement = (key: string) => key === IN_HERO;
