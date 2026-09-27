"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";
import { setSetting } from "@/lib/settings";
import { saveUpload, UploadError } from "@/lib/storage";
import { normalizeFonts } from "@/lib/fonts";
import { IN_ABOUT, IN_HERO, afterSection } from "@/lib/placements";
import {
  DEFAULT_LAYOUT,
  SECTION_DEFS,
  isSectionType,
  mergeValues,
  sectionName,
  type SectionValues,
} from "@/lib/sections/registry";
import { SectionInputError, sanitizeSection } from "@/lib/sections/server";
import type { AdminResult } from "../actions";

/**
 * إجراءات «تصميم الموقع». كل إجراء يبدأ بـ guard() — لا اعتماد على
 * الـ middleware وحده.
 */

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) throw new Error("غير مصرّح لك بهذا الإجراء");
}

/** الأقسام تبني الصفحة الرئيسية وقائمتها، والخطوط تمسّ كل الصفحات */
function refresh() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/design");
}

const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();

const parseData = (raw: string): SectionValues => {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
};

async function orderedSections() {
  return db.pageSection.findMany({
    where: { page: "home" },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
}

/* ═══════════════════════ محتوى قسم ═══════════════════════ */

export type SaveSectionResult = { ok: boolean; message: string; values?: SectionValues };

export async function saveSectionAction(id: string, values: unknown): Promise<SaveSectionResult> {
  await guard();
  const row = await db.pageSection.findUnique({ where: { id } });
  if (!row || !isSectionType(row.type)) return { ok: false, message: "القسم غير موجود — ربما حُذف" };

  let clean: SectionValues;
  try {
    clean = sanitizeSection(row.type, values);
  } catch (error) {
    if (error instanceof SectionInputError) return { ok: false, message: error.message };
    throw error;
  }

  await db.pageSection.update({ where: { id }, data: { data: JSON.stringify(clean) } });
  refresh();
  return { ok: true, message: "حُفظ — التغيير ظاهر في الموقع الآن", values: mergeValues(row.type, clean) };
}

/** العودة إلى المحتوى الأصلي للقسم (النصوص والصور الافتراضية) */
export async function resetSectionAction(id: string): Promise<SaveSectionResult> {
  await guard();
  const row = await db.pageSection.findUnique({ where: { id } });
  if (!row || !isSectionType(row.type)) return { ok: false, message: "القسم غير موجود" };
  await db.pageSection.update({ where: { id }, data: { data: "{}" } });
  refresh();
  return { ok: true, message: "عاد القسم إلى محتواه الأصلي", values: mergeValues(row.type, {}) };
}

/* ═══════════════════════ ترتيب الأقسام ═══════════════════════ */

export async function toggleSectionAction(id: string): Promise<AdminResult> {
  await guard();
  const row = await db.pageSection.findUnique({ where: { id }, select: { isVisible: true } });
  if (!row) return { ok: false, message: "القسم غير موجود" };
  await db.pageSection.update({ where: { id }, data: { isVisible: !row.isVisible } });
  refresh();
  return { ok: true, message: row.isVisible ? "أُخفي القسم عن الزوّار" : "القسم ظاهر الآن" };
}

/**
 * ترتيب كامل جديد. نقبله فقط إن طابق أقسام الصفحة تمامًا، كي لا يُفسد طلبٌ
 * قديم — أُرسل قبل حذف قسم أو إضافة آخر — الترتيبَ.
 */
export async function reorderSectionsAction(ids: string[]): Promise<AdminResult> {
  await guard();
  const current = await orderedSections();
  const known = new Set(current.map((s) => s.id));
  if (ids.length !== known.size || new Set(ids).size !== ids.length || !ids.every((id) => known.has(id))) {
    return { ok: false, message: "تغيّرت الأقسام أثناء الترتيب — حدّث الصفحة وأعد المحاولة" };
  }
  await db.$transaction(ids.map((id, order) => db.pageSection.update({ where: { id }, data: { order } })));
  refresh();
  return { ok: true, message: "حُفظ الترتيب" };
}

/**
 * إضافة قسم بمحتواه الافتراضي، بعد قسم محدّد أو في آخر الصفحة. الأنواع التي
 * لا تتكرّر (الواجهة الأولى، الباقات…) تُضاف فقط إن لم تكن في الصفحة — مثلًا
 * بعد حذفها — وتستعيد رابطها الثابت (#plans).
 */
const START = "__start";

export async function addSectionAction(type: string, afterId: string | null): Promise<AdminResult> {
  await guard();
  if (!isSectionType(type)) return { ok: false, message: "نوع قسم غير معروف" };
  const def = SECTION_DEFS[type];
  const sections = await orderedSections();
  if (!def.multiple && sections.some((s) => s.type === type)) {
    return { ok: false, message: `«${def.label}» موجود في الصفحة — أظهره إن كان مخفيًا` };
  }

  // afterId: "__start" = أعلى الصفحة، null = آخرها، وإلا بعد القسم المحدّد
  const found = afterId ? sections.findIndex((s) => s.id === afterId) : -1;
  const position = afterId === START ? 0 : found >= 0 ? found + 1 : sections.length;

  // المفتاح الثابت يعطي الرابط الأصلي (#faq، #plans). قسم أصلي حُذف ثم أُعيد
  // يستعيده، فتبقى الروابط القديمة إليه صالحة؛ ونسخة ثانية منه بلا مفتاح.
  const original = (DEFAULT_LAYOUT as readonly string[]).includes(type);
  const key = !def.multiple || (original && !sections.some((s) => s.key === type)) ? type : null;
  const created = await db.pageSection.create({
    data: { page: "home", type, key, order: position, data: "{}" },
  });
  const ids = sections.map((s) => s.id);
  ids.splice(position, 0, created.id);
  await db.$transaction(ids.map((id, order) => db.pageSection.update({ where: { id }, data: { order } })));

  refresh();
  return { ok: true, message: `أُضيف قسم «${def.label}» — عدّل محتواه الآن`, id: created.id };
}

/**
 * حذف قسم. ما كان بعده من سلايدر وأزرار (أو داخله: الواجهة الأولى و«عن
 * البرنامج») ينتقل إلى بعد القسم الذي قبله — لا يختفي من الموقع دون علم المدير.
 */
export async function deleteSectionAction(id: string): Promise<AdminResult> {
  await guard();
  const sections = await orderedSections();
  const index = sections.findIndex((s) => s.id === id);
  if (index === -1) return { ok: false, message: "القسم غير موجود" };
  const target = sections[index];

  // لا مكان «بعد الواجهة الأولى» — فالبديل أقرب قسم آخر قبله، وإلا بعده
  const others = (list: typeof sections) => list.find((s) => s.type !== "hero" && s.id !== id);
  const heir = others(sections.slice(0, index).reverse()) ?? others(sections.slice(index + 1));

  let moved = 0;
  if (heir) {
    const to = afterSection(heir.id);
    const from = [afterSection(id)];
    if (target.type === "about") from.push(IN_ABOUT);
    if (target.type === "hero") from.push(IN_HERO);
    for (const placement of from) {
      moved += (await db.slider.updateMany({ where: { placement }, data: { placement: to } })).count;
      moved += (await db.siteButton.updateMany({ where: { placement }, data: { placement: to } })).count;
    }
  }

  await db.pageSection.delete({ where: { id } });
  refresh();

  const heirName = heir && isSectionType(heir.type) ? sectionName(heir.type, mergeValues(heir.type, parseData(heir.data))) : "";
  return {
    ok: true,
    message: moved
      ? `حُذف القسم، ونُقل ما كان مرتبطًا به (${moved}) إلى بعد «${heirName}»`
      : "حُذف القسم",
  };
}

/* ═══════════════════════ صور الأقسام ═══════════════════════ */

export async function uploadSectionImageAction(
  formData: FormData,
): Promise<{ ok: boolean; message: string; url?: string }> {
  await guard();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "اختر صورة أولًا" };
  if (!file.type.startsWith("image/")) return { ok: false, message: "الملف ليس صورة — المسموح: JPG، PNG، WEBP" };
  try {
    const stored = await saveUpload(file, "site");
    return { ok: true, message: "رُفعت الصورة — احفظ القسم لتظهر في الموقع", url: stored.url };
  } catch (error) {
    if (error instanceof UploadError) return { ok: false, message: error.message };
    console.error("[design] فشل رفع صورة قسم:", error);
    return { ok: false, message: "تعذّر رفع الصورة" };
  }
}

/* ═══════════════════════ الخطوط والنصوص العامّة ═══════════════════════ */

export async function saveFontsAction(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  await guard();
  const choice = normalizeFonts({
    body: str(formData.get("body")),
    heading: str(formData.get("heading")),
    display: str(formData.get("display")),
    ui: str(formData.get("ui")),
  });
  await setSetting("theme.fonts", choice, "theme");
  refresh();
  return { ok: true, message: "حُفظت الخطوط — ظاهرة في كل صفحات الموقع الآن" };
}

export async function saveSiteTextsAction(_prev: AdminResult | null, formData: FormData): Promise<AdminResult> {
  await guard();
  const seoTitle = str(formData.get("seoTitle"));
  const seoDescription = str(formData.get("seoDescription")).replace(/\s+/g, " ");
  const footerText = str(formData.get("footerText")).replace(/\s+/g, " ");
  if (seoTitle.length < 5) return { ok: false, message: "اكتب عنوانًا للموقع (5 أحرف على الأقلّ)" };
  if (seoTitle.length > 120) return { ok: false, message: "عنوان الموقع طويل — 120 حرفًا على الأكثر" };
  if (seoDescription.length > 300) return { ok: false, message: "وصف الموقع طويل — 300 حرف على الأكثر" };
  if (footerText.length > 400) return { ok: false, message: "نصّ أسفل الصفحة طويل — 400 حرف على الأكثر" };
  await setSetting("site.seoTitle", seoTitle, "site");
  await setSetting("site.seoDescription", seoDescription, "site");
  await setSetting("site.footerText", footerText, "site");
  refresh();
  return { ok: true, message: "حُفظت النصوص العامّة" };
}
