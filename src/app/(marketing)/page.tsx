import Image from "next/image";
import Link from "next/link";
import { db } from "@/lib/db";
import { getPublicCurriculum } from "@/lib/curriculum";
import { getSettings } from "@/lib/settings";
import { formatPrice, planFeatures } from "@/lib/payments/service";
import { BRAND } from "@/lib/constants";
import { Badge, LinkButton } from "@/components/ui";
import { CountUp } from "@/components/marketing/CountUp";
import { reveal } from "@/lib/reveal";
import {
  IconCheck,
  IconClock,
  IconUsers,
  IconAward,
  IconBook,
  IconMap,
  IconSparkle,
  IconTarget,
  IconShield,
  IconPlayCircle,
  IconChart,
  IconPieChart,
  IconDocument,
  IconArrowNext,
} from "@/components/ui/icons";
import { CurriculumAccordion } from "@/components/marketing/CurriculumAccordion";
import { Faq } from "@/components/marketing/Faq";
import { IntroVideo } from "@/components/marketing/IntroVideo";
import { toEmbed } from "@/lib/video";

export const dynamic = "force-dynamic";

/* ─────────────────────── موجة الهوية البصرية ─────────────────────── */
function Wave({ className = "", flip = false }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      className={`${className} ${flip ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path
        d="M0 48c180 40 320 40 520 14C760 30 900 0 1120 6c130 4 240 18 320 30v54H0V48Z"
        fill="currentColor"
      />
    </svg>
  );
}

function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "center" | "start";
}) {
  return (
    <div {...reveal()} className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      {eyebrow && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-[12px] font-bold text-brand-700 ring-1 ring-brand-200">
          <IconSparkle className="text-[11px]" />
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 font-display text-2xl font-black text-ink-900 sm:text-3xl md:text-[2.1rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-3 text-[15px] leading-loose text-ink-500">{description}</p>
      )}
    </div>
  );
}

export default async function LandingPage() {
  const [course, plans, settings] = await Promise.all([
    getPublicCurriculum(),
    db.plan.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    getSettings(),
  ]);

  const intro = settings["site.introVideo"];
  const introEmbed = toEmbed(intro.url);

  const tracks = course?.tracks ?? [];
  const lessonCount = tracks.reduce(
    (n, t) => n + t.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0,
  );
  const moduleCount = tracks.reduce((n, t) => n + t.modules.length, 0);
  const totalMinutes = tracks.reduce(
    (n, t) =>
      n +
      t.modules.reduce(
        (m, mod) => m + mod.lessons.reduce((s, l) => s + l.durationMinutes, 0),
        0,
      ),
    0,
  );

  return (
    <>
      {/* ════════════════════════ Hero ════════════════════════ */}
      <section className="brand-gradient brand-texture relative overflow-hidden text-white">
        <div className="container-page relative grid gap-12 pt-10 pb-24 md:pt-16 md:pb-28 lg:grid-cols-[1.1fr_.9fr] lg:items-center">
          <div className="animate-rise">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1.5 text-[12px] font-bold text-brand-100 ring-1 ring-white/20 backdrop-blur">
              <span className="size-1.5 animate-pulse rounded-full bg-brand-300" />
              التسجيل مفتوح · ابدأ فورًا وتعلّم بإيقاعك
            </span>

            <h1 className="mt-5 font-display text-[2rem] leading-[1.25] font-black sm:text-[2.6rem] lg:text-[3.1rem]">
              {BRAND.programTitle}
              <span className="mt-1 block text-brand-300">
                {BRAND.programSubtitle}
              </span>
            </h1>

            <p className="mt-5 max-w-xl text-[15px] leading-loose text-brand-50/85 sm:text-base">
              برنامج تدريبي مسجّل بالفيديو لطلبة البكالوريا، تبدأه متى شئت ويأخذ بيدك خطوة بخطوة
              لإتقان <strong className="font-bold text-white">منهجية الإجابة</strong> في
              التاريخ والجغرافيا: الإنشاء التاريخي، التعليق على الوثائق، المقالة
              الجغرافية، وإنجاز المبيانات وقراءتها — حتى تدخل الامتحان وأنت تعرف
              تمامًا ما ينتظره منك المصحّح.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <LinkButton href="#plans" size="lg" variant="primary">
                ابدأ البرنامج
                <IconArrowNext className="text-lg" />
              </LinkButton>
              <LinkButton
                href="#curriculum"
                size="lg"
                variant="outline"
                className="border-white/25 bg-white/5 text-white hover:border-brand-300 hover:bg-white/10 hover:text-brand-100"
              >
                اكتشف البرنامج
              </LinkButton>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/15 pt-6">
              {[
                { label: "درسًا مسجّلًا", value: lessonCount },
                { label: "وحدات تدريبية", value: moduleCount },
                { label: "ساعة تكوين", value: Math.round(totalMinutes / 60) },
              ].map((s) => (
                <div key={s.label}>
                  <dt className="text-[12px] text-brand-100/70">{s.label}</dt>
                  <dd className="num font-display text-2xl font-black text-white sm:text-3xl">
                    <CountUp value={s.value} />
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* بطاقة الأستاذ */}
          <div className="animate-rise relative mx-auto w-full max-w-sm lg:max-w-none">
            <div className="overflow-hidden rounded-3xl bg-cream-100 shadow-2xl ring-1 ring-white/20">
              {/* الصورة قابلة للاستبدال من لوحة الإدارة ← الواجهة */}
              <div className="relative aspect-[760/426] w-full">
                <Image
                  src={settings["site.heroImage"]}
                  alt={`${BRAND.instructor} — المدرّس في البرنامج`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 90vw, 420px"
                  className="object-cover"
                />
              </div>
              <div className="px-5 pt-4 pb-5">
                <ul className="space-y-1.5">
                  {BRAND.instructorBio.map((line) => (
                    <li
                      key={line}
                      className="flex items-start gap-2 text-[13px] text-ink-700"
                    >
                      <IconCheck className="mt-1 shrink-0 text-brand-600" />
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        <Wave className="absolute inset-x-0 bottom-0 h-12 w-full text-cream-100 sm:h-16" />
      </section>

      {/* ════════════════════ شريط المزايا ════════════════════
          relative z-10 ضروري: قسم الـ Hero عنصر positioned فيُرسم فوق ما بعده،
          فكانت الموجة السفلية تقصّ أعلى عناوين البطاقات (نقاط الحروف والشدّة). */}
      <section className="container-page relative z-10 -mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: <IconClock />, title: "بإيقاعك الخاص", desc: "ابدأ متى شئت، وتعلّم في أي وقت" },
          { icon: <IconUsers />, title: "طلبة البكالوريا", desc: "محتوى مُفصَّل على الامتحان الوطني" },
          { icon: <IconTarget />, title: "تدرّج إجباري", desc: "درس بعد درس، بلا قفز فوق الأساسيات" },
          { icon: <IconAward />, title: "إثبات إتمام", desc: "شهادة عند إكمال البرنامج" },
        ].map((f, i) => (
          <div key={f.title} {...reveal("up", i)} className="card flex items-start gap-3 p-5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-lg text-brand-600">
              {f.icon}
            </span>
            <span className="min-w-0">
              {/* ارتفاع سطر مريح حتى تتّسع الحركات فوق الحروف العربية */}
              <span className="block font-display text-[14.5px] leading-7 font-bold text-ink-900">
                {f.title}
              </span>
              <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">
                {f.desc}
              </span>
            </span>
          </div>
        ))}
      </section>

      {/* ════════════════════ فيديو التعريف ════════════════════
          يُدار من لوحة الإدارة ← الواجهة، ولا يظهر ما دام الرابط فارغًا */}
      {introEmbed.kind !== "none" && (
        <section id="video" className="container-page scroll-mt-24 pt-16 md:pt-20">
          <div className="mx-auto max-w-4xl">
            <div {...reveal()} className="mb-7 text-center">
              <Badge tone="brand" className="mb-3">
                <IconPlayCircle />
                فيديو تعريفي
              </Badge>
              <h2 className="font-display text-2xl leading-snug font-black text-ink-900 sm:text-3xl">
                {intro.title}
              </h2>
              {intro.description && (
                <p className="mx-auto mt-3 max-w-2xl text-[15px] leading-loose text-ink-500">
                  {intro.description}
                </p>
              )}
            </div>

            <div {...reveal("zoom", 1)} className="overflow-hidden rounded-3xl shadow-2xl ring-1 ring-ink-900/10">
              <IntroVideo
                embed={introEmbed}
                poster={intro.poster || settings["site.heroImage"]}
                title={intro.title}
              />
            </div>

            <div {...reveal("up", 2)} className="mt-6 flex justify-center">
              <LinkButton href="#plans" size="lg">
                سجّل الآن وابدأ الدرس الأول
                <IconArrowNext className="text-lg" />
              </LinkButton>
            </div>
          </div>
        </section>
      )}

      {/* ════════════════════ عن البرنامج ════════════════════ */}
      <section id="about" className="container-page scroll-mt-24 py-20 md:py-24">
        <div className="grid gap-12 lg:grid-cols-[1fr_.85fr] lg:items-center">
          <div>
            <SectionTitle
              align="start"
              eyebrow="عن البرنامج"
              title="ابدأ اليوم، وتعلّم بالوتيرة التي تناسبك"
            />
            <div {...reveal("up", 1)} className="mt-5 space-y-4 text-[15px] leading-loose text-ink-700">
              <p>
                معظم الطلبة لا يخسرون النقط لأنهم لا يعرفون الدروس، بل لأنهم لا
                يعرفون <strong>كيف يكتبون</strong> ما يعرفونه. هذا البرنامج مبنيّ
                على هذه الملاحظة بالضبط: تدريب عملي على منهجية الإجابة، لا حفظًا
                إضافيًا للمقرّر.
              </p>
              <p>
                البرنامج مسجّل بالكامل ومتاح لك <strong>فور التسجيل</strong>: لا
                دفعات ولا مواعيد ثابتة، تدخل متى شئت وتتقدّم بالوتيرة التي تناسب
                برنامج مراجعتك — وحدة تلو الأخرى، ودرسًا بعد درس، مع تمارين تطبيقية
                واختبار في نهاية كل وحدة. ولمن يريد خطة واضحة، يُنجَز البرنامج في
                حوالي <strong>شهرين</strong> بمعدّل درس يوميًا تقريبًا.
              </p>
              <p>
                كل درس يأتي مع فيديو شرح، ملخّص مكتوب، أهداف واضحة، وملفات مرفقة —
                وتُحفظ نقطة توقّفك تلقائيًا حتى تعود إليها متى شئت.
              </p>
            </div>

            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {[
                { k: "بداية الدراسة", v: "فور التسجيل" },
                { k: "مدّة الوصول", v: "طوال موسم البكالوريا" },
                { k: "الوتيرة المقترحة", v: BRAND.duration },
                { k: "الفئة المستهدفة", v: BRAND.audience },
              ].map((item, i) => (
                <div key={item.k} {...reveal("up", i + 1)} className="card px-4 py-3">
                  <p className="text-[12px] font-medium text-ink-500">{item.k}</p>
                  <p className="mt-0.5 font-display text-[15px] font-bold text-ink-900">
                    {item.v}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* الشبكة تُدار من لوحة الإدارة ← الواجهة */}
          <div className="grid grid-cols-2 gap-3">
            {settings["site.gallery"].map((img, i) => (
              <div
                key={`${img.src}-${i}`}
                {...reveal("zoom", i)}
                className={`relative aspect-[760/853] overflow-hidden rounded-2xl ring-1 ring-cream-300 ${
                  i % 3 === 0 ? "translate-y-3" : ""
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="(max-width: 1024px) 45vw, 250px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ ماذا ستتعلّم ════════════════════ */}
      <section id="learn" className="scroll-mt-24 bg-white py-20 md:py-24">
        <div className="container-page">
          <SectionTitle
            eyebrow="ماذا ستتعلّم؟"
            title="مساران متكاملان: التاريخ والجغرافيا"
            description="ستة محاور كبرى تغطّي كل ما يُطلب منك في ورقة الامتحان، من أول سطر في المقدمة إلى آخر خط في المبيان."
          />

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {[
              {
                title: "أولًا: التاريخ",
                icon: <IconBook />,
                color: "bg-ink-900",
                items: [
                  {
                    icon: <IconDocument />,
                    t: "منهجية كتابة الإنشاء التاريخي",
                    d: "المقدمة، العرض، الخاتمة — ببناء متماسك وأخطاء شائعة تتفاداها.",
                  },
                  {
                    icon: <IconPlayCircle />,
                    t: "التعليق على الوثائق التاريخية",
                    d: "من تقديم الوثيقة إلى التقويم النقدي، مع وثيقة واحدة أو عدّة وثائق.",
                  },
                  {
                    icon: <IconAward />,
                    t: "المقالة التاريخية: فن البناء والتحرير",
                    d: "تحويل المعطيات إلى مقالة، وفهم شبكة التقويم التي يصحّح بها الأستاذ.",
                  },
                ],
              },
              {
                title: "ثانيًا: الجغرافيا",
                icon: <IconMap />,
                color: "bg-brand-600",
                items: [
                  {
                    icon: <IconDocument />,
                    t: "تقنيات كتابة المقالة الجغرافية",
                    d: "لغة المادة ومصطلحاتها، والمعطيات الرقمية في مكانها الصحيح.",
                  },
                  {
                    icon: <IconPieChart />,
                    t: "قراءة وإنجاز المبيانات",
                    d: "الدائري، نصف الدائري، الأعمدة، المنحنى — رسمًا دقيقًا خطوة بخطوة.",
                  },
                  {
                    icon: <IconChart />,
                    t: "منهجية التعليق في الجغرافيا",
                    d: "وصف، تفسير، استنتاج — مع بنك مصطلحات جاهز للتوظيف.",
                  },
                ],
              },
            ].map((track, i) => (
              <div
                key={track.title}
                {...reveal(i === 0 ? "start" : "end", 1)}
                className="card overflow-hidden"
              >
                <div
                  className={`flex items-center gap-3 px-5 py-4 text-white ${track.color}`}
                >
                  <span className="text-xl">{track.icon}</span>
                  <h3 className="font-display text-lg font-black">{track.title}</h3>
                </div>
                <ul className="divide-y divide-cream-200">
                  {track.items.map((item) => (
                    <li key={item.t} className="flex gap-4 px-5 py-5">
                      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-cream-100 text-ink-700">
                        {item.icon}
                      </span>
                      <span>
                        <span className="block font-display text-[15px] font-bold text-ink-900">
                          {item.t}
                        </span>
                        <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-500">
                          {item.d}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════ المنهج الدراسي ════════════════════ */}
      <section id="curriculum" className="container-page scroll-mt-24 py-20 md:py-24">
        <SectionTitle
          eyebrow="المنهج الدراسي"
          title="محتوى البرنامج كاملًا أمامك"
          description="اطّلع على كل وحدة ودرس قبل أن تسجّل. لا شيء مخفيّ — تعرف بالضبط ما الذي ستحصل عليه."
        />

        <div {...reveal("up", 1)} className="mt-12">
          {tracks.length ? (
            <CurriculumAccordion tracks={tracks} />
          ) : (
            <p className="text-center text-sm text-ink-500">
              لم تُضَف الدروس بعد.
            </p>
          )}
        </div>
      </section>

      {/* ════════════════════ رحلة الطالب ════════════════════ */}
      <section className="bg-white py-20 md:py-24">
        <div className="container-page">
          <SectionTitle
            eyebrow="كيف يعمل البرنامج؟"
            title="مسار واضح من التسجيل إلى الشهادة"
            description="نظام تدرّج إجباري يمنعك من القفز فوق الأساسيات — وهذا بالضبط ما يصنع الفرق."
          />

          <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "١",
                t: "سجّل واختر باقتك",
                d: "أنشئ حسابك، اختر START أو PREMIUM ELITE، وادفع بالطريقة المناسبة لك.",
              },
              {
                n: "٢",
                t: "ادخل لوحتك",
                d: "يُفعَّل البرنامج تلقائيًا بعد تأكيد الدفع، وتبدأ من الدرس الأول.",
              },
              {
                n: "٣",
                t: "درسًا بعد درس",
                d: "شاهد، طبّق، ثم اضغط «إتمام الدرس» ليُفتح لك الدرس التالي.",
              },
              {
                n: "٤",
                t: "اختبر ثم تقدّم",
                d: "في نهاية كل وحدة اختبار قصير؛ باجتيازه تُفتح الوحدة التالية.",
              },
            ].map((step, i) => (
              <li key={step.n} {...reveal("up", i)} className="card relative p-5">
                <span className="num grid size-10 place-items-center rounded-xl bg-brand-500 font-display text-lg font-black text-ink-900">
                  {step.n}
                </span>
                <h3 className="mt-4 font-display text-[15px] font-bold text-ink-900">
                  {step.t}
                </h3>
                <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-500">
                  {step.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ════════════════════ الباقات ════════════════════ */}
      <section id="plans" className="container-page scroll-mt-24 py-20 md:py-24">
        <SectionTitle
          eyebrow="الباقات"
          title="اختر ما يناسب جدّيتك"
          description="الباقتان تفتحان لك البرنامج كاملًا. الفرق في المرافقة والموارد الإضافية."
        />

        <div className="mt-12 grid gap-6 lg:grid-cols-2 lg:gap-8">
          {plans.map((plan, i) => {
            const features = planFeatures(plan);
            const highlighted = plan.isHighlighted;

            return (
              <div
                key={plan.id}
                {...reveal("zoom", i)}
                className={`relative flex flex-col overflow-hidden rounded-3xl border-2 bg-white transition-shadow hover:shadow-lg ${
                  highlighted
                    ? "border-gold-400 shadow-md"
                    : "border-cream-300"
                }`}
              >
                {plan.badge && (
                  <span className="absolute top-5 left-5 rounded-full bg-gold-400 px-3 py-1 text-[11px] font-black text-ink-900">
                    {plan.badge}
                  </span>
                )}

                <div className="px-6 pt-7 pb-6 sm:px-8">
                  <h3
                    className={`font-display text-2xl font-black ${
                      highlighted ? "text-gold-600" : "text-ink-900"
                    }`}
                  >
                    {plan.name}
                  </h3>
                  {plan.tagline && (
                    <p className="mt-1 text-[13.5px] text-ink-500">{plan.tagline}</p>
                  )}

                  <div className="mt-5 flex items-end gap-2">
                    <span className="num font-display text-4xl font-black text-ink-900">
                      {formatPrice(plan.priceCents, plan.currency)}
                    </span>
                    {plan.durationDays > 0 && (
                      <span className="mb-1.5 text-sm font-bold text-ink-500">
                        / شهريًا
                      </span>
                    )}
                    {plan.comparePriceCents && (
                      <span className="num mb-1.5 text-sm text-ink-500 line-through">
                        {formatPrice(plan.comparePriceCents, plan.currency)}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-500">
                    {plan.durationDays > 0
                      ? "اشتراك شهري · جدّده متى شئت، وتقدّمك محفوظ"
                      : "دفعة واحدة · وصول طوال موسم البكالوريا"}
                  </p>

                  <LinkButton
                    href={`/checkout/${plan.code}`}
                    size="lg"
                    variant={highlighted ? "gold" : "dark"}
                    className="mt-6 w-full"
                  >
                    اشترك الآن
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

        <p {...reveal()} className="mt-8 flex items-center justify-center gap-2 text-center text-[13px] text-ink-500">
          <IconShield className="text-base text-brand-600" />
          لا يُفتح محتوى البرنامج قبل تأكيد عملية الدفع — حسابك ومعلوماتك محميّة.
        </p>
      </section>

      {/* ════════════════════ الأسئلة الشائعة ════════════════════ */}
      <section id="faq" className="scroll-mt-24 bg-white py-20 md:py-24">
        <div className="container-page">
          <SectionTitle eyebrow="أسئلة شائعة" title="كل ما قد يدور في ذهنك" />
          <div {...reveal("up", 1)} className="mt-12">
            <Faq />
          </div>
        </div>
      </section>

      {/* ════════════════════ نداء أخير ════════════════════ */}
      <section className="container-page py-16">
        <div {...reveal("zoom")} className="brand-gradient brand-texture relative overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-12">
          <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/20">
            التسجيل مفتوح
          </Badge>
          <h2 className="mt-4 font-display text-2xl font-black sm:text-3xl">
            الامتحان لن ينتظرك. ابدأ اليوم.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-[15px] leading-loose text-brand-50/80">
            <span className="num">{lessonCount}</span> درسًا مصمَّمة خصّيصًا لترفع
            نقطتك في التاريخ والجغرافيا — بمنهجية واضحة وتدرّج منظّم.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <LinkButton href="#plans" size="lg" variant="primary">
              سجّل الآن
              <IconArrowNext className="text-lg" />
            </LinkButton>
            <Link
              href="/login"
              className="inline-flex h-13 items-center justify-center rounded-xl border-2 border-white/25 px-7 text-base font-bold text-white transition-colors hover:border-brand-300 hover:text-brand-100"
            >
              لديّ حساب بالفعل
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
