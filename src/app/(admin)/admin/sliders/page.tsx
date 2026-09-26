import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  ensureDefaultSlider,
  imagesCount,
  placementLabel,
  SLIDER_ASPECTS,
  SLIDER_PLACEMENTS,
} from "@/lib/sliders";
import { createSliderAction, deleteSliderAction, toggleSliderAction } from "./actions";
import { AdminForm, ActionButton, Field, Select, SubmitButton } from "@/components/admin/Form";
import { Badge, EmptyState } from "@/components/ui";
import { IconPlus, IconTrash, IconEdit } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "السلايدر" };

export default async function SlidersPage() {
  await requireAdmin();
  await ensureDefaultSlider();

  const sliders = await db.slider.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: {
      slides: { orderBy: [{ order: "asc" }, { createdAt: "asc" }], take: 5 },
      _count: { select: { slides: true } },
    },
  });

  // بترتيب ظهور المواضع في الموقع، لا بترتيب الإنشاء
  const rank = (p: string) => SLIDER_PLACEMENTS.findIndex((x) => x.key === p);
  sliders.sort((a, b) => rank(a.placement) - rank(b.placement) || a.order - b.order);

  return (
    <div className="container-page max-w-5xl space-y-7 py-8">
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900">السلايدر</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
          عارضات صور تتقدّم تلقائيًا. أنشئ ما شئت منها، واختر لكلّ عارض موضعه في
          الموقع، ثم أضف صوره ورتّبها. العارض الذي لا صور فيه، أو المخفي، لا يظهر للزوّار.
        </p>
      </header>

      {/* ── إنشاء عارض ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[16px] font-black text-ink-900">
          <IconPlus />
          عارض جديد
        </h2>
        <AdminForm action={createSliderAction} className="mt-4 grid items-end gap-4 sm:grid-cols-[1fr_1.4fr_auto]">
          <Field
            label="اسم العارض"
            name="name"
            required
            placeholder="مثال: إعلانات الأسبوع"
            hint="للتعرّف عليه هنا فقط — لا يراه الزوّار"
          />
          <Select
            label="مكانه في الموقع"
            name="placement"
            defaultValue="home.afterAbout"
            options={SLIDER_PLACEMENTS.map((p) => ({ value: p.key, label: p.label }))}
            hint="يمكن تغييره لاحقًا"
          />
          <div className="sm:pb-6">
            <SubmitButton variant="brand">إنشاء وإضافة الصور</SubmitButton>
          </div>
        </AdminForm>
      </section>

      {/* ── العارضات ── */}
      {sliders.length === 0 ? (
        <EmptyState
          title="لا عارضات بعد"
          description="أنشئ أوّل عارض من النموذج أعلاه."
        />
      ) : (
        <ul className="space-y-4">
          {sliders.map((s) => {
            const aspect = SLIDER_ASPECTS.find((a) => a.key === s.aspect) ?? SLIDER_ASPECTS[0];
            const empty = s._count.slides === 0;
            return (
              <li key={s.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/admin/sliders/${s.id}`}
                        className="font-display text-[16px] font-black text-ink-900 hover:text-brand-700"
                      >
                        {s.name}
                      </Link>
                      {!s.isActive ? (
                        <Badge tone="ink">مخفي</Badge>
                      ) : empty ? (
                        <Badge tone="gold">لا صور — غير ظاهر</Badge>
                      ) : (
                        <Badge tone="green">ظاهر في الموقع</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-[13px] text-ink-500">{placementLabel(s.placement)}</p>
                    <p className="num mt-1 text-[12px] text-ink-500">
                      {imagesCount(s._count.slides)} · {s.perView} معًا على الحاسوب ·{" "}
                      كل {s.intervalMs / 1000} ث · {aspect.label}
                      {!s.autoplay && " · بلا تشغيل تلقائي"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-1">
                    <Link
                      href={`/admin/sliders/${s.id}`}
                      className="font-ui inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-3 text-[13px] font-bold text-white hover:bg-ink-800"
                    >
                      <IconEdit />
                      الصور والإعدادات
                    </Link>
                    <ActionButton action={toggleSliderAction.bind(null, s.id)} tone="outline">
                      {s.isActive ? "إخفاء" : "إظهار"}
                    </ActionButton>
                    <ActionButton
                      action={deleteSliderAction.bind(null, s.id)}
                      tone="danger"
                      confirm={`حذف العارض «${s.name}» وصوره (${imagesCount(s._count.slides)})؟ لا يمكن التراجع.`}
                      title="حذف العارض"
                    >
                      <IconTrash />
                    </ActionButton>
                  </div>
                </div>

                {!empty && (
                  <Link
                    href={`/admin/sliders/${s.id}`}
                    className="flex gap-2 overflow-hidden border-t border-cream-200 bg-cream-50/60 px-5 py-3"
                  >
                    {s.slides.map((sl) => (
                      <span
                        key={sl.id}
                        className="relative h-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-cream-300"
                        style={{ aspectRatio: aspect.css }}
                      >
                        <Image src={sl.imageUrl} alt={sl.alt} fill sizes="120px" className="object-cover" />
                      </span>
                    ))}
                    {s._count.slides > s.slides.length && (
                      <span className="num grid h-20 shrink-0 place-items-center px-3 text-[13px] font-bold text-ink-500">
                        +{s._count.slides - s.slides.length}
                      </span>
                    )}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
