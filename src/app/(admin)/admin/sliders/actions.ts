"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { saveUpload, UploadError } from "@/lib/storage";
import { ROLES } from "@/lib/constants";
import {
  isCtaTone,
  isPlacement,
  PER_VIEW_OPTIONS,
  SLIDER_ASPECTS,
} from "@/lib/sliders";
import type { AdminResult } from "../actions";

/**
 * إجراءات إدارة العارضات. كل إجراء يبدأ بـ guard() — لا اعتماد على
 * الـ middleware وحده.
 */

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) throw new Error("غير مصرّح لك بهذا الإجراء");
}

/** العارضات تظهر في الصفحة الرئيسية ولوحة الطالب، ولوحة الإدارة تعرضها */
function refresh(sliderId?: string) {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/admin/sliders");
  if (sliderId) revalidatePath(`/admin/sliders/${sliderId}`);
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const MAX_SLIDES = 30;

/**
 * رابط النقر على الصورة: صفحة داخلية (/checkout/START)، أو قسم (#plans)، أو
 * رابط خارجي آمن. نرفض ما عداها، وخاصّة javascript: التي تنفّذ كودًا.
 */
function cleanLink(raw: string): { ok: true; value: string | null } | { ok: false } {
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

/* ═══════════════════════ العارض نفسه ═══════════════════════ */

export async function createSliderAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const name = str(formData.get("name"));
  const placement = str(formData.get("placement"));
  if (name.length < 2) return { ok: false, message: "اكتب اسمًا للعارض (حرفان على الأقل)" };
  if (!isPlacement(placement)) return { ok: false, message: "اختر موضعًا من القائمة" };

  // الإطار الافتراضي بحسب الموضع: إعلانات اللوحة عريضة، والباقي ملصقات
  const isBanner = placement === "dashboard.top";
  const last = await db.slider.findFirst({
    where: { placement },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  const slider = await db.slider.create({
    data: {
      name,
      placement,
      order: (last?.order ?? -1) + 1,
      perView: isBanner ? 1 : 2,
      aspect: isBanner ? "banner" : "poster",
      intervalMs: isBanner ? 4000 : 2000,
    },
  });
  refresh();
  redirect(`/admin/sliders/${slider.id}?created=1`);
}

export async function saveSliderAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));
  const name = str(formData.get("name"));
  const placement = str(formData.get("placement"));
  const perView = Number(formData.get("perView"));
  const intervalS = Number(formData.get("intervalS"));
  const aspect = str(formData.get("aspect"));
  const order = Number(formData.get("order"));

  if (name.length < 2) return { ok: false, message: "اكتب اسمًا للعارض" };
  if (!isPlacement(placement)) return { ok: false, message: "اختر موضعًا من القائمة" };
  if (!PER_VIEW_OPTIONS.includes(perView as (typeof PER_VIEW_OPTIONS)[number])) {
    return { ok: false, message: "عدد الصور الظاهرة معًا بين ١ و٤" };
  }
  if (!Number.isFinite(intervalS) || intervalS < 1 || intervalS > 15) {
    return { ok: false, message: "مدّة الانتقال بين ١ و١٥ ثانية" };
  }
  if (!SLIDER_ASPECTS.some((a) => a.key === aspect)) {
    return { ok: false, message: "اختر شكل الإطار من القائمة" };
  }

  // زرّ الدعوة: نصّ ورابط معًا أو لا شيء — زرّ بلا رابط لا يفعل شيئًا
  const ctaLabel = str(formData.get("ctaLabel"));
  const ctaRaw = str(formData.get("ctaUrl"));
  const ctaTone = str(formData.get("ctaTone")) || "brand";
  const ctaNote = str(formData.get("ctaNote"));
  if (Boolean(ctaLabel) !== Boolean(ctaRaw)) {
    return { ok: false, message: "أكمل نصّ الزرّ ورابطه معًا، أو اتركهما فارغين لعارض بلا زرّ" };
  }
  if (ctaLabel.length > 40) return { ok: false, message: "نصّ الزرّ طويل — ٤٠ حرفًا على الأكثر" };
  if (ctaNote.length > 90) return { ok: false, message: "السطر تحت الزرّ طويل — ٩٠ حرفًا على الأكثر" };
  if (!isCtaTone(ctaTone)) return { ok: false, message: "اختر لون الزرّ من القائمة" };
  const ctaUrl = cleanLink(ctaRaw);
  if (!ctaUrl.ok) {
    return {
      ok: false,
      message: "رابط الزرّ غير صالح — مسار يبدأ بـ / (مثل ‎/checkout/START) أو ‎#plans أو رابط يبدأ بـ https://",
    };
  }

  const exists = await db.slider.findUnique({ where: { id }, select: { id: true } });
  if (!exists) return { ok: false, message: "العارض غير موجود — ربما حُذف" };

  await db.slider.update({
    where: { id },
    data: {
      name,
      title: str(formData.get("title")) || null,
      placement,
      order: Number.isFinite(order) ? Math.round(order) : 0,
      perView,
      intervalMs: Math.round(intervalS * 1000),
      aspect,
      autoplay: formData.get("autoplay") === "on",
      isActive: formData.get("isActive") === "on",
      ctaLabel: ctaLabel || null,
      ctaUrl: ctaUrl.value,
      ctaTone,
      ctaNote: ctaNote || null,
    },
  });
  refresh(id);
  return { ok: true, message: "حُفظت إعدادات العارض — التغيير ظاهر في الموقع الآن" };
}

export async function toggleSliderAction(id: string): Promise<AdminResult> {
  await guard();
  const s = await db.slider.findUnique({ where: { id }, select: { isActive: true } });
  if (!s) return { ok: false, message: "العارض غير موجود" };
  await db.slider.update({ where: { id }, data: { isActive: !s.isActive } });
  refresh(id);
  return { ok: true, message: s.isActive ? "أُخفي العارض عن الزوّار" : "العارض ظاهر الآن" };
}

/** backToList: عند الحذف من صفحة العارض نفسه، فلا تبقى صفحة لما حُذف */
export async function deleteSliderAction(id: string, backToList = false): Promise<AdminResult> {
  await guard();
  // الصور تُحذف معه تلقائيًا (onDelete: Cascade)
  await db.slider.delete({ where: { id } }).catch(() => null);
  refresh();
  if (backToList) redirect("/admin/sliders");
  return { ok: true, message: "حُذف العارض" };
}

/* ═══════════════════════ الصور ═══════════════════════ */

/**
 * إضافة صورة واحدة: ملف مرفوع أو صورة من مكتبة الهوية.
 * المتصفّح يستدعيه لكل ملف على حدة: رفع عدّة صور في طلب واحد كان سيتجاوز
 * حدّ حجم الطلب (١٠ ميغابايت) بثلاث صور كبيرة فقط.
 */
export async function addSlideAction(sliderId: string, formData: FormData): Promise<AdminResult> {
  await guard();
  const slider = await db.slider.findUnique({
    where: { id: sliderId },
    select: { _count: { select: { slides: true } } },
  });
  if (!slider) return { ok: false, message: "العارض غير موجود" };
  if (slider._count.slides >= MAX_SLIDES) {
    return { ok: false, message: `الحدّ الأقصى ${MAX_SLIDES} صورة في العارض الواحد` };
  }

  let imageUrl = "";
  let alt = str(formData.get("alt"));
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      imageUrl = (await saveUpload(file, "sliders")).url;
    } catch (error) {
      if (!(error instanceof UploadError)) console.error("[sliders] فشل حفظ الصورة:", error);
      return {
        ok: false,
        message: `${file.name}: ${error instanceof UploadError ? error.message : "تعذّر الرفع"}`,
      };
    }
    // اسم الملف بلا امتداد وصفٌ مبدئي أفضل من لا شيء لقارئ الشاشة
    alt ||= file.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ").slice(0, 120);
  } else {
    // مكتبة الهوية: مسارات داخل /brand فقط، لا روابط خارجية عشوائية
    const pick = str(formData.get("pick"));
    if (!/^\/brand\/[\w.-]+$/.test(pick)) return { ok: false, message: "اختر صورة أو ارفع ملفًا" };
    imageUrl = pick;
  }

  const last = await db.slide.findFirst({
    where: { sliderId },
    orderBy: { order: "desc" },
    select: { order: true },
  });
  await db.slide.create({
    data: { sliderId, imageUrl, alt, order: (last?.order ?? -1) + 1 },
  });
  refresh(sliderId);
  return { ok: true, message: "أُضيفت الصورة" };
}

export async function updateSlideAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));
  const link = cleanLink(str(formData.get("linkUrl")));
  if (!link.ok) {
    return {
      ok: false,
      message: "الرابط غير صالح — اكتب مسارًا يبدأ بـ / (مثل ‎/checkout/START) أو رابطًا يبدأ بـ https://",
    };
  }
  const slide = await db.slide
    .update({
      where: { id },
      data: { alt: str(formData.get("alt")).slice(0, 200), linkUrl: link.value },
      select: { sliderId: true },
    })
    .catch(() => null);
  if (!slide) return { ok: false, message: "الصورة غير موجودة — ربما حُذفت" };
  refresh(slide.sliderId);
  return { ok: true, message: "حُفظ" };
}

export async function deleteSlideAction(id: string): Promise<AdminResult> {
  await guard();
  const slide = await db.slide.delete({ where: { id }, select: { sliderId: true } }).catch(() => null);
  if (!slide) return { ok: false, message: "الصورة غير موجودة" };
  refresh(slide.sliderId);
  return { ok: true, message: "حُذفت الصورة" };
}

/**
 * ترتيب جديد كامل (من السحب والإفلات أو من زرَّي التقديم والتأخير).
 * نقبل القائمة فقط إن طابقت صور العارض تمامًا، كي لا يُفسد طلبٌ قديم —
 * أُرسل قبل حذف صورة أو إضافة أخرى — الترتيبَ.
 */
export async function reorderSlidesAction(sliderId: string, ids: string[]): Promise<AdminResult> {
  await guard();
  const current = await db.slide.findMany({ where: { sliderId }, select: { id: true } });
  const known = new Set(current.map((s) => s.id));
  if (ids.length !== known.size || new Set(ids).size !== ids.length || !ids.every((id) => known.has(id))) {
    return { ok: false, message: "تغيّرت الصور أثناء الترتيب — حدّث الصفحة وأعد المحاولة" };
  }
  await db.$transaction(ids.map((id, order) => db.slide.update({ where: { id }, data: { order } })));
  refresh(sliderId);
  return { ok: true, message: "حُفظ الترتيب" };
}
