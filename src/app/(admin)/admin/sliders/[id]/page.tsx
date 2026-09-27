import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { BUNDLED_IMAGES } from "@/lib/settings";
import { getPlacementOptions } from "@/lib/sections/server";
import {
  aspectCss,
  CTA_TONES,
  LOOP_MODES,
  toCta,
  INTERVAL_OPTIONS_S,
  PER_VIEW_OPTIONS,
  SLIDER_ASPECTS,
} from "@/lib/sliders";
import { deleteSliderAction, saveSliderAction } from "../actions";
import {
  AdminForm,
  ActionButton,
  Field,
  Select,
  SubmitButton,
  Toggle,
} from "@/components/admin/Form";
import { SlidesManager } from "@/components/admin/SlidesManager";
import { ImageSlider } from "@/components/marketing/ImageSlider";
import { CtaButton } from "@/components/marketing/CtaButton";
import { Alert, Badge } from "@/components/ui";
import { IconArrowPrev, IconTrash } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تعديل عارض" };

export default async function SliderEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const { created } = await searchParams;

  const slider = await db.slider.findUnique({
    where: { id },
    include: { slides: { orderBy: [{ order: "asc" }, { createdAt: "asc" }] } },
  });
  if (!slider) notFound();

  const aspect = aspectCss(slider.aspect);
  const placements = await getPlacementOptions("slider");
  const cta = toCta(slider);
  const previewHref = slider.placement.startsWith("dashboard.") ? "/dashboard" : "/";

  return (
    <div className="container-page max-w-5xl space-y-7 py-8">
      <div>
        <Link
          href="/admin/sliders"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 hover:text-brand-700"
        >
          <IconArrowPrev />
          كل العارضات
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-black text-ink-900">{slider.name}</h1>
            {!slider.isActive ? (
              <Badge tone="ink">مخفي</Badge>
            ) : slider.slides.length === 0 ? (
              <Badge tone="gold">لا صور — غير ظاهر</Badge>
            ) : (
              <Badge tone="green">ظاهر في الموقع</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={previewHref}
              target="_blank"
              className="font-ui inline-flex h-9 items-center rounded-lg border border-cream-300 bg-white px-3 text-[13px] font-bold text-ink-700 hover:border-brand-300"
            >
              معاينة في الموقع ↗
            </Link>
            <ActionButton
              action={deleteSliderAction.bind(null, slider.id, true)}
              tone="danger"
              confirm={`حذف العارض «${slider.name}» وكل صوره؟ لا يمكن التراجع.`}
            >
              <IconTrash />
              حذف العارض
            </ActionButton>
          </div>
        </div>
      </div>

      {created && (
        <Alert tone="success" title="أُنشئ العارض">
          أضف صوره الآن من الأسفل — يظهر في الموقع بمجرّد إضافة أوّل صورة.
        </Alert>
      )}

      {/* ── الصور ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">
          الصور <span className="num text-ink-500">({slider.slides.length})</span>
        </h2>
        <div className="mt-4">
          <SlidesManager
            sliderId={slider.id}
            slides={slider.slides.map((s) => ({
              id: s.id,
              imageUrl: s.imageUrl,
              alt: s.alt,
              linkUrl: s.linkUrl,
            }))}
            aspect={aspect}
            library={BUNDLED_IMAGES}
          />
        </div>
      </section>

      {/* ── الإعدادات ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">الإعدادات</h2>
        <AdminForm action={saveSliderAction} className="mt-4 space-y-4">
          <input type="hidden" name="id" value={slider.id} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="اسم العارض" name="name" defaultValue={slider.name} required hint="يظهر في لوحة الإدارة فقط" />
            <Field
              label="عنوان فوق العارض"
              name="title"
              defaultValue={slider.title}
              placeholder="اتركه فارغًا لعارض بلا عنوان"
              hint="يراه الزوّار"
            />
            <Select
              label="مكانه في الموقع"
              name="placement"
              defaultValue={slider.placement}
              options={placements.map((p) => ({ value: p.key, label: p.label }))}
              hint="الأماكن تتبع أقسام الصفحة: إن رتّبتها من «تصميم الموقع» انتقل العارض مع قسمه."
            />
            <Field
              label="الترتيب في الموضع نفسه"
              name="order"
              type="number"
              min={0}
              defaultValue={slider.order}
              hint="إن وُضع عدّة عارضات في المكان نفسه: الأصغر أوّلًا"
            />
            <Select
              label="عدد الصور الظاهرة معًا"
              name="perView"
              defaultValue={String(slider.perView)}
              options={PER_VIEW_OPTIONS.map((n) => ({
                value: String(n),
                label: n === 1 ? "صورة واحدة" : `${n} صور`,
              }))}
              hint="على الحاسوب. الهاتف يعرض صورة واحدة دائمًا، واللوحي صورتين كحدّ أقصى"
            />
            <Select
              label="الانتقال إلى الصورة التالية كل"
              name="intervalS"
              defaultValue={String(slider.intervalMs / 1000)}
              options={INTERVAL_OPTIONS_S.map((s) => ({ value: String(s), label: `${s} ثانية` }))}
              hint="الصور المليئة بالنصوص تحتاج وقتًا أطول لقراءتها"
            />
            <Select
              label="طريقة التنقّل عند آخر صورة"
              name="loopMode"
              defaultValue={slider.loopMode}
              options={LOOP_MODES.map((m) => ({ value: m.key, label: m.label }))}
            />
            <Select
              label="شكل الإطار"
              name="aspect"
              defaultValue={slider.aspect}
              options={SLIDER_ASPECTS.map((a) => ({ value: a.key, label: a.label }))}
              hint="الصور تُقصّ من الأطراف لتملأ الإطار — اختر الأقرب لمقاس صورك"
            />
          </div>
          {/* ── زرّ الدعوة ── */}
          <fieldset className="rounded-2xl border border-cream-300 bg-cream-50/60 p-4 sm:p-5">
            <legend className="px-2 font-display text-[14.5px] font-black text-ink-900">
              زرّ تحت العارض <span className="font-normal text-ink-500">(اختياري)</span>
            </legend>
            <p className="mb-4 text-[12.5px] leading-relaxed text-ink-500">
              زرّ بتصميم لافت — إطار متلألئ، لمعة، وهالات حوله — يدعو الزائر إلى
              خطوة واحدة. يظهر حين تملأ نصّه ورابطه معًا؛ امسحهما لإزالته.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="نصّ الزرّ"
                name="ctaLabel"
                defaultValue={slider.ctaLabel}
                placeholder="مثال: احجز مقعدك الآن"
                hint="قصير وواضح — فعل يبدأ به الزائر"
              />
              <Field
                label="رابط الزرّ"
                name="ctaUrl"
                dir="ltr"
                defaultValue={slider.ctaUrl}
                placeholder="/checkout/START"
                hint="‎#plans للباقات · ‎/register للتسجيل · أو رابط كامل (واتساب مثلًا)"
              />
              <Select
                label="لون الزرّ"
                name="ctaTone"
                defaultValue={slider.ctaTone}
                options={CTA_TONES.map((t) => ({ value: t.key, label: t.label }))}
              />
              <Field
                label="سطر صغير تحت الزرّ"
                name="ctaNote"
                defaultValue={slider.ctaNote}
                placeholder="مثال: سعر الإطلاق لفترة محدودة"
                hint="اختياري — يزيد الإحساس بالاستعجال"
              />
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle
              label="تشغيل تلقائي"
              name="autoplay"
              defaultChecked={slider.autoplay}
              hint="وإلا يتنقّل الزائر بالأسهم والسحب فقط"
            />
            <Toggle
              label="ظاهر في الموقع"
              name="isActive"
              defaultChecked={slider.isActive}
              hint="أخفِه مؤقّتًا دون حذف صوره"
            />
          </div>
          <SubmitButton>حفظ الإعدادات</SubmitButton>
        </AdminForm>
      </section>

      {/* ── معاينة بالإعدادات المحفوظة ── */}
      {slider.slides.length > 0 && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">معاينة</h2>
          <p className="mt-1 text-[13px] text-ink-500">
            كما يظهر للزوّار بالإعدادات المحفوظة. غيّر عرض النافذة لترى شكله على الهاتف.
          </p>
          <div className="mt-5">
            {slider.title && (
              <h3 className="mb-5 text-center font-display text-xl font-black text-ink-900">
                {slider.title}
              </h3>
            )}
            <ImageSlider
              // مفتاح يتغيّر مع الإعدادات: المعاينة تبدأ من جديد بعد كل حفظ
              key={`${slider.perView}-${slider.intervalMs}-${slider.aspect}-${slider.autoplay}-${slider.loopMode}`}
              slides={slider.slides.map((s) => ({ src: s.imageUrl, alt: s.alt, href: null }))}
              perView={slider.perView}
              intervalMs={slider.intervalMs}
              aspect={aspect}
              autoplay={slider.autoplay}
              mode={slider.loopMode === "loop" ? "loop" : "bounce"}
              label="معاينة العارض"
            />
            {cta && <CtaButton cta={cta} />}
          </div>
        </section>
      )}
    </div>
  );
}
