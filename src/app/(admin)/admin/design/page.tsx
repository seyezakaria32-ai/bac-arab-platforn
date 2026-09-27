import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { normalizeFonts } from "@/lib/fonts";
import { IN_ABOUT, IN_HERO } from "@/lib/placements";
import { SECTION_DEFS, SECTION_TYPES } from "@/lib/sections/registry";
import { getHomeSections } from "@/lib/sections/server";
import { saveSiteTextsAction } from "./actions";
import { SectionsManager, type SectionRow, type SectionTypeOption } from "@/components/admin/design/SectionsManager";
import { FontPicker } from "@/components/admin/design/FontPicker";
import { AdminForm, Field, SubmitButton, TextArea } from "@/components/admin/Form";
import { LinkButton } from "@/components/ui";
import { IconArrowNext } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تصميم الموقع" };

export default async function DesignPage() {
  await requireAdmin();
  const [sections, settings, sliders, buttons] = await Promise.all([
    getHomeSections(),
    getSettings(),
    db.slider.findMany({ select: { id: true, name: true, placement: true } }),
    db.siteButton.findMany({ select: { label: true, placement: true } }),
  ]);

  // ما وُضع بعد كل قسم (أو داخله) من سلايدر وأزرار — ليرى المدير ما يتحرّك مع القسم
  const attachedTo = (s: (typeof sections)[number]) => {
    const keys = [`home.after:${s.id}`];
    if (s.type === "hero") keys.push(IN_HERO);
    if (s.type === "about") keys.push(IN_ABOUT);
    return [
      ...sliders
        .filter((x) => keys.includes(x.placement))
        .map((x) => ({ label: `سلايدر: ${x.name}`, href: `/admin/sliders/${x.id}` })),
      ...buttons
        .filter((x) => keys.includes(x.placement))
        .map((x) => ({ label: `زرّ: ${x.label}`, href: "/admin/buttons" })),
    ];
  };

  const rows: SectionRow[] = sections.map((s) => ({
    id: s.id,
    name: s.name,
    typeLabel: SECTION_DEFS[s.type].label,
    icon: SECTION_DEFS[s.type].icon,
    isVisible: s.isVisible,
    menuLabel: typeof s.values.menuLabel === "string" ? s.values.menuLabel : "",
    anchor: s.anchor,
    attached: attachedTo(s),
  }));

  // الأنواع التي تتكرّر أوّلًا — هي ما يُضاف عادةً — ثم الأقسام الأصلية المحذوفة
  const byMultiple = [...SECTION_TYPES].sort(
    (a, b) => Number(SECTION_DEFS[b].multiple) - Number(SECTION_DEFS[a].multiple),
  );
  const types: SectionTypeOption[] = byMultiple.map((t) => ({
    type: t,
    label: SECTION_DEFS[t].label,
    description: SECTION_DEFS[t].description,
    icon: SECTION_DEFS[t].icon,
    available: SECTION_DEFS[t].multiple || !sections.some((s) => s.type === t),
  }));

  return (
    <div className="container-page max-w-5xl space-y-7 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink-900">تصميم الموقع</h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
            كل ما في الصفحة الرئيسية من هنا: رتّب الأقسام، أخفِها أو احذفها، عدّل نصوصها
            وصورها، وأضف أقسامًا جديدة. واختر خطوط الموقع ونصوصه العامّة.
          </p>
        </div>
        <LinkButton href="/" variant="outline" size="sm" target="_blank">
          معاينة الصفحة الرئيسية
          <IconArrowNext />
        </LinkButton>
      </header>

      {/* ── الأقسام ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">أقسام الصفحة الرئيسية</h2>
        <div className="mt-4">
          <SectionsManager rows={rows} types={types} />
        </div>
      </section>

      {/* ── الخطوط ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">الخطوط</h2>
        <p className="mt-1 mb-4 text-[13px] text-ink-500">
          خطّ لكل دور في الموقع كلّه — الصفحة الرئيسية ولوحة الطالب والدروس.
        </p>
        <FontPicker current={normalizeFonts(settings["theme.fonts"])} />
      </section>

      {/* ── النصوص العامّة ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">النصوص العامّة</h2>
        <p className="mt-1 mb-4 text-[13px] text-ink-500">
          ما يظهر في نتائج البحث وبطاقات المشاركة (واتساب، فيسبوك)، والنصّ أسفل كل صفحة.
          روابط القائمة العلوية تُضبط من كل قسم: «اسمه في القائمة العلوية».
        </p>
        <AdminForm action={saveSiteTextsAction} className="space-y-4">
          <Field label="عنوان الموقع" name="seoTitle" defaultValue={settings["site.seoTitle"]} required />
          <TextArea label="وصف الموقع" name="seoDescription" rows={3} defaultValue={settings["site.seoDescription"]} />
          <TextArea label="النصّ أسفل الصفحة (تحت الشعار)" name="footerText" rows={3} defaultValue={settings["site.footerText"]} />
          <SubmitButton>حفظ النصوص</SubmitButton>
        </AdminForm>
      </section>

      {/* ── روابط ما يُدار في صفحات أخرى ── */}
      <section className="grid gap-3 sm:grid-cols-2">
        {[
          { href: "/admin/sliders", title: "السلايدر", text: "عارضات الصور ومكانها في الصفحة" },
          { href: "/admin/buttons", title: "الأزرار", text: "أزرار الدعوة اللافتة في أيّ مكان" },
          { href: "/admin/content", title: "المحتوى", text: "الوحدات والدروس في «محتوى البرنامج»" },
          { href: "/admin/plans", title: "الباقات", text: "أسماء الباقات وأسعارها ومزاياها" },
        ].map((l) => (
          <Link key={l.href} href={l.href} className="card flex items-center justify-between gap-3 p-4 hover:border-brand-300">
            <span>
              <span className="block font-display text-[14.5px] font-bold text-ink-900">{l.title}</span>
              <span className="block text-[12.5px] text-ink-500">{l.text}</span>
            </span>
            <IconArrowNext className="text-ink-300" />
          </Link>
        ))}
      </section>
    </div>
  );
}
