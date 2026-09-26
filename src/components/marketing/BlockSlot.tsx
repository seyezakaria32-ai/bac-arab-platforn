import { ImageSlider } from "@/components/marketing/ImageSlider";
import { CtaButton } from "@/components/marketing/CtaButton";
import { aspectCss } from "@/lib/sliders";
import type { Block } from "@/lib/blocks";
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
  tight = false,
  surface = "cream",
  className = "",
}: {
  blocks?: Block[];
  bare?: boolean;
  align?: "center" | "start";
  /** خلفية الموضع داكنة (الواجهة الأولى) */
  dark?: boolean;
  /**
   * الموضع يلي قسمًا بهامش سفلي كبير: الهامشان كانا يتراكمان (96px + 48px)
   * فيبدو الزرّ منفصلًا عمّا فوقه. نسحب الموضع إلى داخل هامش القسم السابق.
   * يجب أن يطابق surface لونَ ذلك القسم، وإلا ظهر الزرّ على حدّ اللونين.
   */
  tight?: boolean;
  /**
   * لون خلفية الموضع، مطابقًا للقسم الذي يليه الموضع: بعد قسم أبيض (الأسئلة
   * الشائعة مثلًا) يظهر الزرّ على الأبيض امتدادًا لذلك القسم، لا في شريط
   * كريمي منفصل بينه وبين ما بعده.
   */
  surface?: "cream" | "white";
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
  return (
    <section
      className={`${surface === "white" ? "bg-white" : ""} ${tight ? "-mt-10 md:-mt-14" : ""} ${className}`}
    >
      <div
        className={`container-page space-y-12 ${
          tight ? "pt-0" : onlyButtons ? "pt-10 md:pt-12" : "pt-12 md:pt-16"
        } ${onlyButtons ? "pb-10 md:pb-12" : "pb-12 md:pb-16"}`}
      >
        {content}
      </div>
    </section>
  );
}
