import { toEmbed } from "@/lib/video";
import { SECTION_DEFS, surfaceOf, type BottomSpace, type SectionType, type Surface } from "@/lib/sections/registry";
import type { PageSectionView } from "@/lib/sections/server";
import {
  AboutSection,
  CurriculumSection,
  FaqSection,
  FeaturesSection,
  FinalSection,
  HeroSection,
  LearnSection,
  PlansSection,
  StepsSection,
  VideoSection,
} from "./builtin";
import { CardsSection, TestimonialsSection, TextImageSection, TextSection, VideoEmbedSection } from "./custom";
import { str, type SectionContext } from "./shared";

export type { SectionContext } from "./shared";

/**
 * هل يظهر القسم فعلًا؟ الفيديو بلا رابط لا يُرسم. يلزم معرفة ذلك قبل الرسم:
 * ما يوضع بعد القسم (سلايدر، زرّ) يأخذ لونه وهامشه من آخر قسم ظاهر.
 */
export function willRender(s: PageSectionView, ctx: SectionContext): boolean {
  if (!s.isVisible) return false;
  if (s.type === "video") return ctx.introEmbed.kind !== "none";
  if (s.type === "videoEmbed") return toEmbed(str(s.values.url)).kind !== "none";
  return true;
}

/** لون القسم وهامشه السفلي — لتنسيق ما يليه */
export function sectionMeta(s: PageSectionView): { surface: Surface; bottom: BottomSpace; type: SectionType } {
  return { surface: surfaceOf(s.type, s.values), bottom: SECTION_DEFS[s.type].bottom, type: s.type };
}

export function RenderSection({
  section,
  ctx,
  prevType,
}: {
  section: PageSectionView;
  ctx: SectionContext;
  /** نوع آخر قسم ظاهر قبله — شريط المزايا يلتصق بالواجهة الأولى إن تلاها */
  prevType?: SectionType;
}) {
  const props = { v: section.values, ctx, anchor: section.anchor };
  switch (section.type) {
    case "hero":
      return <HeroSection {...props} />;
    case "features":
      return <FeaturesSection {...props} afterHero={prevType === "hero"} />;
    case "video":
      return <VideoSection {...props} />;
    case "about":
      return <AboutSection {...props} />;
    case "learn":
      return <LearnSection {...props} />;
    case "curriculum":
      return <CurriculumSection {...props} />;
    case "steps":
      return <StepsSection {...props} />;
    case "plans":
      return <PlansSection {...props} />;
    case "faq":
      return <FaqSection {...props} />;
    case "final":
      return <FinalSection {...props} />;
    case "text":
      return <TextSection {...props} />;
    case "textImage":
      return <TextImageSection {...props} />;
    case "cards":
      return <CardsSection {...props} />;
    case "testimonials":
      return <TestimonialsSection {...props} />;
    case "videoEmbed":
      return <VideoEmbedSection {...props} />;
  }
}
