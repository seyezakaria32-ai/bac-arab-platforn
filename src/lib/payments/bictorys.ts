import {
  PaymentConfigError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
  type WebhookResult,
} from "./types";

/**
 * Bictorys (السنغال) — Charges API
 * التوثيق: https://docs.bictorys.com/reference/createcharge
 *
 * بوابة واحدة تجمع Wave وOrange Money وFree Money والبطاقات البنكية:
 * حين لا نحدّد payment_type يُحوَّل الطالب إلى صفحة Bictorys ليختار وسيلته.
 *
 * ثلاث ملاحظات:
 * ١. المفاتيح: السرّي للنداءات من الخادم، والعامّ للواجهة الأمامية. نستعمل
 *    السرّي إن وُجد وإلا العامّ (يكفي للتجربة لا للإنتاج).
 * ٢. عنوان الإنتاج غير منشور في التوثيق — يُضبط عبر BICTORYS_BASE_URL.
 * ٣. رابط الإشعار يُضبط مرّة واحدة من لوحة Bictorys، لا مع كل عملية.
 */

const ZERO_DECIMAL = ["XOF", "XAF", "JPY", "KRW"];

const PAID = new Set(["succeeded", "success", "authorized", "captured", "purchased", "paid"]);
const FAILED = new Set(["failed", "declined", "expired", "cancelled", "canceled", "refunded", "reversed"]);

function config() {
  return {
    key: process.env.BICTORYS_SECRET_KEY || process.env.BICTORYS_PUBLIC_KEY || "",
    baseUrl: process.env.BICTORYS_BASE_URL || "https://api.test.bictorys.com",
    webhookSecret: process.env.BICTORYS_WEBHOOK_SECRET || "",
    country: process.env.BICTORYS_COUNTRY || "SN",
  };
}

function toMajor(cents: number, currency: string) {
  return ZERO_DECIMAL.includes(currency.toUpperCase())
    ? Math.round(cents / 100)
    : Number((cents / 100).toFixed(2));
}

function toCents(major: number, currency: string) {
  return ZERO_DECIMAL.includes((currency || "XOF").toUpperCase())
    ? Math.round(major) * 100
    : Math.round(major * 100);
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Bictorys ترفض أي طلب يحتوي روابط localhost (حماية من SSRF) وتعيد 403.
 * في التطوير نستبدلها برابط عامّ حتى تُنشأ عملية الدفع ويمكن تجربة
 * صفحة البوابة. في الإنتاج تُستعمل روابط الموقع كما هي.
 */
function publicUrl(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname;
  } catch {
    host = "";
  }
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (!isLocal) return url;
  console.warn(
    `[bictorys] رابط محلّي (${url}) — استُبدل برابط عامّ لأن البوابة ترفض localhost.`,
  );
  return "https://example.com/bac-arabe-local";
}

export const bictorysProvider: PaymentProvider = {
  id: "bictorys",
  label: "الدفع الإلكتروني",
  description: "Wave · Orange Money · Free Money · بطاقة بنكية — عبر Bictorys",
  icon: "wallet",

  isConfigured() {
    return Boolean(config().key);
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const { key, baseUrl, country } = config();
    if (!key) throw new PaymentConfigError("Bictorys");

    const res = await fetch(`${baseUrl}/pay/v1/charges`, {
      method: "POST",
      headers: {
        "X-API-Key": key,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        amount: toMajor(input.payment.amountCents, input.payment.currency),
        currency: input.payment.currency,
        country,
        deviceId: input.payment.id,
        paymentReference: input.payment.reference,
        merchantReference: input.payment.reference,
        successRedirectUrl: publicUrl(input.successUrl),
        errorRedirectUrl: publicUrl(input.cancelUrl),
        customerObject: {
          name: input.user.name,
          email: input.user.email,
          ...(input.user.phone ? { phone: input.user.phone } : {}),
          country,
        },
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(
        `فشل إنشاء عملية الدفع لدى Bictorys (${res.status}): ${detail.slice(0, 300)}`,
      );
    }

    const data = (await res.json()) as {
      link?: string;
      redirectUrl?: string;
      chargeId?: string;
      transactionId?: string;
    };

    const url = data.link ?? data.redirectUrl;
    if (!url) throw new Error("لم تُعِد Bictorys رابط صفحة الدفع");

    return {
      mode: "redirect",
      url,
      providerRef: data.chargeId ?? data.transactionId,
    };
  },

  async handleWebhook(req: Request): Promise<WebhookResult> {
    const { webhookSecret } = config();

    // Bictorys لا توقّع الإشعار تشفيريًا بل ترسل المفتاح في ترويسة، لذلك
    // نرفض العمل إن لم يكن المفتاح مضبوطًا — وإلّا استطاع أي شخص إرسال
    // إشعار دفع مزوّر وفتح البرنامج مجانًا.
    if (!webhookSecret) {
      throw new Error("BICTORYS_WEBHOOK_SECRET غير مضبوط — لن تُقبل الإشعارات");
    }
    const sent = req.headers.get("x-secret-key") ?? "";
    if (!timingSafeEqual(sent, webhookSecret)) {
      throw new Error("مفتاح إشعار Bictorys غير صالح");
    }

    const raw = await req.text();
    const body = JSON.parse(raw) as Record<string, unknown>;
    const status = String(body.status ?? "").toLowerCase().trim();
    const amount = typeof body.amount === "number" ? body.amount : null;
    const currency = typeof body.currency === "string" ? body.currency : "XOF";

    return {
      reference:
        (body.merchantReference as string | undefined) ??
        (body.paymentReference as string | undefined) ??
        (body.reference as string | undefined) ??
        null,
      providerRef:
        (body.id as string | undefined) ??
        (body.transactionId as string | undefined) ??
        (body.chargeId as string | undefined) ??
        null,
      status: PAID.has(status) ? "paid" : FAILED.has(status) ? "failed" : "pending",
      amountCents: amount === null ? undefined : toCents(amount, currency),
      currency,
      raw: body,
    };
  },
};
