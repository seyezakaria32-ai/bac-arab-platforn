/**
 * تنسيق التواريخ والأرقام للعرض العربي.
 *
 * نتجنّب الصيغة الرقمية (10/9/2026) عمدًا: خوارزمية bidi ترتّب مقاطعها
 * من اليمين، فتبدو بصريًا «2026/9/10» وتلتبس على القارئ.
 * اسم الشهر يزيل اللبس تمامًا مهما كان اتجاه العرض.
 */

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  day: "numeric",
  month: "long",
  year: "numeric",
};

/** مثال: 10 سبتمبر 2026 */
export function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG-u-nu-latn", DATE_OPTS);
}

/** مثال: 10 سبتمبر 2026، 14:30 */
export function formatDateTime(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleDateString("ar-EG-u-nu-latn", DATE_OPTS)}، ${d.toLocaleTimeString(
    "ar-EG-u-nu-latn",
    { hour: "2-digit", minute: "2-digit", hour12: false },
  )}`;
}

/** صيغة مختصرة للجداول: 10 سبت. 2026 */
export function formatDateShort(date: Date | string | null | undefined) {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ar-EG-u-nu-latn", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
