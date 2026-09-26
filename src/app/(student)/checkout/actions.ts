"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getDefaultCourse } from "@/lib/curriculum";
import { getProvider, enabledProviderIds } from "@/lib/payments";
import {
  initiatePayment,
  activateSubscription,
  formatPrice,
} from "@/lib/payments/service";
import { quoteCoupon } from "@/lib/coupons";
import { saveUpload, UploadError } from "@/lib/storage";
import { PAYMENT_STATUS } from "@/lib/constants";
import { requestOrigin } from "@/lib/site-url";

export type CheckoutResponse =
  | { ok: false; message: string }
  | {
      ok: true;
      mode: "redirect";
      url: string;
      reference: string;
    }
  | {
      ok: true;
      mode: "form";
      url: string;
      fields: Record<string, string>;
      reference: string;
    }
  | {
      ok: true;
      mode: "instructions";
      instructions: string;
      reference: string;
      paymentId: string;
    };

export type CouponPreview =
  | { ok: false; message: string }
  | {
      ok: true;
      coupon: {
        code: string;
        label: string;
        discount: string;
        finalPrice: string;
        free: boolean;
      };
    };

/** معاينة كود الخصم في صفحة الدفع (العرض فقط — المبلغ يُعاد حسابه عند الدفع) */
export async function previewCouponAction(
  planCode: string,
  code: string,
): Promise<CouponPreview> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول أولًا" };

  const plan = await db.plan.findUnique({ where: { code: planCode } });
  if (!plan || !plan.isActive) return { ok: false, message: "الباقة غير متوفّرة" };

  const quote = await quoteCoupon(code, plan);
  if (!quote.ok) return quote;

  return {
    ok: true,
    coupon: {
      code: quote.code,
      label: quote.label,
      discount: formatPrice(quote.discountCents, plan.currency),
      finalPrice: formatPrice(quote.finalCents, plan.currency),
      free: quote.finalCents === 0,
    },
  };
}

/** بدء عملية دفع لباقة معيّنة عبر بوابة مختارة، مع كود خصم اختياري */
export async function startCheckoutAction(
  planCode: string,
  providerId: string,
  couponCode?: string | null,
): Promise<CheckoutResponse> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول أولًا" };

  const [plan, course] = await Promise.all([
    db.plan.findUnique({ where: { code: planCode } }),
    getDefaultCourse(),
  ]);
  if (!plan || !plan.isActive) return { ok: false, message: "الباقة غير متوفّرة" };
  if (!course) return { ok: false, message: "البرنامج غير متاح" };

  // الكود يُتحقَّق منه من جديد هنا — لا نثق بمعاينة المتصفّح
  let coupon: { couponId: string; discountCents: number } | null = null;
  let finalCents = plan.priceCents;
  if (couponCode) {
    const quote = await quoteCoupon(couponCode, plan);
    if (!quote.ok) return { ok: false, message: quote.message };
    coupon = { couponId: quote.couponId, discountCents: quote.discountCents };
    finalCents = quote.finalCents;
  }

  // كود يغطّي المبلغ كاملًا: تفعيل مباشر دون المرور ببوابة دفع
  if (finalCents === 0 && coupon) {
    const { payment } = await initiatePayment({
      userId: user.id,
      courseId: course.id,
      planId: plan.id,
      provider: "coupon",
      coupon,
    });
    await activateSubscription(payment.id, { raw: { coupon: couponCode } });
    revalidatePath("/dashboard");
    return {
      ok: true,
      mode: "redirect",
      url: `/checkout/${plan.code}?status=success&ref=${payment.reference}`,
      reference: payment.reference,
    };
  }

  if (!enabledProviderIds().includes(providerId)) {
    return { ok: false, message: "بوابة الدفع غير متاحة" };
  }
  const provider = getProvider(providerId);
  if (!provider || !provider.isConfigured()) {
    return { ok: false, message: "بوابة الدفع غير مهيّأة بعد" };
  }

  const { payment } = await initiatePayment({
    userId: user.id,
    courseId: course.id,
    planId: plan.id,
    provider: providerId,
    coupon,
  });

  const base = await requestOrigin();

  try {
    const result = await provider.createCheckout({
      payment: {
        id: payment.id,
        reference: payment.reference,
        amountCents: payment.amountCents,
        currency: payment.currency,
      },
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
      plan: { code: plan.code, name: plan.name },
      course: { id: course.id, title: course.title },
      successUrl: `${base}/checkout/${plan.code}?status=success&ref=${payment.reference}`,
      cancelUrl: `${base}/checkout/${plan.code}?status=cancelled&ref=${payment.reference}`,
      webhookUrl: `${base}/api/payments/webhook/${providerId}`,
    });

    if (result.providerRef) {
      await db.payment.update({
        where: { id: payment.id },
        data: { providerRef: result.providerRef },
      });
    }

    if (result.mode === "redirect")
      return {
        ok: true,
        mode: "redirect",
        url: result.url,
        reference: payment.reference,
      };

    if (result.mode === "form")
      return {
        ok: true,
        mode: "form",
        url: result.url,
        fields: result.fields,
        reference: payment.reference,
      };

    return {
      ok: true,
      mode: "instructions",
      instructions: result.instructions,
      reference: payment.reference,
      paymentId: payment.id,
    };
  } catch (error) {
    await db.payment.update({
      where: { id: payment.id },
      data: {
        status: PAYMENT_STATUS.FAILED,
        adminNote: error instanceof Error ? error.message : "خطأ غير معروف",
      },
    });
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "تعذّر بدء عملية الدفع، حاول مرّة أخرى.",
    };
  }
}

/** رفع إيصال التحويل اليدوي — ينقل العملية إلى «بانتظار التحقّق» */
export async function uploadReceiptAction(
  _prev: unknown,
  formData: FormData,
): Promise<{ ok: boolean; message: string }> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول" };

  const paymentId = String(formData.get("paymentId") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 500);
  const file = formData.get("receipt");

  const payment = await db.payment.findUnique({ where: { id: paymentId } });
  if (!payment || payment.userId !== user.id) {
    return { ok: false, message: "عملية الدفع غير موجودة" };
  }
  if (payment.status === PAYMENT_STATUS.PAID) {
    return { ok: false, message: "هذه العملية مؤكّدة بالفعل" };
  }

  if (!(file instanceof File)) {
    return { ok: false, message: "أرفق صورة الإيصال" };
  }

  try {
    const stored = await saveUpload(file, "receipts");
    await db.payment.update({
      where: { id: payment.id },
      data: {
        receiptUrl: stored.url,
        payerNote: note || null,
        status: PAYMENT_STATUS.AWAITING_REVIEW,
      },
    });
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof UploadError ? error.message : "تعذّر رفع الملف",
    };
  }

  revalidatePath("/dashboard");
  return {
    ok: true,
    message:
      "تمّ استلام الإيصال. سيتحقّق منه الأستاذ ويُفعَّل حسابك خلال وقت قصير.",
  };
}
