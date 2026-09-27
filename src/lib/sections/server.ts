import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";
import { getSettings, setSetting } from "@/lib/settings";
import { cleanLink, LINK_HINT } from "@/lib/links";
import {
  APP_PLACEMENTS,
  IN_ABOUT,
  IN_HERO,
  afterSection,
  type BlockKind,
  type PlacementOption,
} from "@/lib/placements";
import {
  DEFAULT_LAYOUT,
  ICON_KEYS,
  SECTION_DEFS,
  anchorOf,
  isSectionType,
  mergeValues,
  sectionName,
  type FieldDef,
  type SectionType,
  type SectionValues,
} from "./registry";

/**
 * أقسام الصفحة الرئيسية في قاعدة البيانات: إنشاؤها أوّل مرّة، قراءتها،
 * والتحقّق من محتواها قبل الحفظ.
 */

export type PageSectionView = {
  id: string;
  type: SectionType;
  order: number;
  isVisible: boolean;
  /** قسم أصلي أو نوع لا يتكرّر — رابطه ثابت (#about) */
  isOriginal: boolean;
  values: SectionValues;
  anchor: string;
  name: string;
};

const parseData = (raw: string): SectionValues => {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === "object" && !Array.isArray(v) ? (v as SectionValues) : {};
  } catch {
    return {};
  }
};

/** أماكن العارضات والأزرار القديمة (قبل أن تصير الأقسام قابلة للترتيب) ← القسم الذي كانت بعده */
const LEGACY_PLACEMENTS: Record<string, SectionType> = {
  "home.top": "features",
  "home.afterVideo": "video",
  "home.afterAbout": "about",
  "home.afterLearn": "learn",
  "home.afterCurriculum": "curriculum",
  "home.afterSteps": "steps",
  "home.afterPlans": "plans",
  "home.afterFaq": "faq",
};

/**
 * أوّل تشغيل: تُنشأ أقسام الصفحة بترتيبها ومحتواها الأصليَّين، وتُربط العارضات
 * والأزرار الموجودة بالأقسام التي كانت بعدها — فلا يتغيّر شيء في الموقع.
 *
 * آمن عند تزامن طلبين: المفتاح الفريد (page, key) يمنع تكرار الأقسام الأصلية،
 * ونقل الأماكن يُعاد دون ضرر.
 */
export async function ensureDefaultSections() {
  const settings = await getSettings();
  if ((settings as unknown as Record<string, unknown>)["sections.initialized"] === true) return;

  if ((await db.pageSection.count({ where: { page: "home" } })) === 0) {
    const heroImage = settings["site.heroImage"];
    for (const [order, type] of DEFAULT_LAYOUT.entries()) {
      // صورة الأستاذ كانت تُضبط من «الواجهة»: تُنقل كما هي
      const data = type === "hero" && heroImage ? { image: heroImage } : {};
      await db.pageSection
        .create({ data: { page: "home", key: type, type, order, data: JSON.stringify(data) } })
        .catch(() => null);
    }
  }

  const originals = await db.pageSection.findMany({ where: { page: "home", key: { not: null } } });
  for (const [legacy, type] of Object.entries(LEGACY_PLACEMENTS)) {
    const section = originals.find((s) => s.key === type);
    if (!section) continue;
    const placement = afterSection(section.id);
    await db.slider.updateMany({ where: { placement: legacy }, data: { placement } });
    await db.siteButton.updateMany({ where: { placement: legacy }, data: { placement } });
  }

  await setSetting("sections.initialized", true, "site");
}

function toView(row: {
  id: string;
  type: string;
  order: number;
  isVisible: boolean;
  key: string | null;
  data: string;
}): PageSectionView | null {
  if (!isSectionType(row.type)) return null;
  const values = mergeValues(row.type, parseData(row.data));
  const isOriginal = row.key !== null;
  return {
    id: row.id,
    type: row.type,
    order: row.order,
    isVisible: row.isVisible,
    isOriginal,
    values,
    anchor: anchorOf(row.type, row.id, isOriginal),
    name: sectionName(row.type, values),
  };
}

/**
 * أقسام الصفحة الرئيسية بترتيبها (المخفية معها). مخزّنة لمدّة الطلب: الترويسة
 * والصفحة تقرآنها معًا باستعلام واحد.
 *
 * إن تعذّرت قراءة القاعدة: الترتيب الأصلي بمحتواه الافتراضي، فلا تظهر الصفحة فارغة.
 */
export const getHomeSections = cache(async (): Promise<PageSectionView[]> => {
  await ensureDefaultSections().catch(() => {});
  const rows = await db.pageSection
    .findMany({ where: { page: "home" }, orderBy: [{ order: "asc" }, { createdAt: "asc" }] })
    .catch(() => []);
  if (!rows.length) {
    return DEFAULT_LAYOUT.map((type, order) =>
      toView({ id: `default-${type}`, type, order, isVisible: true, key: type, data: "{}" }),
    ).filter((s): s is PageSectionView => s !== null);
  }
  return rows.map(toView).filter((s): s is PageSectionView => s !== null);
});

export async function getSection(id: string): Promise<PageSectionView | null> {
  const row = await db.pageSection.findUnique({ where: { id } });
  return row ? toView(row) : null;
}

/* ───────────────────────────── التحقّق ───────────────────────────── */

export class SectionInputError extends Error {}

/** سطر واحد: بلا محارف تحكّم ولا أسطر جديدة */
const oneLine = (v: unknown) =>
  String(v ?? "")
    .replace(/[\u0000-\u001f\u007f]+/g, " ")
    .trim();

/** نصّ متعدّد الأسطر: تبقى الأسطر، وتُزال محارف التحكّم الأخرى */
const multiLine = (v: unknown) =>
  String(v ?? "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

/** صور المنصّة وحدها: المرفوعة (/uploads) وصور الهوية (/brand) — لا روابط خارجية */
const IMAGE_PATH = /^\/(uploads|brand)\/[\w./%-]+$/;

function sanitizeFields(fields: FieldDef[], raw: unknown, path: string): SectionValues {
  const src = raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  const out: SectionValues = {};
  for (const f of fields) {
    const v = src[f.name];
    const where = `${path}«${f.label}»`;
    switch (f.kind) {
      case "text":
        out[f.name] = oneLine(v).slice(0, f.max ?? 200);
        break;
      case "textarea":
        out[f.name] = multiLine(v).slice(0, f.max ?? 3000);
        break;
      case "link": {
        const s = oneLine(v);
        if (!s) {
          out[f.name] = "";
          break;
        }
        const link = cleanLink(s);
        if (!link.ok || !link.value) throw new SectionInputError(`${where}: الرابط غير صالح — ${LINK_HINT}`);
        out[f.name] = link.value;
        break;
      }
      case "image": {
        const s = oneLine(v);
        if (s && !IMAGE_PATH.test(s)) throw new SectionInputError(`${where}: صورة غير صالحة — ارفعها من جهازك أو اخترها من صور الهوية`);
        out[f.name] = s;
        break;
      }
      case "select": {
        const s = oneLine(v);
        out[f.name] = f.options.some((o) => o.value === s) ? s : f.options[0].value;
        break;
      }
      case "icon": {
        const s = oneLine(v);
        out[f.name] = (ICON_KEYS as readonly string[]).includes(s) ? s : "sparkle";
        break;
      }
      case "list": {
        const items = Array.isArray(v) ? v : [];
        if (f.max && items.length > f.max) throw new SectionInputError(`${where}: الحدّ الأقصى ${f.max}`);
        if (f.min && items.length < f.min) {
          throw new SectionInputError(`${where}: يلزم ${f.min === 1 ? `${f.itemLabel} واحد` : `${f.min}`} على الأقلّ`);
        }
        out[f.name] = items.map((item, i) => sanitizeFields(f.fields, item, `${where} ${i + 1} ← `));
        break;
      }
    }
  }
  return out;
}

/** قيم قسم كما أرسلها المحرّر ← قيم نظيفة للحفظ؛ يرمي SectionInputError برسالة للمدير */
export function sanitizeSection(type: SectionType, raw: unknown): SectionValues {
  return sanitizeFields(SECTION_DEFS[type].fields, raw, "");
}

/* ─────────────────────── أماكن العارضات والأزرار ─────────────────────── */

/**
 * الأماكن المتاحة بترتيب ظهورها في الموقع: بعد كل قسم من أقسام الصفحة
 * الرئيسية (والمخفيّ منها موسوم)، وداخل الواجهة الأولى و«عن البرنامج»، ثم
 * لوحة الطالب وصفحة الدرس.
 */
export async function getPlacementOptions(kind: BlockKind): Promise<PlacementOption[]> {
  const sections = await getHomeSections();
  const options: PlacementOption[] = [];
  for (const s of sections) {
    const hidden = s.isVisible ? "" : " (القسم مخفي حاليًا)";
    if (s.type === "hero") {
      if (kind === "button") {
        options.push({
          key: IN_HERO,
          label: `الصفحة الرئيسية — داخل «${s.name}»، تحت زرَّي البداية${hidden}`,
          dark: true,
        });
      }
      // لا مكان «بعد الواجهة الأولى»: شريط المزايا ملتصق بأسفلها
      continue;
    }
    if (s.type === "about") {
      options.push({ key: IN_ABOUT, label: `الصفحة الرئيسية — داخل «${s.name}»${hidden}` });
    }
    options.push({ key: afterSection(s.id), label: `الصفحة الرئيسية — بعد «${s.name}»${hidden}` });
  }
  return [...options, ...APP_PLACEMENTS];
}

/** اسم المكان لعرضه في لوحة الإدارة، مع تنبيه إن لم يعد موجودًا */
export function placementLabelFrom(options: PlacementOption[], key: string) {
  return options.find((o) => o.key === key)?.label ?? "⚠ مكان لم يعد موجودًا — اختر له مكانًا جديدًا";
}

export const placementRankFrom = (options: PlacementOption[], key: string) => {
  const i = options.findIndex((o) => o.key === key);
  return i === -1 ? options.length : i;
};
