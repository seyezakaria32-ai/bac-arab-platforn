import Image from "next/image";
import { reveal } from "@/lib/reveal";
import { toEmbed } from "@/lib/video";
import { surfaceOf, type SectionValues } from "@/lib/sections/registry";
import { LinkButton } from "@/components/ui";
import { IconArrowNext } from "@/components/ui/icons";
import { IntroVideo } from "@/components/marketing/IntroVideo";
import { SectionIcon } from "./SectionIcon";
import { Band, RichText, SectionTitle, list, str, type SectionContext } from "./shared";

/*
 * أقسام يضيفها المدير من «تصميم الموقع». لكلّ منها لون خلفية يختاره
 * (كريمي، أبيض، فيروزي داكن)، فتُلوَّن النصوص بما يُقرأ عليه.
 */

type Props = { v: SectionValues; ctx: SectionContext; anchor: string };

const textTone = (light: boolean) => (light ? "text-brand-50/85" : "text-ink-700");

/* ════════════════════ نصّ ════════════════════ */
export function TextSection({ v, ctx, anchor }: Props) {
  const surface = surfaceOf("text", v);
  const light = surface === "brand";
  const center = v.align !== "start";
  return (
    <Band id={anchor} surface={surface}>
      <div className={`max-w-3xl ${center ? "mx-auto" : ""}`}>
        <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} align={center ? "center" : "start"} light={light} />
        <div
          {...reveal("up", 1)}
          className={`mt-6 space-y-4 text-[15px] leading-loose ${textTone(light)} ${center ? "text-center" : ""}`}
        >
          {list(v.paragraphs).map((p, i) => (
            <p key={i}>
              <RichText text={str(p.text)} counts={ctx.counts} strongClassName={light ? "text-white" : undefined} />
            </p>
          ))}
        </div>
      </div>
    </Band>
  );
}

/* ════════════════════ نصّ وصورة ════════════════════ */
export function TextImageSection({ v, ctx, anchor }: Props) {
  const surface = surfaceOf("textImage", v);
  const light = surface === "brand";
  const image = str(v.image);
  const button = str(v.buttonLabel) && str(v.buttonLink);
  // في الصفحة العربية أوّل عمود يمينًا: «يمين النصّ» = الصورة أوّلًا
  const imageFirst = v.imageSide === "start";
  const media = image ? (
    <div {...reveal("zoom", 1)} className={imageFirst ? "" : "lg:order-last"}>
      <Image
        src={image}
        alt={str(v.imageAlt)}
        width={1200}
        height={900}
        sizes="(max-width: 1024px) 95vw, 560px"
        className="h-auto w-full rounded-3xl shadow-xl ring-1 ring-ink-900/10"
      />
    </div>
  ) : null;

  return (
    <Band id={anchor} surface={surface}>
      <div className={`grid gap-10 lg:items-center ${image ? "lg:grid-cols-2 lg:gap-14" : "max-w-3xl"}`}>
        {media}
        <div>
          <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} align="start" light={light} />
          <div {...reveal("up", 1)} className={`mt-5 space-y-4 text-[15px] leading-loose ${textTone(light)}`}>
            {list(v.paragraphs).map((p, i) => (
              <p key={i}>
                <RichText text={str(p.text)} counts={ctx.counts} strongClassName={light ? "text-white" : undefined} />
              </p>
            ))}
          </div>
          {button && (
            <div {...reveal("up", 2)} className="mt-7">
              <LinkButton href={str(v.buttonLink)} size="lg" variant="primary">
                {str(v.buttonLabel)}
                <IconArrowNext className="text-lg" />
              </LinkButton>
            </div>
          )}
        </div>
      </div>
    </Band>
  );
}

/* ════════════════════ بطاقات ════════════════════ */
const COLS: Record<string, string> = { "2": "lg:grid-cols-2", "3": "lg:grid-cols-3", "4": "lg:grid-cols-4" };

export function CardsSection({ v, anchor }: Props) {
  const surface = surfaceOf("cards", v);
  const light = surface === "brand";
  const items = list(v.items);
  return (
    <Band id={anchor} surface={surface}>
      <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} description={str(v.description)} light={light} />
      <div className={`mt-12 grid gap-4 ${items.length > 1 ? "sm:grid-cols-2" : ""} ${COLS[str(v.columns)] ?? COLS["3"]}`}>
        {items.map((c, i) => (
          <div
            key={i}
            {...reveal("up", i)}
            className={light ? "rounded-2xl bg-white/10 p-6 ring-1 ring-white/15" : "card p-6"}
          >
            <span
              className={`grid size-11 place-items-center rounded-xl text-xl ${
                light ? "bg-white/10 text-brand-200" : "bg-brand-50 text-brand-600"
              }`}
            >
              <SectionIcon name={c.icon} />
            </span>
            <h3 className={`mt-4 font-display text-[16px] font-bold ${light ? "text-white" : "text-ink-900"}`}>
              {str(c.title)}
            </h3>
            {str(c.text) && (
              <p className={`mt-1.5 text-[13.5px] leading-relaxed ${light ? "text-brand-50/80" : "text-ink-500"}`}>
                {str(c.text)}
              </p>
            )}
          </div>
        ))}
      </div>
    </Band>
  );
}

/* ════════════════════ آراء الطلبة ════════════════════ */
export function TestimonialsSection({ v, anchor }: Props) {
  const surface = surfaceOf("testimonials", v);
  const light = surface === "brand";
  const items = list(v.items);
  return (
    <Band id={anchor} surface={surface}>
      <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} light={light} />
      <div className={`mt-12 grid gap-5 ${items.length > 1 ? "md:grid-cols-2" : "mx-auto max-w-2xl"} ${items.length > 2 ? "lg:grid-cols-3" : ""}`}>
        {items.map((t, i) => {
          const photo = str(t.photo);
          const name = str(t.name);
          return (
            <figure
              key={i}
              {...reveal("up", i)}
              className={`flex flex-col rounded-3xl p-6 ${light ? "bg-white/10 ring-1 ring-white/15" : "card"}`}
            >
              <span aria-hidden className={`font-display text-5xl leading-none ${light ? "text-brand-300" : "text-brand-400"}`}>
                ”
              </span>
              <blockquote className={`mt-2 flex-1 text-[14.5px] leading-loose ${light ? "text-brand-50/90" : "text-ink-700"}`}>
                <p>{str(t.quote)}</p>
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3">
                {photo ? (
                  <Image src={photo} alt={name} width={48} height={48} className="size-12 rounded-full object-cover" />
                ) : (
                  <span
                    className={`grid size-12 place-items-center rounded-full font-display text-lg font-black ${
                      light ? "bg-white/15 text-white" : "bg-brand-50 text-brand-700"
                    }`}
                  >
                    {name.trim().charAt(0) || "؟"}
                  </span>
                )}
                <span>
                  <span className={`block font-display text-[14.5px] font-bold ${light ? "text-white" : "text-ink-900"}`}>{name}</span>
                  {str(t.role) && (
                    <span className={`block text-[12.5px] ${light ? "text-brand-100/80" : "text-ink-500"}`}>{str(t.role)}</span>
                  )}
                </span>
              </figcaption>
            </figure>
          );
        })}
      </div>
    </Band>
  );
}

/* ════════════════════ فيديو ════════════════════ */
/** غلاف فيديو يوتيوب من رقمه، وإلا ملصق البرنامج */
function posterFor(src: string | null): string {
  const id = src?.match(/\/embed\/([\w-]{11})/)?.[1];
  return id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "/brand/poster-program.jpg";
}

export function VideoEmbedSection({ v, anchor }: Props) {
  const embed = toEmbed(str(v.url));
  if (embed.kind === "none") return null;
  const surface = surfaceOf("videoEmbed", v);
  const light = surface === "brand";
  return (
    <Band id={anchor} surface={surface}>
      <div className="mx-auto max-w-4xl">
        <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} description={str(v.description)} light={light} />
        <div {...reveal("zoom", 1)} className="mt-8 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-ink-900/10">
          <IntroVideo embed={embed} poster={posterFor(embed.src)} title={str(v.title)} />
        </div>
      </div>
    </Band>
  );
}
