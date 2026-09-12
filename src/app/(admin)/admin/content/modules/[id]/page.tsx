import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { saveModuleAction, deleteModuleAction } from "../../../actions";
import {
  AdminForm,
  Field,
  TextArea,
  Select,
  Toggle,
  SubmitButton,
  ActionButton,
} from "@/components/admin/Form";
import { LinkButton } from "@/components/ui";
import { IconArrowPrev, IconTrash, IconTarget } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تحرير الوحدة" };

export default async function ModuleEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ trackId?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { trackId }] = await Promise.all([params, searchParams]);
  const isNew = id === "new";

  const mod = isNew
    ? null
    : await db.module.findUnique({
        where: { id },
        include: { track: true, lessons: true, quiz: true },
      });
  if (!isNew && !mod) notFound();

  const track = await db.track.findUnique({
    where: { id: mod?.trackId ?? trackId ?? "" },
    include: { modules: true },
  });
  if (!track) notFound();

  return (
    <div className="container-page max-w-3xl space-y-6 py-8">
      <div>
        <Link
          href="/admin/content"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-700"
        >
          <IconArrowPrev />
          إدارة المحتوى
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="font-display text-xl font-black text-ink-900 sm:text-2xl">
              {isNew ? "وحدة جديدة" : mod!.title}
            </h1>
            <p className="num mt-1 text-[13px] text-ink-500">
              {track.title}
              {mod ? ` · ${mod.lessons.length} درسًا` : ""}
            </p>
          </div>
          <div className="flex gap-1.5">
            {mod && (
              <>
                <LinkButton
                  href={`/admin/content/quizzes/${mod.id}`}
                  size="sm"
                  variant="outline"
                >
                  <IconTarget />
                  اختبار الوحدة
                </LinkButton>
                <ActionButton
                  action={deleteModuleAction.bind(null, mod.id)}
                  tone="danger"
                  confirm={`سيُحذف «${mod.title}» مع ${mod.lessons.length} درسًا واختبارها وتقدّم الطلاب فيها. متابعة؟`}
                >
                  <IconTrash />
                  حذف الوحدة
                </ActionButton>
              </>
            )}
          </div>
        </div>
      </div>

      <section className="card p-5 sm:p-6">
        <AdminForm action={saveModuleAction}>
          {mod && <input type="hidden" name="id" value={mod.id} />}
          {!mod && <input type="hidden" name="trackId" value={track.id} />}

          <Field
            label="عنوان الوحدة"
            name="title"
            required
            defaultValue={mod?.title}
            placeholder="مثال: الوحدة 4: تمارين تطبيقية"
          />

          <TextArea
            label="وصف الوحدة"
            name="description"
            rows={3}
            defaultValue={mod?.description}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="الترتيب"
              name="order"
              type="number"
              min={0}
              defaultValue={mod?.order ?? track.modules.length}
              hint="الأصغر يظهر أولًا."
            />
            <Select
              label="الباقة المطلوبة"
              name="requiredPlan"
              defaultValue={mod?.requiredPlan ?? "start"}
              options={[
                { value: "start", label: "START (الجميع)" },
                { value: "premium", label: "PREMIUM ELITE فقط" },
              ]}
            />
          </div>

          <Toggle
            label="منشورة"
            name="isPublished"
            defaultChecked={mod?.isPublished ?? true}
            hint="الوحدات غير المنشورة لا تظهر في المنهج."
          />

          <div className="flex gap-2 pt-1">
            <SubmitButton>{isNew ? "إنشاء الوحدة" : "حفظ التغييرات"}</SubmitButton>
            <LinkButton href="/admin/content" variant="ghost">
              إلغاء
            </LinkButton>
          </div>
        </AdminForm>
      </section>

      {mod && mod.lessons.length > 0 && (
        <section className="card p-5">
          <h2 className="font-display text-[15px] font-black text-ink-900">
            دروس الوحدة
          </h2>
          <ul className="mt-3 space-y-1.5">
            {mod.lessons
              .sort((a, b) => a.order - b.order)
              .map((l, i) => (
                <li key={l.id}>
                  <Link
                    href={`/admin/content/lessons/${l.id}`}
                    className="flex items-center gap-3 rounded-xl bg-cream-50 px-4 py-2.5 text-[13.5px] transition-colors hover:bg-cream-100"
                  >
                    <span className="num w-5 text-[11.5px] text-ink-300">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-ink-800">
                      {l.title}
                    </span>
                  </Link>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
}
