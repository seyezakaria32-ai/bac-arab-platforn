import { ImageSlider } from "@/components/marketing/ImageSlider";
import { CtaButton } from "@/components/marketing/CtaButton";
import { aspectCss } from "@/lib/sliders";
import type { Block } from "@/lib/blocks";
import type { BottomSpace, Surface } from "@/lib/sections/registry";
import { reveal } from "@/lib/reveal";

/**
 * موضع في الصفحة يُملأ من لوحة الإدارة بعارضات وأزرار. لا يرسم شيئًا إن
 * لم يُسنَد إليه شيء مفعّل، فالمواضع الفارغة لا تترك فراغًا في التصميم.
 *
 * bare: داخل قسم موجود (عمود «عن البرنامج»، الواجهة الأولى، لوحة الطالب) —
 * بلا حاوية ولا هوامش خاصّة به.
 */
export function BlockSlot({
  blocks,
  bare = false,
  align = "center",
  dark = false,
  after,
  className = "",
}: {
  blocks?: Block[];
  bare?: boolean;
  align?: "center" | "start";
  /** خلفية الموضع داكنة (الواجهة الأولى) */
  dark?: boolean;
  /**
   * القسم الظاهر قبل الموضع مباشرة: لونه وهامشه السفلي. الموضع يأخذ لونه
   * فيبدو امتدادًا له (زرّ بعد «الأسئلة الشائعة» على الأبيض لا في شريط كريمي
   * منفصل)، ويُسحب إلى داخل هامشه السفلي حتى لا يتراكم الهامشان (96px + 48px)
   * فيبدو الزرّ بعيدًا عمّا فوقه. بعد قسم بخلفية الهوية الداكنة يبدأ الموضع
   * بلون الصفحة وهوامشه العادية: التدرّج لا يتّصل بين عنصرين دون أن يظهر خطّ.
   */
  after?: { surface: Surface; bottom: BottomSpace };
  className?: string;
}) {
  if (!blocks?.length) return null;

  const heading = `font-display text-xl font-black sm:text-2xl ${dark ? "text-white" : "text-ink-900"}`;

  const content = blocks.map((b) =>
    b.kind === "slider" ? (
      <div key={`s-${b.id}`} {...reveal("zoom")}>
        {b.title && <h2 className={`mb-5 text-center ${heading}`}>{b.title}</h2>}
        <ImageSlider
          slides={b.slides}
          perView={b.perView}
          intervalMs={b.intervalMs}
          aspect={aspectCss(b.aspect)}
          autoplay={b.autoplay}
          mode={b.mode}
          label={b.title ?? "عارض صور"}
        />
        {b.cta && <CtaButton cta={b.cta} dark={dark} />}
      </div>
    ) : (
      <div
        key={`b-${b.id}`}
        {...reveal("zoom")}
        className={align === "start" ? "text-start" : "text-center"}
      >
        {b.title && <h2 className={heading}>{b.title}</h2>}
        <CtaButton cta={b.cta} align={align} dark={dark} className={b.title ? "mt-5" : ""} />
      </div>
    ),
  );

  if (bare) return <div className={`space-y-10 ${className}`}>{content}</div>;

  // زرّ وحده لا يحتاج هوامش قسم كامل
  const onlyButtons = blocks.every((b) => b.kind === "button");
  // الخلفية على عرض الصفحة كاملًا، والمحتوى داخل الحاوية
  const joins = after && after.surface !== "brand";
  const white = joins && after.surface === "white";
  // مقدار السحب بحسب هامش القسم السابق: 80/96px ← نتركه 40px، و64px ← 40px
  const pull = !joins
    ? ""
    : after.bottom === "lg"
      ? "-mt-10 md:-mt-14"
      : after.bottom === "md"
        ? "-mt-6"
        : "";
  const top = pull ? "pt-0" : onlyButtons ? "pt-10 md:pt-12" : "pt-12 md:pt-16";
  return (
    <section className={`${white ? "bg-white" : ""} ${pull} ${className}`}>
      <div
        className={`container-page space-y-12 ${top} ${onlyButtons ? "pb-10 md:pb-12" : "pb-12 md:pb-16"}`}
      >
        {content}
      </div>
    </section>
  );
}
