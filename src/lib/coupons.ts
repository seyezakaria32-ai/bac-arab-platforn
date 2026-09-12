import "server-only";
import { db, parseJson } from "./db";
import { formatPrice } from "./payments/service";

/**
 * أكواد الخصم والإحالة.
 * التحقّق والحساب يتمّان في الخادم فقط — المتصفّح لا يرسل أي مبلغ،
 * بل الكود وحده، ويُعاد حساب الخصم عند إنشاء عملية الدفع.
 */

export type CouponQuote =
  | { ok: false; message: string }
  | {
      ok: true;
      couponId: string;
      code: string;
      discountCents: number;
      finalCents: number;
      label: string;
    };

export function normalizeCode(raw: string) {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function couponLabel(
  coupon: { kind: string; value: number },
  currency = "XOF",
) {
  return coupon.kind === "fixed"
    ? `خصم ${formatPrice(coupon.value, currency)}`
    : `خصم ${coupon.value}%`;
}

export async function quoteCoupon(
  rawCode: string,
  plan: { code: string; priceCents: number; currency: string },
): Promise<CouponQuote> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, message: "أدخل كود الخصم" };

  const coupon = await db.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.isActive) {
    return { ok: false, message: "الكود غير صالح" };
  }

  const now = new Date();
  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, message: "هذا الكود لم يبدأ بعد" };
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    return { ok: false, message: "انتهت صلاحية هذا الكود" };
  }
  if (coupon.maxUses > 0 && coupon.usedCount >= coupon.maxUses) {
    return { ok: false, message: "استُنفد عدد استعمالات هذا الكود" };
  }

  const allowed = parseJson<string[]>(coupon.planCodes, []);
  if (allowed.length > 0 && !allowed.includes(plan.code)) {
    return { ok: false, message: "هذا الكود لا ينطبق على هذه الباقة" };
  }

  const raw =
    coupon.kind === "fixed"
      ? coupon.value
      : (plan.priceCents * Math.min(100, Math.max(0, coupon.value))) / 100;
  // الفرنك لا يتجزّأ: نقرّب الخصم إلى فرنك كامل (١٠٠ بأصغر وحدة)
  const discountCents = Math.min(plan.priceCents, Math.round(raw / 100) * 100);

  return {
    ok: true,
    couponId: coupon.id,
    code: coupon.code,
    discountCents,
    finalCents: plan.priceCents - discountCents,
    label: couponLabel(coupon, plan.currency),
  };
}
