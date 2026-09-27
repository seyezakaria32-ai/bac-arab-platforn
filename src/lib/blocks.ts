import "server-only";
import { db } from "@/lib/db";
import { getSlidersByPlacement, isCtaTone, type SliderCta, type SliderView } from "@/lib/sliders";

/**
 * كل ما يُدار من لوحة الإدارة ويوضع في مواضع الموقع: العارضات والأزرار،
 * محمّلة معًا ومرتّبة في كل موضع بحقل order المشترك.
 */

export type ButtonView = { id: string; order: number; title: string | null; cta: SliderCta };

export type Block =
  | ({ kind: "slider" } & SliderView)
  | ({ kind: "button" } & ButtonView);

/** المفتاح مكان: home.after:<id>، home.hero، dashboard.top… */
export type BlocksByPlacement = Record<string, Block[] | undefined>;

export async function getBlocksByPlacement(
  prefix: "home" | "dashboard" | "lesson",
): Promise<BlocksByPlacement> {
  const [sliders, buttons] = await Promise.all([
    getSlidersByPlacement(prefix),
    db.siteButton
      .findMany({
        where: { isActive: true, placement: { startsWith: `${prefix}.` } },
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      })
      // قاعدة لم يُنشأ فيها الجدول بعد: الموقع يعمل بلا أزرار بدل أن يسقط
      .catch(() => []),
  ]);

  const out: BlocksByPlacement = {};
  for (const [key, list] of Object.entries(sliders)) {
    out[key] = list.map((s) => ({ kind: "slider" as const, ...s }));
  }
  for (const b of buttons) {
    (out[b.placement] ??= []).push({
      kind: "button",
      id: b.id,
      order: b.order,
      title: b.title,
      cta: {
        label: b.label,
        href: b.url,
        tone: isCtaTone(b.tone) ? b.tone : "brand",
        note: b.note,
      },
    });
  }
  // الأصغر أوّلًا؛ عند التساوي العارض قبل الزرّ (الزرّ غالبًا دعوة بعد ما يُعرض)
  for (const list of Object.values(out)) {
    list?.sort((a, b) => a.order - b.order || (a.kind === b.kind ? 0 : a.kind === "slider" ? -1 : 1));
  }
  return out;
}

/** فصل نوعَي موضع «عن البرنامج»: العارض بجانب النص، والزرّ تحته */
export function splitBlocks(blocks: Block[] | undefined) {
  return {
    sliders: blocks?.filter((b) => b.kind === "slider") ?? [],
    buttons: blocks?.filter((b) => b.kind === "button") ?? [],
  };
}
