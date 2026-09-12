import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db, parseJson } from "@/lib/db";
import {
  saveLessonAction,
  deleteLessonAction,
  moveLessonAction,
  toggleLessonPublishAction,
  addResourceAction,
  deleteResourceAction,
} from "../../../actions";
import {
  AdminForm,
  Field,
  TextArea,
  Select,
  Toggle,
  SubmitButton,
  ActionButton,
} from "@/components/admin/Form";
import { Badge, LinkButton } from "@/components/ui";
import {
  IconArrowPrev,
  IconTrash,
  IconUpload,
  IconDocument,
  IconPlayCircle,
} from "@/components/ui/icons";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تحرير الدرس" };

export default async function LessonEditorPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ moduleId?: string }>;
}) {
  await requireAdmin();
  const [{ id }, { moduleId: newModuleId }] = await Promise.all([
    params,
    searchParams,
  ]);

  const isNew = id === "new";

  const lesson = isNew
    ? null
    : await db.lesson.findUnique({
        where: { id },
        include: {
          resources: { orderBy: { order: "asc" } },
          module: { include: { track: true } },
        },
      });

  if (!isNew && !lesson) notFound();

  const moduleId = lesson?.moduleId ?? newModuleId ?? "";
  const mod = await db.module.findUnique({
    where: { id: moduleId },
    include: { track: true, lessons: { orderBy: { order: "asc" } } },
  });
  if (!mod) notFound();

  const objectives = parseJson<string[]>(lesson?.objectives, []);
  const position = lesson
    ? mod.lessons.findIndex((l) => l.id === lesson.id) + 1
    : mod.lessons.length + 1;

  return (
    <div className="container-page max-w-4xl space-y-6 py-8">
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
              {isNew ? "درس جديد" : lesson!.title}
            </h1>
            <p className="mt-1 text-[13px] text-ink-500">
              {mod.track.title} · {mod.title} · الترتيب{" "}
              <span className="num">{position}</span>
            </p>
          </div>
          {lesson && (
            <div className="flex flex-wrap items-center gap-1.5">
              <ActionButton
                action={moveLessonAction.bind(null, lesson.id, "up")}
                tone="outline"
                title="تحريك لأعلى"
              >
                ↑
              </ActionButton>
              <ActionButton
                action={moveLessonAction.bind(null, lesson.id, "down")}
                tone="outline"
                title="تحريك لأسفل"
              >
                ↓
              </ActionButton>
              <ActionButton
                action={toggleLessonPublishAction.bind(null, lesson.id)}
                tone="outline"
              >
                {lesson.isPublished ? "إخفاء" : "نشر"}
              </ActionButton>
              <LinkButton
                href={`/learn/${lesson.id}`}
                size="sm"
                variant="outline"
              >
                <IconPlayCircle />
                معاينة
              </LinkButton>
              <ActionButton
                action={deleteLessonAction.bind(null, lesson.id)}
                tone="danger"
                confirm="سيُحذف الدرس وكل موارده وتقدّم الطلاب فيه نهائيًا. متابعة؟"
              >
                <IconTrash />
                حذف
              </ActionButton>
            </div>
          )}
        </div>
      </div>

      {/* ── بيانات الدرس ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">
          بيانات الدرس
        </h2>

        <div className="mt-5">
          <AdminForm action={saveLessonAction}>
            {lesson && <input type="hidden" name="id" value={lesson.id} />}
            {!lesson && <input type="hidden" name="moduleId" value={mod.id} />}

            <Field
              label="عنوان الدرس"
              name="title"
              required
              defaultValue={lesson?.title}
              placeholder="مثال: المقدمة في الإنشاء التاريخي"
            />

            <TextArea
              label="وصف مختصر"
              name="summary"
              rows={3}
              defaultValue={lesson?.summary}
              placeholder="سطر أو سطران يشرحان محتوى الدرس للطالب."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="رابط الفيديو"
                name="videoUrl"
                dir="ltr"
                defaultValue={lesson?.videoUrl}
                placeholder="https://youtu.be/…"
                hint="يوتيوب، فيميو، Bunny، أو رابط MP4 مباشر."
              />
              <Select
                label="مزوّد الفيديو"
                name="videoProvider"
                defaultValue={lesson?.videoProvider ?? "youtube"}
                options={[
                  { value: "youtube", label: "YouTube" },
                  { value: "vimeo", label: "Vimeo" },
                  { value: "bunny", label: "Bunny Stream" },
                  { value: "direct", label: "رابط مباشر (MP4)" },
                ]}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="المدّة بالدقائق"
                name="durationMinutes"
                type="number"
                min={0}
                max={600}
                defaultValue={lesson?.durationMinutes ?? 10}
              />
              <Field
                label="الترتيب"
                name="order"
                type="number"
                min={0}
                defaultValue={lesson?.order ?? mod.lessons.length}
              />
              <Select
                label="الباقة المطلوبة"
                name="requiredPlan"
                defaultValue={lesson?.requiredPlan ?? "start"}
                options={[
                  { value: "start", label: "START (الجميع)" },
                  { value: "premium", label: "PREMIUM ELITE فقط" },
                ]}
              />
            </div>

            <TextArea
              label="أهداف الدرس"
              name="objectives"
              rows={4}
              defaultValue={objectives.join("\n")}
              hint="هدف واحد في كل سطر."
              placeholder={"بناء تمهيد مرتبط بالموضوع\nصياغة إشكالية دقيقة"}
            />

            <TextArea
              label="محتوى الدرس المكتوب"
              name="content"
              rows={6}
              mono
              defaultValue={lesson?.content}
              hint="يقبل HTML بسيطًا: <p> <h3> <ul> <li> <strong>."
            />

            <TextArea
              label="تمرين الدرس"
              name="exercise"
              rows={3}
              defaultValue={lesson?.exercise}
              placeholder="اتركه فارغًا إن لم يكن هناك تمرين."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle
                label="منشور"
                name="isPublished"
                defaultChecked={lesson?.isPublished ?? true}
                hint="الدروس غير المنشورة لا تظهر للطلاب."
              />
              <Toggle
                label="معاينة مجانية"
                name="isFreePreview"
                defaultChecked={lesson?.isFreePreview ?? false}
                hint="يظهر للزوّار قبل الاشتراك."
              />
            </div>

            <div className="flex gap-2 pt-1">
              <SubmitButton>{isNew ? "إنشاء الدرس" : "حفظ التغييرات"}</SubmitButton>
              <LinkButton href="/admin/content" variant="ghost">
                إلغاء
              </LinkButton>
            </div>
          </AdminForm>
        </div>
      </section>

      {/* ── الموارد ── */}
      {lesson && (
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            الملفات والموارد
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            ارفع ملفًا من جهازك أو ألصق رابطًا خارجيًا.
          </p>

          {lesson.resources.length > 0 && (
            <ul className="mt-4 divide-y divide-cream-200 overflow-hidden rounded-xl border border-cream-200">
              {lesson.resources.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center gap-3 bg-white px-4 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cream-100 text-ink-700">
                    <IconDocument />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-ink-900">
                      {r.title}
                    </span>
                    <span dir="ltr" className="block truncate text-right text-[11.5px] text-ink-500">
                      {r.url}
                    </span>
                  </span>
                  <Badge tone="slate">
                    {RESOURCE_TYPE_LABELS[r.type] ?? r.type}
                  </Badge>
                  {r.requiredPlan === "premium" && (
                    <Badge tone="gold">PREMIUM</Badge>
                  )}
                  <ActionButton
                    action={deleteResourceAction.bind(null, r.id)}
                    tone="danger"
                    confirm="حذف هذا المورد؟"
                  >
                    <IconTrash />
                  </ActionButton>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-5 rounded-2xl border border-dashed border-cream-300 bg-cream-50/60 p-4">
            <AdminForm action={addResourceAction} className="space-y-3">
              <input type="hidden" name="lessonId" value={lesson.id} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="عنوان المورد"
                  name="title"
                  required
                  placeholder="ملخّص الدرس.pdf"
                />
                <Select
                  label="النوع"
                  name="type"
                  options={[
                    { value: "pdf", label: "ملف PDF" },
                    { value: "doc", label: "مستند" },
                    { value: "image", label: "صورة" },
                    { value: "audio", label: "ملف صوتي" },
                    { value: "link", label: "رابط خارجي" },
                  ]}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
                    رفع ملف
                  </span>
                  <input
                    type="file"
                    name="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-[13px] file:mr-0 file:ml-3 file:rounded-lg file:border-0 file:bg-ink-900 file:px-3 file:py-1.5 file:text-[12px] file:font-bold file:text-white"
                  />
                </label>
                <Field
                  label="أو رابط خارجي"
                  name="url"
                  dir="ltr"
                  placeholder="https://…"
                />
              </div>
              <Select
                label="الباقة المطلوبة"
                name="requiredPlan"
                options={[
                  { value: "start", label: "START (الجميع)" },
                  { value: "premium", label: "PREMIUM ELITE فقط" },
                ]}
              />
              <SubmitButton variant="brand">
                <IconUpload />
                إضافة المورد
              </SubmitButton>
            </AdminForm>
          </div>
        </section>
      )}
    </div>
  );
}
