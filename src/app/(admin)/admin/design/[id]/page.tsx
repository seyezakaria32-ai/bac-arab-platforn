import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { BUNDLED_IMAGES, getSettings } from "@/lib/settings";
import { SECTION_DEFS } from "@/lib/sections/registry";
import { getHomeSections, getSection } from "@/lib/sections/server";
import { getSectionContext } from "@/lib/sections/context";
import { toggleSectionAction } from "../actions";
import { SectionEditor } from "@/components/admin/design/SectionEditor";
import { IntroVideoForm } from "@/components/admin/IntroVideoForm";
import { ActionButton } from "@/components/admin/Form";
import { RenderSection, willRender } from "@/components/sections";
import { Alert, Badge } from "@/components/ui";
import { IconArrowPrev } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تعديل قسم" };

export default async function SectionEditPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const section = await getSection(id);
  if (!section) notFound();

  const def = SECTION_DEFS[section.type];
  const [ctx, settings, sections] = await Promise.all([getSectionContext(), getSettings(), getHomeSections()]);
  // للمعاينة: شريط المزايا يلتصق بالواجهة الأولى إن كان بعدها في الصفحة
  const index = sections.findIndex((s) => s.id === section.id);
  const prevType = index > 0 ? sections[index - 1].type : undefined;
  const previewable = willRender({ ...section, isVisible: true }, ctx);

  return (
    <div className="container-page max-w-5xl space-y-6 py-8">
      <div>
        <Link
          href="/admin/design"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 hover:text-brand-700"
        >
          <IconArrowPrev />
          كل الأقسام
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-black text-ink-900">{section.name}</h1>
            {section.name !== def.label && <Badge tone="ink">{def.label}</Badge>}
            {!section.isVisible && <Badge tone="gold">مخفي عن الزوّار</Badge>}
          </div>
          <div className="flex items-center gap-2">
            <ActionButton action={toggleSectionAction.bind(null, section.id)} tone="outline">
              {section.isVisible ? "إخفاء القسم" : "إظهار القسم"}
            </ActionButton>
            <Link
              href={`/#${section.anchor}`}
              target="_blank"
              className="font-ui inline-flex h-9 items-center rounded-lg border border-cream-300 bg-white px-3 text-[13px] font-bold text-ink-700 hover:border-brand-300"
            >
              عرضه في الموقع ↗
            </Link>
          </div>
        </div>
        <p className="mt-1 text-[13px] text-ink-500">{def.description}</p>
      </div>

      {def.editorNote && <Alert tone="info">{def.editorNote}</Alert>}

      {/* الفيديو التعريفي: الفيديو نفسه (رابطًا أو ملفًّا مرفوعًا) في نموذجه الخاصّ */}
      {section.type === "video" && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">الفيديو</h2>
          <div className="mt-4">
            <IntroVideoForm current={settings["site.introVideo"]} fallbackPoster={ctx.heroImage} />
          </div>
        </section>
      )}

      <section className="card p-5 sm:p-6">
        <h2 className="mb-4 font-display text-[16px] font-black text-ink-900">
          {section.type === "video" ? "حول الفيديو" : "المحتوى"}
        </h2>
        <SectionEditor id={section.id} type={section.type} initial={section.values} library={BUNDLED_IMAGES} />
      </section>

      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">معاينة</h2>
        <p className="mt-1 mb-4 text-[13px] text-ink-500">كما يظهر للزوّار بالمحتوى المحفوظ.</p>
        {previewable ? (
          <div className="overflow-hidden rounded-2xl bg-cream-100 ring-1 ring-cream-300">
            <RenderSection section={section} ctx={ctx} prevType={prevType} />
          </div>
        ) : (
          <Alert tone="info">
            {section.type === "video"
              ? "لا يظهر هذا القسم ما دام رابط الفيديو فارغًا — أضفه في النموذج أعلاه."
              : "لا يظهر هذا القسم ما دام رابط الفيديو فارغًا أو غير مفهوم — ألصق رابط يوتيوب أو فيميو واحفظ."}
          </Alert>
        )}
      </section>
    </div>
  );
}
