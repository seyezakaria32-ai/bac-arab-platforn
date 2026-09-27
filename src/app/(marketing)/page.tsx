import { Fragment } from "react";
import { BlockSlot } from "@/components/marketing/BlockSlot";
import { RenderSection, sectionMeta, willRender } from "@/components/sections";
import { ensureDefaultSlider } from "@/lib/sliders";
import { getHomeSections } from "@/lib/sections/server";
import { getSectionContext } from "@/lib/sections/context";
import { afterSection } from "@/lib/placements";

export const dynamic = "force-dynamic";

/**
 * الصفحة الرئيسية: أقسامها وترتيبها ومحتواها تُدار من لوحة الإدارة ← تصميم
 * الموقع. بعد كل قسم مكانٌ لما يضعه المدير من سلايدر أو أزرار؛ يأخذ لونه
 * وهامشه من آخر قسم ظاهر قبله — فيبقى متناسقًا مهما رُتّبت الأقسام أو أُخفيت.
 */
export default async function LandingPage() {
  await ensureDefaultSlider().catch(() => {});
  const [sections, ctx] = await Promise.all([getHomeSections(), getSectionContext()]);

  let prev: ReturnType<typeof sectionMeta> | undefined;
  return (
    <>
      {sections.map((s) => {
        const shown = willRender(s, ctx);
        const prevType = prev?.type;
        if (shown) prev = sectionMeta(s);
        return (
          <Fragment key={s.id}>
            {shown && <RenderSection section={s} ctx={ctx} prevType={prevType} />}
            {/* ما بعد قسم مخفي يبقى في مكانه، ملاصقًا لآخر قسم ظاهر */}
            <BlockSlot blocks={ctx.blocks[afterSection(s.id)]} after={prev && { surface: prev.surface, bottom: prev.bottom }} />
          </Fragment>
        );
      })}
    </>
  );
}
