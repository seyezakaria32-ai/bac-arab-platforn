import { headers } from "next/headers";

/**
 * عنوان الموقع العامّ.
 *
 * لماذا لا نقرأ process.env.NEXT_PUBLIC_SITE_URL مباشرة: Next يستبدل
 * متغيّرات NEXT_PUBLIC_ بقيمتها **وقت البناء**. إن لم تكن مضبوطة حينها يبقى
 * "http://localhost:3000" محفورًا في الكود المنشور، ولا يصلحه ضبطها لاحقًا.
 * هذا ما حدث: صورة المشاركة وخريطة الموقع وروابط العودة من الدفع وإشعار
 * Bictorys كلّها كانت تشير إلى localhost، فلا يُفعَّل أيّ اشتراك بعد الدفع.
 * القراءة بمفتاح ديناميكي تجعلها تُقرأ وقت التشغيل.
 */

const PRODUCTION_URL = "https://bacarabesenegal.com";

const readEnv = (key: string) =>
  (process.env[key] ?? "")
    .trim()
    .replace(/^(["'])(.*)\1$/, "$2")
    .replace(/\/+$/, "");

const isLocal = (url: string) => /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(url);

/** للبيانات الثابتة (صورة المشاركة، خريطة الموقع): المتغيّر أو نطاق الإنتاج */
export function siteUrl(): string {
  for (const key of ["SITE_URL", "NEXT_PUBLIC_SITE_URL"]) {
    const v = readEnv(key);
    if (/^https?:\/\//i.test(v) && !(process.env.NODE_ENV === "production" && isLocal(v))) {
      return v;
    }
  }
  return process.env.NODE_ENV === "production" ? PRODUCTION_URL : "http://localhost:3000";
}

/**
 * لروابط تُبنى أثناء طلب (العودة من الدفع، الإشعار): المتغيّر إن ضُبط، وإلا
 * العنوان الذي فتح منه الطالبُ الموقع — فهو قابل للوصول بالضرورة، ويعمل
 * كذلك على رابط railway.app ومحلّيًا.
 */
export async function requestOrigin(): Promise<string> {
  const configured = readEnv("SITE_URL") || readEnv("NEXT_PUBLIC_SITE_URL");
  if (/^https?:\/\//i.test(configured) && !isLocal(configured)) return configured;

  const h = await headers();
  const host = (h.get("x-forwarded-host") ?? h.get("host") ?? "").split(",")[0].trim();
  if (host && /^[a-z0-9.-]+(:\d+)?$/i.test(host)) {
    const proto =
      (h.get("x-forwarded-proto") ?? "").split(",")[0].trim() ||
      (host.startsWith("localhost") || host.startsWith("127.") ? "http" : "https");
    return `${proto}://${host}`;
  }
  return siteUrl();
}
