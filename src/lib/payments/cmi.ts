import crypto from "node:crypto";
import {
  PaymentConfigError,
  type CheckoutInput,
  type CheckoutResult,
  type PaymentProvider,
  type WebhookResult,
} from "./types";

/**
 * CMI (المركز النقدي المغربي) — الدفع بالبطاقة البنكية.
 * التدفّق: نموذج POST موقّع (HASH) نحو بوابة CMI، ثم إشعار على callbackUrl.
 */

function config() {
  return {
    clientId: process.env.CMI_CLIENT_ID,
    storeKey: process.env.CMI_STORE_KEY,
    baseUrl:
      process.env.CMI_BASE_URL || "https://testpayment.cmi.co.ma/fim/est3Dgate",
  };
}

/** توقيع CMI: ترتيب المفاتيح أبجديًا ثم دمج القيم بفاصلة منقوطة ثم SHA-512/Base64 */
function cmiHash(fields: Record<string, string>, storeKey: string) {
  const keys = Object.keys(fields)
    .filter((k) => !["hash", "encoding"].includes(k.toLowerCase()))
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

  const escaped = keys.map((k) =>
    String(fields[k] ?? "")
      .replace(/\\/g, "\\\\")
      .replace(/\|/g, "\\|"),
  );
  const plain = `${escaped.join("|")}|${storeKey
    .replace(/\\/g, "\\\\")
    .replace(/\|/g, "\\|")}`;

  return crypto.createHash("sha512").update(plain, "utf8").digest("base64");
}

export const cmiProvider: PaymentProvider = {
  id: "cmi",
  label: "بطاقة بنكية (CMI)",
  description: "الدفع ببطاقة Visa / Mastercard عبر بوابة CMI الآمنة",
  icon: "card",

  isConfigured() {
    const c = config();
    return Boolean(c.clientId && c.storeKey);
  },

  async createCheckout(input: CheckoutInput): Promise<CheckoutResult> {
    const c = config();
    if (!c.clientId || !c.storeKey) throw new PaymentConfigError("CMI");

    const fields: Record<string, string> = {
      clientid: c.clientId,
      storetype: "3D_PAY_HOSTING",
      trantype: "PreAuth",
      amount: (input.payment.amountCents / 100).toFixed(2),
      currency: input.payment.currency === "MAD" ? "504" : "504",
      oid: input.payment.reference,
      okUrl: input.successUrl,
      failUrl: input.cancelUrl,
      callbackUrl: input.webhookUrl,
      lang: "ar",
      rnd: crypto.randomBytes(8).toString("hex"),
      hashAlgorithm: "ver3",
      encoding: "UTF-8",
      BillToName: input.user.name,
      email: input.user.email,
      tel: input.user.phone ?? "",
    };

    fields.hash = cmiHash(fields, c.storeKey);

    return { mode: "form", url: c.baseUrl, fields, providerRef: fields.oid };
  },

  async handleWebhook(req: Request): Promise<WebhookResult> {
    const c = config();
    const form = await req.formData();
    const body: Record<string, string> = {};
    form.forEach((v, k) => (body[k] = String(v)));

    // التحقّق من صحّة التوقيع القادم من CMI
    if (c.storeKey) {
      const received = body.HASH ?? body.hash ?? "";
      const { HASH, hash, ...rest } = body;
      void HASH;
      void hash;
      const expected = cmiHash(rest, c.storeKey);
      if (received !== expected) throw new Error("توقيع غير صالح لإشعار CMI");
    }

    const ok = body.ProcReturnCode === "00" || body.Response === "Approved";

    return {
      reference: body.oid ?? null,
      providerRef: body.TransId ?? null,
      status: ok ? "paid" : "failed",
      raw: body,
    };
  },
};
