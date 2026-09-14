import "server-only";
import { db, parseJson } from "../db";
import { PAYMENT_STATUS, SUBSCRIPTION_STATUS } from "../constants";
import { getSettings } from "../settings";

/**
 * منطق الأعمال للدفع والاشتراك — مستقل تمامًا عن البوابة المستعملة.
 * لا يُمنح الوصول إلى المحتوى إلا عبر `activateSubscription`، وهي تُستدعى
 * حصريًا بعد تأكيد الدفع (Webhook) أو تفعيل يدوي من المسؤول.
 */

export function newReference() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `BAC-${stamp}-${rand}`;
}

export function formatPrice(amountCents: number, currency = "XOF") {
  const zeroDecimal = ["XOF", "XAF", "JPY", "KRW"];
  const value = zeroDecimal.includes(currency)
    ? Math.round(amountCents / 100)
    : amountCents / 100;
  const labels: Record<string, string> = {
    XOF: "فرنك",
    MAD: "درهم",
    EUR: "أورو",
    USD: "دولار",
  };
  // أرقام لاتينية داخل النص العربي — أوضح للقراءة في سياق الأسعار
  return `${value.toLocaleString("en-US")} ${labels[currency] ?? currency}`;
}

export type PlanFeature = { label: string; included: boolean };

export function planFeatures(plan: { features: string }): PlanFeature[] {
  return parseJson<PlanFeature[]>(plan.features, []);
}

/** ينشئ عملية دفع معلّقة + اشتراك بحالة pending (بدون أي صلاحية وصول) */
export async function initiatePayment(params: {
  userId: string;
  courseId: string;
  planId: string;
  provider: string;
  /** خصم محسوب مسبقًا عبر quoteCoupon — لا يُقبل أي مبلغ من المتصفّح */
  coupon?: { couponId: string; discountCents: number } | null;
}) {
  const plan = await db.plan.findUnique({ where: { id: params.planId } });
  if (!plan || !plan.isActive) throw new Error("الباقة غير متوفّرة");

  const reference = newReference();

  const subscription = await db.subscription.upsert({
    where: {
      userId_courseId: { userId: params.userId, courseId: params.courseId },
    },
    update: { planId: plan.id, status: SUBSCRIPTION_STATUS.PENDING },
    create: {
      userId: params.userId,
      courseId: params.courseId,
      planId: plan.id,
      status: SUBSCRIPTION_STATUS.PENDING,
    },
  });

  const payment = await db.payment.create({
    data: {
      userId: params.userId,
      courseId: params.courseId,
      planId: plan.id,
      subscriptionId: subscription.id,
      provider: params.provider,
      reference,
      amountCents: Math.max(
        0,
        plan.priceCents - (params.coupon?.discountCents ?? 0),
      ),
      couponId: params.coupon?.couponId ?? null,
      discountCents: params.coupon?.discountCents ?? 0,
      currency: plan.currency,
      status: PAYMENT_STATUS.PENDING,
    },
  });

  return { payment, plan, subscription };
}

/**
 * تفعيل الاشتراك — نقطة الدخول الوحيدة لمنح الوصول.
 * تُستدعى من Webhook البوابة أو من لوحة الإدارة بعد التحقّق من الإيصال.
 */
export async function activateSubscription(
  paymentId: string,
  opts: { verifiedById?: string; providerRef?: string; raw?: unknown } = {},
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { plan: true },
  });
  if (!payment) throw new Error("عملية الدفع غير موجودة");
  if (payment.status === PAYMENT_STATUS.PAID) return payment;

  const now = new Date();
  const expiresAt =
    payment.plan.durationDays > 0
      ? new Date(now.getTime() + payment.plan.durationDays * 86400_000)
      : null;

  const [updated] = await db.$transaction([
    db.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.PAID,
        verifiedAt: now,
        verifiedById: opts.verifiedById ?? null,
        providerRef: opts.providerRef ?? payment.providerRef,
        rawPayload: opts.raw ? JSON.stringify(opts.raw) : payment.rawPayload,
      },
    }),
    db.subscription.upsert({
      where: {
        userId_courseId: {
          userId: payment.userId,
          courseId: payment.courseId,
        },
      },
      update: {
        planId: payment.planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startedAt: now,
        expiresAt,
      },
      create: {
        userId: payment.userId,
        courseId: payment.courseId,
        planId: payment.planId,
        status: SUBSCRIPTION_STATUS.ACTIVE,
        startedAt: now,
        expiresAt,
      },
    }),
  ]);

  // يُحتسب استعمال الكود عند تأكيد الدفع فقط — العمليات المعلّقة لا تستهلكه.
  // الخروج المبكر أعلاه (عملية مؤكّدة سلفًا) يمنع الاحتساب مرّتين.
  if (payment.couponId) {
    await db.coupon
      .update({
        where: { id: payment.couponId },
        data: { usedCount: { increment: 1 } },
      })
      .catch(() => {}); // حُذف الكود بعد إنشاء العملية
  }

  return updated;
}

/** رفض / فشل عملية دفع */
export async function failPayment(paymentId: string, note?: string) {
  return db.payment.update({
    where: { id: paymentId },
    data: { status: PAYMENT_STATUS.FAILED, adminNote: note },
  });
}

/** معالجة نتيجة Webhook قادمة من أي بوابة */
export async function applyWebhookResult(result: {
  reference: string | null;
  providerRef: string | null;
  status: "paid" | "failed" | "pending";
  amountCents?: number;
  currency?: string;
  raw: unknown;
}) {
  if (!result.reference) return { handled: false, reason: "لا يوجد مرجع" };

  const payment = await db.payment.findUnique({
    where: { reference: result.reference },
  });
  if (!payment) return { handled: false, reason: "عملية غير معروفة" };

  // البوابة قد تُعلن مبلغًا مختلفًا عن مبلغ العملية المخزَّن عندنا.
  // لا نفعّل الاشتراك حينها مهما كانت حالة الدفع، بل نحوّلها للمراجعة.
  if (
    typeof result.amountCents === "number" &&
    result.amountCents !== payment.amountCents
  ) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.AWAITING_REVIEW,
        adminNote:
          `المبلغ الوارد من البوابة (${result.amountCents}) لا يطابق مبلغ العملية (${payment.amountCents}) — يحتاج مراجعة يدوية`,
        rawPayload: JSON.stringify(result.raw),
      },
    });
    return { handled: false, reason: "المبلغ لا يطابق مبلغ العملية" };
  }

  const settings = await getSettings();

  if (result.status === "paid") {
    if (settings["payment.autoActivate"]) {
      await activateSubscription(payment.id, {
        providerRef: result.providerRef ?? undefined,
        raw: result.raw,
      });
    } else {
      await db.payment.update({
        where: { id: payment.id },
        data: {
          status: PAYMENT_STATUS.AWAITING_REVIEW,
          providerRef: result.providerRef,
          rawPayload: JSON.stringify(result.raw),
        },
      });
    }
    return { handled: true };
  }

  if (result.status === "failed") {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.FAILED,
        rawPayload: JSON.stringify(result.raw),
      },
    });
  }

  return { handled: true };
}
