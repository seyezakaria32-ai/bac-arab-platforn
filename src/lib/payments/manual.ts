import type {
  CheckoutInput,
  CheckoutResult,
  PaymentProvider,
  WebhookResult,
} from "./types";

/**
 * التحويل اليدوي — الطالب يحوّل عبر Wave / Orange Money / تحويل بنكي،
 * يرفع صورة الإيصال، ثم يفعّل المسؤول الاشتراك من لوحة الإدارة.
 *
 * لا يحتاج أي مفاتيح، ويعمل دائمًا — وهو الخيار المناسب للانطلاق قبل
 * اعتماد بوابة رسمية.
 */

export const manualProvider: PaymentProvider = {
  id: "manual",
  label: "تحويل يدوي + إيصال",
  description:
    "حوّل المبلغ ثم ارفع صورة الإيصال — يُفعَّل حسابك بعد التحقّق من الإدارة",
  icon: "receipt",

  isConfigured() {
    return true;
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const instructions =
      process.env.MANUAL_PAYMENT_INSTRUCTIONS ||
      "حوّل المبلغ عبر Wave أو Orange Money ثم ارفع صورة الإيصال.";

    return {
      mode: "instructions",
      instructions,
      providerRef: input.payment.reference,
    };
  },

  async handleWebhook(): Promise<WebhookResult> {
    // لا يوجد إشعار آلي — التأكيد يتمّ من لوحة الإدارة
    return { reference: null, providerRef: null, status: "pending", raw: null };
  },
};
