import Image from "next/image";
import Link from "next/link";
import { formatPrice, planFeatures } from "@/lib/payments/service";
import { splitBlocks } from "@/lib/blocks";
import { IN_ABOUT, IN_HERO } from "@/lib/placements";
import { reveal } from "@/lib/reveal";
import type { SectionValues } from "@/lib/sections/registry";
import { Badge, LinkButton } from "@/components/ui";
import { IconArrowNext, IconCheck, IconPlayCircle, IconShield } from "@/components/ui/icons";
import { CountUp } from "@/components/marketing/CountUp";
import { BlockSlot } from "@/components/marketing/BlockSlot";
import { CurriculumAccordion } from "@/components/marketing/CurriculumAccordion";
import { Faq } from "@/components/marketing/Faq";
import { IntroVideo } from "@/components/marketing/IntroVideo";
import { SectionIcon } from "./SectionIcon";
import { RichText, SectionTitle, Wave, list, str, type SectionContext } from "./shared";

/*
 * أقسام الصفحة الرئيسية الأصلية. التنسيق كما كان حرفيًا؛ الذي تغيّر أن كل
 * نصّ وصورة وقائمة يأتي من محتوى القسم (القيم الافتراضية في registry.ts).
 */

type Props = { v: SectionValues; ctx: SectionContext; anchor: string };

/* ════════════════════════ الواجهة الأولى ════════════════════════ */
export function HeroSection({ v, ctx, anchor }: Props) {
  const heroBlocks = ctx.blocks[IN_HERO];
  const image = str(v.image);
  const bio = list(v.bio).map((b) => str(b.text)).filter(Boolean);
  const primary = str(v.primaryLabel) && str(v.primaryLink);
  const secondary = str(v.secondaryLabel) && str(v.secondaryLink);
  const stats = [
    { label: str(v.statLessons), value: ctx.counts.lessons },
    { label: str(v.statModules), value: ctx.counts.modules },
    { label: str(v.statHours), value: ctx.counts.hours },
  ];

  return (
    <section id={anchor} className="brand-gradient brand-texture relative scroll-mt-24 overflow-hidden text-white">
      <div
        className={`container-page relative grid gap-12 pt-10 pb-24 md:pt-16 md:pb-28 ${
          image ? "lg:grid-cols-[1.1fr_.9fr]" : ""
        } lg:items-center`}
      >
        <div className="animate-rise">
          {str(v.badge) && (
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-brand-100 ring-1 ring-white/20 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-brand-300" />
              {str(v.badge)}
            </span>
          )}

          <h1 className="mt-5 font-display text-[2rem] leading-[1.25] font-black sm:text-[2.6rem] lg:text-[3.1rem]">
            {str(v.title)}
            {str(v.highlight) && <span className="mt-1 block text-brand-300">{str(v.highlight)}</span>}
          </h1>

          {str(v.description) && (
            <p className="mt-5 max-w-xl text-[15px] leading-loose text-brand-50/85 sm:text-base">
              <RichText text={str(v.description)} counts={ctx.counts} strongClassName="font-bold text-white" />
            </p>
          )}

          {(primary || secondary) && (
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {primary && (
                <LinkButton href={str(v.primaryLink)} size="lg" variant="primary">
                  {str(v.primaryLabel)}
                  <IconArrowNext className="text-lg" />
                </LinkButton>
              )}
              {secondary && (
                <LinkButton
                  href={str(v.secondaryLink)}
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-white/5 text-white hover:border-brand-300 hover:bg-white/10 hover:text-brand-100"
                >
                  {str(v.secondaryLabel)}
                </LinkButton>
              )}
            </div>
          )}

          {/* أزرار من لوحة الإدارة، المكان «داخل الواجهة الأولى».
              على الحاسوب تحت زرَّي البداية مباشرة. على الهاتف يمتدّ الزرّان
              بعرض الشاشة، فيبدو زرّ أقصر بجانبهما ملتصقًا بطرف الصفحة —
              فيُعرض هناك بعد الأرقام، في منتصف السطر. */}
          <BlockSlot bare dark align="start" blocks={heroBlocks} className="mt-9 hidden sm:block" />

          {v.showStats !== "no" && (
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {stats.map((s, i) => (
                <div key={i}>
                  <dt className="text-[12px] text-brand-100/70">{s.label}</dt>
                  <dd className="num font-display text-2xl font-black text-white sm:text-3xl">
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          <BlockSlot bare dark blocks={heroBlocks} className="mt-10 sm:hidden" />
        </div>

        {/* بطاقة الأستاذ — تُخفى إن حُذفت صورتها */}
        {image && (
          <div className="animate-rise relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="overflow-hidden rounded-3xl bg-cream-100 shadow-2xl ring-1 ring-white/20">
              <div className="relative aspect-[760/426] w-full">
                <Image
                  src={image}
                  alt={str(v.imageAlt)}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="object-cover"
                />
              </div>
              {bio.length > 0 && (
                <div className="px-5 pt-4 pb-5">
                  <ul className="space-y-1.5">
                    {bio.map((line, i) => (
                      <li key={i} className="flex items-start gap-2 text-[13px] text-ink-700">
                        <IconCheck className="mt-1 shrink-0 text-brand-600" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <Wave className="absolute inset-x-0 bottom-0 h-12 w-full text-cream-100 sm:h-16" />
    </section>
  );
}

/* ════════════════════ شريط المزايا ════════════════════ */
const LG_COLS: Record<number, string> = { 1: "lg:grid-cols-1", 2: "lg:grid-cols-2", 3: "lg:grid-cols-3", 4: "lg:grid-cols-4" };

export function FeaturesSection({ v, anchor, afterHero }: Props & { afterHero: boolean }) {
  const items = list(v.items);
  return (
    // relative z-10: الواجهة الأولى عنصر positioned فتُرسم فوق ما بعدها، فكانت
    // موجتها تقصّ أعلى عناوين البطاقات. -mt-8 يُلصقه بأسفلها — إن كان بعدها.
    <section
      id={anchor}
      className={`container-page relative z-10 grid scroll-mt-24 gap-3 ${items.length > 1 ? "sm:grid-cols-2" : ""} ${
        LG_COLS[Math.min(items.length, 4)] ?? ""
      } ${afterHero ? "-mt-8" : "pt-12"}`}
    >
      {items.map((f, i) => (
        <div key={i} {...reveal("up", i)} className="card flex items-start gap-3 p-5">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg text-brand-600">
            <SectionIcon name={f.icon} />
          </span>
          <span className="min-w-0">
            {/* ارتفاع سطر مريح حتى تتّسع الحركات فوق الحروف العربية */}
            <span className="block font-display text-[14.5px] leading-7 font-bold text-ink-900">
              {str(f.title)}
            </span>
            <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">{str(f.text)}</span>
          </span>
        </div>
      ))}
    </section>
  );
}

/* ════════════════════ الفيديو التعريفي ════════════════════ */
export function VideoSection({ v, ctx, anchor }: Props) {
  if (ctx.introEmbed.kind === "none") return null;
  const cta = str(v.ctaLabel) && str(v.ctaLink);
  return (
    <section id={anchor} className="container-page scroll-mt-24 pt-16 md:pt-20">
      <div className="mx-auto max-w-4xl">
        <div {...reveal()} className="mb-7 text-center">
          {str(v.badge) && (
            <Badge tone="brand" className="mb-3">
              <IconPlayCircle />
              {str(v.badge)}
            </Badge>
          )}
          <h2 className="font-display text-2xl leading-snug font-black text-ink-900 sm:text-3xl">
            {ctx.intro.title}
          </h2>
          {ctx.intro.description && (
            <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-loose text-ink-500">
              {ctx.intro.description}
            </p>
          )}
        </div>

        <div {...reveal("zoom", 1)} className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-ink-900/10">
          <IntroVideo embed={ctx.introEmbed} poster={ctx.intro.poster || ctx.heroImage} title={ctx.intro.title} />
        </div>

        {cta && (
          <div {...reveal("up", 2)} className="mt-6 flex justify-center">
            <LinkButton href={str(v.ctaLink)} size="lg">
              {str(v.ctaLabel)}
              <IconArrowNext className="text-lg" />
            </LinkButton>
          </div>
        )}
      </div>
    </section>
  );
}

/* ════════════════════ عن البرنامج ════════════════════ */
export function AboutSection({ v, ctx, anchor }: Props) {
  // العارض في العمود المجاور للنصّ، والزرّ تحت النصّ
  const inside = splitBlocks(ctx.blocks[IN_ABOUT]);
  const facts = list(v.facts);
  return (
    <section id={anchor} className="container-page scroll-mt-24 py-20 md:py-24">
      <div className={`grid gap-12 lg:items-center ${inside.sliders.length ? "lg:grid-cols-[1fr_.85fr]" : "max-w-3xl"}`}>
        <div>
          <SectionTitle align="start" eyebrow={str(v.eyebrow)} title={str(v.title)} />
          <div {...reveal("up", 1)} className="mt-5 space-y-4 text-[15px] leading-loose text-ink-700">
            {list(v.paragraphs).map((p, i) => (
              <p key={i}>
                <RichText text={str(p.text)} counts={ctx.counts} />
              </p>
            ))}
          </div>

          {facts.length > 0 && (
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {facts.map((item, i) => (
                <div key={i} {...reveal("up", i + 1)} className="card px-4 py-3">
                  <p className="text-[12px] font-medium text-ink-500">{str(item.label)}</p>
                  <p className="mt-0.5 font-display text-[15px] font-bold text-ink-900">{str(item.value)}</p>
                </div>
              ))}
            </div>
          )}
          <BlockSlot bare align="start" blocks={inside.buttons} className="mt-9" />
        </div>

        {/* يُدار من لوحة الإدارة ← السلايدر، المكان «داخل عن البرنامج» */}
        <BlockSlot bare blocks={inside.sliders} />
      </div>
    </section>
  );
}

/* ════════════════════ ماذا ستتعلّم ════════════════════ */
const TRACK_COLORS: Record<string, string> = { ink: "bg-ink-900", brand: "bg-brand-600", gold: "bg-gold-500" };

export function LearnSection({ v, anchor }: Props) {
  const tracks = list(v.tracks);
  return (
    <section id={anchor} className="scroll-mt-24 bg-white py-20 md:py-24">
      <div className="container-page">
        <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} description={str(v.description)} />

        <div className={`mt-12 grid gap-6 ${tracks.length > 1 ? "lg:grid-cols-2" : ""}`}>
          {tracks.map((track, i) => (
            <div
              key={i}
              {...reveal(tracks.length === 2 ? (i === 0 ? "start" : "end") : "up", 1)}
              className="card overflow-hidden"
            >
              <div className={`flex items-center gap-3 px-5 py-4 text-white ${TRACK_COLORS[str(track.color)] ?? TRACK_COLORS.ink}`}>
                <span className="text-xl">
                  <SectionIcon name={track.icon} />
                </span>
                <h3 className="font-display text-lg font-black">{str(track.title)}</h3>
              </div>
              <ul className="divide-y divide-cream-200">
                {list(track.items).map((item, j) => (
                  <li key={j} className="flex gap-4 px-5 py-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-100 text-ink-700">
                      <SectionIcon name={item.icon} />
                    </span>
                    <span>
                      <span className="block font-display text-[15px] font-bold text-ink-900">{str(item.title)}</span>
                      <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-500">{str(item.text)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════ محتوى البرنامج ════════════════════ */
export function CurriculumSection({ v, ctx, anchor }: Props) {
  return (
    <section id={anchor} className="container-page scroll-mt-24 py-20 md:py-24">
      <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} description={str(v.description)} />

      <div {...reveal("up", 1)} className="mt-12">
        {ctx.tracks.length ? (
          <CurriculumAccordion tracks={ctx.tracks} />
        ) : (
          <p className="text-center text-sm text-ink-500">{str(v.emptyText)}</p>
        )}
      </div>
    </section>
  );
}

/* ════════════════════ خطوات مرقّمة ════════════════════ */
const arabicDigits = new Intl.NumberFormat("ar-EG");

export function StepsSection({ v, anchor }: Props) {
  const items = list(v.items);
  return (
    <section id={anchor} className="scroll-mt-24 bg-white py-20 md:py-24">
      <div className="container-page">
        <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} description={str(v.description)} />

        <ol className={`mt-12 grid gap-4 ${items.length > 1 ? "sm:grid-cols-2" : ""} ${LG_COLS[Math.min(items.length, 4)] ?? ""}`}>
          {items.map((step, i) => (
            <li key={i} {...reveal("up", i)} className="card relative p-5">
              <span className="num grid size-10 place-items-center rounded-xl bg-brand-500 font-display text-lg font-black text-ink-900">
                {arabicDigits.format(i + 1)}
              </span>
              <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900">{str(step.title)}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">{str(step.text)}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ════════════════════ الباقات ════════════════════ */
export function PlansSection({ v, ctx, anchor }: Props) {
  return (
    <section id={anchor} className="container-page scroll-mt-24 py-20 md:py-24">
      <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} description={str(v.description)} />

      <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
        {ctx.plans.map((plan, i) => {
          const features = planFeatures(plan);
          const highlighted = plan.isHighlighted;

          return (
            <div
              key={plan.id}
              {...reveal("zoom", i)}
              className={`relative flex flex-col overflow-hidden rounded-3xl border-2 bg-white transition-shadow hover:shadow-lg ${
                highlighted ? "border-gold-400 shadow-md" : "border-cream-300"
              }`}
            >
              {plan.badge && (
                <span className="absolute top-5 left-5 rounded-full bg-gold-400 px-3 py-1 text-[11px] font-black text-ink-900">
                  {plan.badge}
                </span>
              )}

              <div className="px-6 pt-7 pb-6 sm:px-8">
                <h3 className={`font-display text-2xl font-black ${highlighted ? "text-gold-600" : "text-ink-900"}`}>
                  {plan.name}
                </h3>
                {plan.tagline && <p className="mt-1 text-[13.5px] text-ink-500">{plan.tagline}</p>}

                <div className="mt-5 flex items-end gap-2">
                  <span className="num font-display text-4xl font-black text-ink-900">
                    {formatPrice(plan.priceCents, plan.currency)}
                  </span>
                  {plan.durationDays > 0 && <span className="mb-1.5 text-sm font-bold text-ink-500">/ شهريًا</span>}
                  {plan.comparePriceCents && (
                    <span className="num mb-1.5 text-sm text-ink-500 line-through">
                      {formatPrice(plan.comparePriceCents, plan.currency)}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[12.5px] text-ink-500">
                  {plan.durationDays > 0 ? str(v.monthlyNote) : str(v.oneTimeNote)}
                </p>

                <LinkButton
                  href={`/checkout/${plan.code}`}
                  size="lg"
                  variant={highlighted ? "gold" : "dark"}
                  className="mt-6 w-full"
                >
                  {str(v.subscribeLabel)}
                  <IconArrowNext className="text-lg" />
                </LinkButton>
              </div>

              <ul className="flex-1 space-y-3 border-t border-cream-200 bg-cream-50/60 px-6 py-6 sm:px-8">
                {features.map((f) => (
                  <li
                    key={f.label}
                    className={`flex items-start gap-2.5 text-[13.5px] leading-relaxed ${
                      f.included ? "text-ink-800" : "text-ink-300 line-through"
                    }`}
                  >
                    {f.included ? (
                      <IconCheck className="mt-1 shrink-0 text-brand-600" />
                    ) : (
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-ink-300" />
                    )}
                    {f.label}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {str(v.note) && (
        <p {...reveal()} className="mt-8 flex items-center justify-center gap-2 text-center text-[13px] text-ink-500">
          <IconShield className="text-base text-brand-600" />
          {str(v.note)}
        </p>
      )}
    </section>
  );
}

/* ════════════════════ أسئلة وأجوبة ════════════════════ */
export function FaqSection({ v, anchor }: Props) {
  const items = list(v.items).map((i) => ({ q: str(i.q), a: str(i.a) }));
  return (
    <section id={anchor} className="scroll-mt-24 bg-white py-20 md:py-24">
      <div className="container-page">
        <SectionTitle eyebrow={str(v.eyebrow)} title={str(v.title)} />
        <div {...reveal("up", 1)} className="mt-12">
          <Faq items={items} />
        </div>
      </div>
    </section>
  );
}

/* ════════════════════ نداء ختامي ════════════════════ */
export function FinalSection({ v, ctx, anchor }: Props) {
  const primary = str(v.primaryLabel) && str(v.primaryLink);
  const secondary = str(v.secondaryLabel) && str(v.secondaryLink);
  return (
    <section id={anchor} className="container-page scroll-mt-24 py-16">
      <div {...reveal("zoom")} className="brand-gradient brand-texture relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-12">
        {str(v.badge) && (
          <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/20">
            {str(v.badge)}
          </Badge>
        )}
        <h2 className="mt-4 font-display text-2xl font-black sm:text-3xl">{str(v.title)}</h2>
        {str(v.text) && (
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-loose text-brand-50/80">
            <RichText text={str(v.text)} counts={ctx.counts} strongClassName="font-bold text-white" />
          </p>
        )}
        {(primary || secondary) && (
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            {primary && (
              <LinkButton href={str(v.primaryLink)} size="lg" variant="primary">
                {str(v.primaryLabel)}
                <IconArrowNext className="text-lg" />
              </LinkButton>
            )}
            {secondary && (
              <Link
                href={str(v.secondaryLink)}
                className="inline-flex h-13 items-center justify-center rounded-xl border-2 border-white/25 px-7 text-base font-bold text-white transition-colors hover:border-brand-300 hover:text-brand-100"
              >
                {str(v.secondaryLabel)}
              </Link>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
