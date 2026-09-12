/**
 * عقد موحّد لبوابات الدفع.
 * أي بوابة جديدة (Stripe، PayPal، بنك محلي…) تُضاف بإنشاء ملف واحد
 * ينفّذ هذه الواجهة ثم تسجيله في src/lib/payments/index.ts — دون لمس بقية النظام.
 */

export type CheckoutInput = {
  payment: {
    id: string;
    reference: string;
    amountCents: number;
    currency: string;
  };
  user: { id: string; name: string; email: string; phone?: string | null };
  plan: { code: string; name: string };
  course: { id: string; title: string };
  successUrl: string;
  cancelUrl: string;
  webhookUrl: string;
};

export type CheckoutResult =
  /** إعادة توجيه المستخدم إلى صفحة البوابة */
  | { mode: "redirect"; url: string; providerRef?: string }
  /** نموذج POST مخفي يُرسل تلقائيًا (CMI وما شابه) */
  | {
      mode: "form";
      url: string;
      fields: Record<string, string>;
      providerRef?: string;
    }
  /** تعليمات تحويل يدوي + رفع إيصال */
  | { mode: "instructions"; instructions: string; providerRef?: string };

export type WebhookResult = {
  reference: string | null;
  providerRef: string | null;
  /** paid | failed | pending */
  status: "paid" | "failed" | "pending";
  raw: unknown;
};

export interface PaymentProvider {
  /** المعرّف المخزَّن في قاعدة البيانات (payment.provider) */
  id: string;
  label: string;
  description: string;
  /** أيقونة/رمز مختصر يُعرض في الواجهة */
  icon: string;
  /** هل مفاتيح البيئة مضبوطة؟ */
  isConfigured(): boolean;
  createCheckout(input: CheckoutInput): Promise<CheckoutResult>;
  /** التحقّق من صحّة الإشعار القادم من البوابة */
  handleWebhook(req: Request): Promise<WebhookResult>;
}

export class PaymentConfigError extends Error {
  constructor(provider: string) {
    super(`بوابة الدفع «${provider}» غير مهيّأة — أضف مفاتيحها في ملف .env`);
    this.name = "PaymentConfigError";
  }
}
