"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { cleanLink, LINK_HINT } from "@/lib/links";
import { isPlacementFor } from "@/lib/placements";
import { isCtaTone } from "@/lib/sliders";
import type { AdminResult } from "../actions";

/**
 * أزرار الدعوة المستقلّة. كل إجراء يبدأ بـ guard() — لا اعتماد على
 * الـ middleware وحده.
 */

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) throw new Error("غير مصرّح لك بهذا الإجراء");
}

/** الأزرار تظهر في الصفحة الرئيسية ولوحة الطالب وصفحات الدروس */
function refresh() {
  revalidatePath("/");
  revalidatePath("/dashboard");
  revalidatePath("/learn", "layout");
  revalidatePath("/admin/buttons");
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

type ButtonData = {
  label: string;
  url: string;
  tone: string;
  title: string | null;
  note: string | null;
  placement: string;
  order: number;
};

/** تحقّق مشترك بين الإنشاء والتعديل */
function parse(formData: FormData): { ok: true; data: ButtonData } | { ok: false; message: string } {
  const label = str(formData.get("label"));
  const rawUrl = str(formData.get("url"));
  const tone = str(formData.get("tone")) || "brand";
  const title = str(formData.get("title"));
  const note = str(formData.get("note"));
  const placement = str(formData.get("placement"));
  const order = Number(formData.get("order") || 0);

  if (!label) return { ok: false, message: "اكتب نصّ الزرّ" };
  if (label.length > 40) return { ok: false, message: "نصّ الزرّ طويل — ٤٠ حرفًا على الأكثر" };
  if (!rawUrl) return { ok: false, message: "اكتب رابط الزرّ — إلى أين يذهب الزائر حين ينقره؟" };
  const url = cleanLink(rawUrl);
  if (!url.ok || !url.value) return { ok: false, message: `رابط الزرّ غير صالح — ${LINK_HINT}` };
  if (!isCtaTone(tone)) return { ok: false, message: "اختر لون الزرّ من القائمة" };
  if (title.length > 80) return { ok: false, message: "العنوان فوق الزرّ طويل — ٨٠ حرفًا على الأكثر" };
  if (note.length > 90) return { ok: false, message: "السطر تحت الزرّ طويل — ٩٠ حرفًا على الأكثر" };
  if (!isPlacementFor("button", placement)) return { ok: false, message: "اختر مكان الزرّ من القائمة" };
  if (!Number.isFinite(order)) return { ok: false, message: "الترتيب رقم صحيح" };

  return {
    ok: true,
    data: {
      label,
      url: url.value,
      tone,
      title: title || null,
      note: note || null,
      placement,
      order: Math.round(order),
    },
  };
}

export async function createButtonAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const parsed = parse(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  await db.siteButton.create({ data: parsed.data });
  refresh();
  return { ok: true, message: "أُضيف الزرّ — ظاهر في الموقع الآن" };
}

export async function saveButtonAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));
  const parsed = parse(formData);
  if (!parsed.ok) return { ok: false, message: parsed.message };
  const saved = await db.siteButton
    .update({ where: { id }, data: { ...parsed.data, isActive: formData.get("isActive") === "on" } })
    .catch(() => null);
  if (!saved) return { ok: false, message: "الزرّ غير موجود — ربما حُذف" };
  refresh();
  return { ok: true, message: "حُفظ الزرّ" };
}

export async function toggleButtonAction(id: string): Promise<AdminResult> {
  await guard();
  const b = await db.siteButton.findUnique({ where: { id }, select: { isActive: true } });
  if (!b) return { ok: false, message: "الزرّ غير موجود" };
  await db.siteButton.update({ where: { id }, data: { isActive: !b.isActive } });
  refresh();
  return { ok: true, message: b.isActive ? "أُخفي الزرّ" : "الزرّ ظاهر الآن" };
}

export async function deleteButtonAction(id: string): Promise<AdminResult> {
  await guard();
  await db.siteButton.delete({ where: { id } }).catch(() => null);
  refresh();
  return { ok: true, message: "حُذف الزرّ" };
}
