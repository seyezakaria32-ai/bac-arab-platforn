import {
  PaymentConfigError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
  type WebhookResult,
} from "./types";

/**
 * Wave (السنغال / كوت ديفوار) — Checkout Sessions API
 * التوثيق: https://docs.wave.com/business#checkout
 *
 * ملاحظة: Wave يتعامل مع XOF كعملة بلا كسور (لا سنتات)،
 * لذلك نقسم amountCents على 100 عند الإرسال.
 */

function config() {
  const apiKey = process.env.WAVE_API_KEY;
  const baseUrl = process.env.WAVE_BASE_URL || "https://api.wave.com/v1";
  return { apiKey, baseUrl, webhookSecret: process.env.WAVE_WEBHOOK_SECRET };
}

function majorAmount(amountCents: number, currency: string) {
  // العملات بلا كسور
  const zeroDecimal = ["XOF", "XAF", "JPY", "KRW"];
  return zeroDecimal.includes(currency.toUpperCase())
    ? String(Math.round(amountCents / 100))
    : (amountCents / 100).toFixed(2);
}

export const waveProvider: PaymentProvider = {
  id: "wave",
  label: "Wave",
  description: "الدفع الفوري عبر محفظة Wave — الأسرع في السنغال",
  icon: "wave",

  isConfigured() {
    return Boolean(config().apiKey);
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const { apiKey, baseUrl } = config();
    if (!apiKey) throw new PaymentConfigError("Wave");

    const res = await fetch(`${baseUrl}/checkout/sessions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        // يمنع إنشاء جلستين لنفس العملية عند تكرار الطلب
        "Idempotency-Key": input.payment.reference,
      },
      body: JSON.stringify({
        amount: majorAmount(input.payment.amountCents, input.payment.currency),
        currency: input.payment.currency,
        error_url: input.cancelUrl,
        success_url: input.successUrl,
        client_reference: input.payment.reference,
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`فشل إنشاء جلسة الدفع لدى Wave: ${res.status} ${detail}`);
    }

    const data = (await res.json()) as {
      id: string;
      wave_launch_url: string;
    };

    return {
      mode: "redirect",
      url: data.wave_launch_url,
      providerRef: data.id,
    };
  },

  async handleWebhook(req: Request): Promise<WebhookResult> {
    const raw = await req.text();
    const { webhookSecret } = config();

    // التحقّق من التوقيع  Wave-Signature: t=...,v1=...
    if (webhookSecret) {
      const header = req.headers.get("wave-signature") ?? "";
      const parts = Object.fromEntries(
        header.split(",").map((p) => p.split("=") as [string, string]),
      );
      const expected = await hmacHex(webhookSecret, `${parts.t}.${raw}`);
      if (!parts.v1 || !timingSafeEqual(parts.v1, expected)) {
        throw new Error("توقيع غير صالح لإشعار Wave");
      }
    }

    const body = JSON.parse(raw) as {
      type?: string;
      data?: {
        id?: string;
        client_reference?: string;
        payment_status?: string;
      };
    };

    const paid =
      body.type === "checkout.session.completed" ||
      body.data?.payment_status === "succeeded";

    return {
      reference: body.data?.client_reference ?? null,
      providerRef: body.data?.id ?? null,
      status: paid ? "paid" : body.type?.includes("failed") ? "failed" : "pending",
      raw: body,
    };
  },
};

async function hmacHex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
