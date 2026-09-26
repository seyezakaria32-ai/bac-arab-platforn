/**
 * رابط يُدخله المدير (صورة في عارض، زرّ دعوة): صفحة داخلية (/checkout/START)،
 * أو قسم (#plans)، أو رابط خارجي آمن. نرفض ما عداها، وخاصّة javascript: التي
 * تنفّذ كودًا عند النقر.
 */
export function cleanLink(raw: string): { ok: true; value: string | null } | { ok: false } {
  if (!raw) return { ok: true, value: null };
  if (/^(\/(?!\/)|#)/.test(raw)) return { ok: true, value: raw };
  try {
    const u = new URL(raw);
    if (u.protocol === "https:" || u.protocol === "http:") return { ok: true, value: u.toString() };
  } catch {
    /* ليس رابطًا صالحًا */
  }
  return { ok: false };
}

export const LINK_HINT =
  "مسار يبدأ بـ / (مثل ‎/checkout/START)، أو ‎#plans للباقات، أو رابط كامل يبدأ بـ https://";
