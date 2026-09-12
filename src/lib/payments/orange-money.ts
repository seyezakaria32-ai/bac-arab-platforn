import {
  PaymentConfigError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
  type WebhookResult,
} from "./types";

/**
 * Orange Money — Web Payment API
 * التوثيق: https://developer.orange.com/apis/om-webpay
 *
 * التدفّق: طلب رمز وصول (OAuth) → إنشاء طلب دفع → إعادة توجيه إلى payment_url
 * ثم إشعار على notif_url عند اكتمال العملية.
 */

function config() {
  return {
    clientId: process.env.ORANGE_MONEY_CLIENT_ID,
    clientSecret: process.env.ORANGE_MONEY_CLIENT_SECRET,
    merchantKey: process.env.ORANGE_MONEY_MERCHANT_KEY,
    baseUrl:
      process.env.ORANGE_MONEY_BASE_URL ||
      "https://api.orange.com/orange-money-webpay/dev/v1",
  };
}

async function getAccessToken() {
  const { clientId, clientSecret } = config();
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch("https://api.orange.com/oauth/v3/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`فشل الحصول على رمز Orange Money: ${res.status}`);
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

export const orangeMoneyProvider: PaymentProvider = {
  id: "orange_money",
  label: "Orange Money",
  description: "الدفع عبر محفظة Orange Money",
  icon: "orange",

  isConfigured() {
    const c = config();
    return Boolean(c.clientId && c.clientSecret && c.merchantKey);
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const c = config();
    if (!this.isConfigured()) throw new PaymentConfigError("Orange Money");

    const token = await getAccessToken();
    const res = await fetch(`${c.baseUrl}/webpayment`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        merchant_key: c.merchantKey,
        currency: input.payment.currency === "XOF" ? "OUV" : input.payment.currency,
        order_id: input.payment.reference,
        amount: Math.round(input.payment.amountCents / 100),
        return_url: input.successUrl,
        cancel_url: input.cancelUrl,
        notif_url: input.webhookUrl,
        lang: "fr",
        reference: input.course.title.slice(0, 30),
      }),
    });

    if (!res.ok) {
      const detail = await res.text();
      throw new Error(`فشل إنشاء الدفع لدى Orange Money: ${res.status} ${detail}`);
    }

    const data = (await res.json()) as {
      payment_url: string;
      pay_token: string;
      notif_token: string;
    };

    return {
      mode: "redirect",
      url: data.payment_url,
      providerRef: data.pay_token,
    };
  },

  async handleWebhook(req: Request): Promise<WebhookResult> {
    const body = (await req.json()) as {
      status?: string;
      txnid?: string;
      order_id?: string;
      notif_token?: string;
    };

    const status =
      body.status === "SUCCESS"
        ? "paid"
        : body.status === "FAILED" || body.status === "EXPIRED"
          ? "failed"
          : "pending";

    return {
      reference: body.order_id ?? null,
      providerRef: body.txnid ?? body.notif_token ?? null,
      status,
      raw: body,
    };
  },
};
