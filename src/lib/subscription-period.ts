const DAY = 86_400_000;

type CurrentSubscription =
  | { planId: string; status: string; expiresAt: Date | null }
  | null
  | undefined;

/**
 * أقرب نهاية موسم قادمة: التاريخ المضبوط في الإعدادات (YYYY-MM-DD)، وإن كان
 * قد مرّ نُرحّله سنة بسنة حتى يصير في المستقبل. هكذا يضبط المسؤول التاريخ
 * مرّة واحدة، ومن يدفع بعد انتهاء الامتحانات يحصل تلقائيًا على الموسم التالي.
 */
export function nextSeasonEnd(seasonEnd: string, now: Date = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(seasonEnd.trim());
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]), Number(m[3])];
  // نهاية اليوم بتوقيت غرينتش (داكار على GMT طوال السنة)
  let end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
  if (Number.isNaN(end.getTime())) return null;
  while (end.getTime() <= now.getTime()) {
    end = new Date(Date.UTC(end.getUTCFullYear() + 1, month - 1, day, 23, 59, 59));
  }
  return end;
}

/**
 * نهاية الوصول عند الدفع أو التفعيل اليدوي.
 *
 * - durationDays = 0 مع تاريخ موسم → الوصول حتى نهاية موسم البكالوريا
 * - durationDays = 0 بلا تاريخ موسم → وصول دائم (null)
 * - durationDays > 0 → مدّة بالأيام؛ تجديد نفس الباقة وهي فعّالة يُضاف إلى
 *   نهاية الفترة الحالية فلا يضيع يوم (احتياطي لباقات مستقبلية)
 */
export function nextPeriod(opts: {
  durationDays: number;
  planId: string;
  current?: CurrentSubscription;
  now?: Date;
  seasonEnd?: string | null;
}): { expiresAt: Date | null; extended: boolean } {
  const now = opts.now ?? new Date();

  if (opts.durationDays <= 0) {
    const end = opts.seasonEnd ? nextSeasonEnd(opts.seasonEnd, now) : null;
    return { expiresAt: end, extended: false };
  }

  const c = opts.current;
  const currentEnd = c?.expiresAt ? c.expiresAt.getTime() : 0;
  const extended =
    !!c &&
    c.status === "active" &&
    c.planId === opts.planId &&
    currentEnd > now.getTime();

  const base = extended ? currentEnd : now.getTime();
  return { expiresAt: new Date(base + opts.durationDays * DAY), extended };
}

/** الأيام المتبقّية مقرّبة للأعلى — null للوصول الدائم */
export function daysLeft(expiresAt: Date | null, now: Date = new Date()) {
  if (!expiresAt) return null;
  return Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / DAY));
}
