import { ImageSlider } from "@/components/marketing/ImageSlider";
import { CtaButton } from "@/components/marketing/CtaButton";
import { aspectCss, type SliderView } from "@/lib/sliders";
import { reveal } from "@/lib/reveal";

/**
 * موضع عارضات في الصفحة. لا يرسم شيئًا إن لم يُسنَد إليه عارض مفعّل،
 * فالمواضع الفارغة لا تترك فراغًا في التصميم.
 *
 * bare: داخل قسم موجود (مثل عمود «عن البرنامج») — بلا هوامش ولا حاوية.
 */
export function SliderSlot({
  sliders,
  bare = false,
  className = "",
}: {
  sliders?: SliderView[];
  bare?: boolean;
  className?: string;
}) {
  if (!sliders?.length) return null;

  const content = sliders.map((s) => (
    <div key={s.id} {...reveal("zoom")}>
      {s.title && (
        <h2 className="mb-5 text-center font-display text-xl font-black text-ink-900 sm:text-2xl">
          {s.title}
        </h2>
      )}
      <ImageSlider
        slides={s.slides}
        perView={s.perView}
        intervalMs={s.intervalMs}
        aspect={aspectCss(s.aspect)}
        autoplay={s.autoplay}
        mode={s.mode}
        label={s.title ?? "عارض صور"}
      />
      {s.cta && <CtaButton cta={s.cta} />}
    </div>
  ));

  if (bare) return <div className={`space-y-10 ${className}`}>{content}</div>;

  return (
    <section className={`container-page space-y-12 py-12 md:py-16 ${className}`}>
      {content}
    </section>
  );
}
