import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { CTA_TONES, isCtaTone } from "@/lib/sliders";
import { isDarkPlacement, placementLabel, placementRank, placementsFor } from "@/lib/placements";
import { LINK_HINT } from "@/lib/links";
import { createButtonAction, deleteButtonAction, saveButtonAction, toggleButtonAction } from "./actions";
import { AdminForm, ActionButton, Field, Select, SubmitButton, Toggle } from "@/components/admin/Form";
import { CtaButton } from "@/components/marketing/CtaButton";
import { Badge, EmptyState } from "@/components/ui";
import { IconPlus, IconTrash } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الأزرار" };

type ButtonRow = {
  label: string;
  url: string;
  tone: string;
  title: string | null;
  note: string | null;
  placement: string;
  order: number;
};

/** حقول الزرّ — مشتركة بين نموذج الإضافة ونموذج التعديل */
function ButtonFields({ b }: { b?: ButtonRow }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="نصّ الزرّ"
        name="label"
        required
        defaultValue={b?.label}
        placeholder="مثال: احجز مقعدك الآن"
        hint="قصير وواضح — فعل يبدأ به الزائر"
      />
      <Field
        label="رابط الزرّ"
        name="url"
        dir="ltr"
        required
        defaultValue={b?.url}
        placeholder="#plans"
        hint={LINK_HINT}
      />
      <Select
        label="مكانه في الموقع"
        name="placement"
        defaultValue={b?.placement ?? "home.afterAbout"}
        options={placementsFor("button").map((p) => ({ value: p.key, label: p.label }))}
      />
      <Select
        label="لون الزرّ"
        name="tone"
        defaultValue={b?.tone ?? "brand"}
        options={CTA_TONES.map((t) => ({ value: t.key, label: t.label }))}
      />
      <Field
        label="عنوان فوق الزرّ (اختياري)"
        name="title"
        defaultValue={b?.title}
        placeholder="مثال: جاهز لتضاعف نقطتك؟"
      />
      <Field
        label="سطر صغير تحت الزرّ (اختياري)"
        name="note"
        defaultValue={b?.note}
        placeholder="مثال: سعر الإطلاق لفترة محدودة"
      />
      <Field
        label="الترتيب في المكان نفسه"
        name="order"
        type="number"
        defaultValue={b?.order ?? 0}
        hint="مع عارض أو زرّ آخر في المكان نفسه: الأصغر أوّلًا"
      />
    </div>
  );
}

/** معاينة على خلفية تشبه خلفية المكان في الموقع */
function Preview({ b }: { b: ButtonRow }) {
  const dark = isDarkPlacement(b.placement);
  return (
    <div
      className={`rounded-2xl px-4 py-9 ${
        dark ? "brand-gradient brand-texture" : "bg-cream-100 ring-1 ring-cream-300"
      }`}
    >
      <div className="text-center">
        {b.title && (
          <p className={`font-display text-lg font-black ${dark ? "text-white" : "text-ink-900"}`}>
            {b.title}
          </p>
        )}
        <CtaButton
          cta={{ label: b.label, href: b.url, tone: isCtaTone(b.tone) ? b.tone : "brand", note: b.note }}
          dark={dark}
          className={b.title ? "mt-5" : ""}
        />
      </div>
    </div>
  );
}

export default async function ButtonsPage() {
  await requireAdmin();
  const buttons = await db.siteButton.findMany({ orderBy: [{ order: "asc" }, { createdAt: "asc" }] });
  buttons.sort((a, b) => placementRank(a.placement) - placementRank(b.placement) || a.order - b.order);

  return (
    <div className="container-page max-w-5xl space-y-7 py-8">
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900">الأزرار</h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
          أزرار دعوة بتصميم لافت — إطار متلألئ، لمعة، وهالات حوله — تضعها حيث
          شئت: داخل الواجهة الأولى، بين أيّ قسمين في الصفحة الرئيسية، في لوحة
          الطالب، أو أسفل الدروس. ولزرّ تحت عارض بعينه، اضبطه من{" "}
          <Link href="/admin/sliders" className="font-bold text-brand-700 hover:underline">
            إعدادات العارض
          </Link>
          .
        </p>
      </header>

      {/* ── إضافة زرّ ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="flex items-center gap-2 font-display text-[16px] font-black text-ink-900">
          <IconPlus />
          زرّ جديد
        </h2>
        <AdminForm action={createButtonAction} className="mt-4 space-y-4">
          <ButtonFields />
          <SubmitButton variant="brand">إضافة الزرّ</SubmitButton>
        </AdminForm>
      </section>

      {/* ── الأزرار ── */}
      {buttons.length === 0 ? (
        <EmptyState title="لا أزرار بعد" description="أضف أوّل زرّ من النموذج أعلاه." />
      ) : (
        <ul className="space-y-4">
          {buttons.map((b) => (
            <li key={b.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-cream-200 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-display text-[15px] font-black text-ink-900">{b.label}</span>
                    {b.isActive ? <Badge tone="green">ظاهر</Badge> : <Badge tone="ink">مخفي</Badge>}
                  </div>
                  <p className="mt-1 text-[12.5px] text-ink-500">{placementLabel(b.placement)}</p>
                  <p className="mt-0.5 truncate text-[12px] text-ink-300" dir="ltr">
                    {b.url}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <ActionButton action={toggleButtonAction.bind(null, b.id)} tone="outline">
                    {b.isActive ? "إخفاء" : "إظهار"}
                  </ActionButton>
                  <ActionButton
                    action={deleteButtonAction.bind(null, b.id)}
                    tone="danger"
                    confirm={`حذف الزرّ «${b.label}»؟`}
                    title="حذف"
                  >
                    <IconTrash />
                  </ActionButton>
                </div>
              </div>

              <div className="p-5">
                <Preview b={b} />
                <details className="mt-4 rounded-xl border border-cream-300">
                  <summary className="cursor-pointer px-4 py-3 text-[13.5px] font-bold text-ink-700 hover:text-brand-700">
                    تعديل الزرّ
                  </summary>
                  <div className="border-t border-cream-200 p-4">
                    <AdminForm action={saveButtonAction} className="space-y-4">
                      <input type="hidden" name="id" value={b.id} />
                      <ButtonFields b={b} />
                      <Toggle label="ظاهر في الموقع" name="isActive" defaultChecked={b.isActive} />
                      <SubmitButton>حفظ التعديل</SubmitButton>
                    </AdminForm>
                  </div>
                </details>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
