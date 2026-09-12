import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  saveCourseAction,
  saveTrackAction,
  deleteTrackAction,
} from "../../actions";
import {
  AdminForm,
  Field,
  TextArea,
  Toggle,
  SubmitButton,
  ActionButton,
} from "@/components/admin/Form";
import { Badge } from "@/components/ui";
import { IconArrowPrev, IconTrash, IconPlus } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "بيانات البرنامج" };

export default async function CourseEditorPage() {
  await requireAdmin();

  const course = await db.course.findFirst({
    orderBy: { order: "asc" },
    include: {
      tracks: {
        orderBy: { order: "asc" },
        include: { _count: { select: { modules: true } } },
      },
    },
  });
  if (!course) notFound();

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
        <h1 className="mt-3 font-display text-xl font-black text-ink-900 sm:text-2xl">
          بيانات البرنامج والمسارات
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-500">
          هذه البيانات تظهر في الصفحة الرئيسية وصفحة الدفع وشهادة الإتمام.
        </p>
      </div>

      {/* ── البرنامج ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">
          البرنامج
        </h2>
        <div className="mt-5">
          <AdminForm action={saveCourseAction}>
            <input type="hidden" name="id" value={course.id} />

            <Field
              label="عنوان البرنامج"
              name="title"
              required
              defaultValue={course.title}
            />
            <Field
              label="العنوان الفرعي"
              name="subtitle"
              defaultValue={course.subtitle}
              placeholder="برنامج تدريبي مسجّل لطلبة البكالوريا"
            />
            <TextArea
              label="وصف البرنامج"
              name="description"
              rows={5}
              defaultValue={course.description}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="اسم المدرّس"
                name="instructor"
                defaultValue={course.instructor}
              />
              <Field
                label="مدّة البرنامج"
                name="durationText"
                defaultValue={course.durationText}
                placeholder="بإيقاعك — حوالي شهرين"
              />
            </div>
            <Toggle
              label="منشور"
              name="isPublished"
              defaultChecked={course.isPublished}
              hint="عند الإخفاء لا يظهر البرنامج في الموقع العام."
            />
            <SubmitButton>حفظ بيانات البرنامج</SubmitButton>
          </AdminForm>
        </div>
      </section>

      {/* ── المسارات ── */}
      <section className="space-y-3">
        <h2 className="font-display text-[16px] font-black text-ink-900">
          المسارات (المواد)
        </h2>

        {course.tracks.map((track) => (
          <details key={track.id} className="card overflow-hidden">
            <summary className="flex cursor-pointer items-center gap-3 px-5 py-4 hover:bg-cream-50">
              <span
                className="size-3 shrink-0 rounded-full"
                style={{ background: track.color ?? "#00B7B5" }}
              />
              <span className="min-w-0 flex-1">
                <span className="block font-display text-[15px] font-bold text-ink-900">
                  {track.title}
                </span>
                <span className="num text-[12px] text-ink-500">
                  {track._count.modules} وحدات · الترتيب {track.order}
                </span>
              </span>
              {!track.isPublished && <Badge tone="slate">مخفي</Badge>}
            </summary>

            <div className="border-t border-cream-200 bg-cream-50/60 p-5">
              <AdminForm action={saveTrackAction}>
                <input type="hidden" name="id" value={track.id} />

                <Field
                  label="عنوان المسار"
                  name="title"
                  required
                  defaultValue={track.title}
                />
                <TextArea
                  label="وصف المسار"
                  name="description"
                  rows={2}
                  defaultValue={track.description}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field
                    label="اللون المميّز"
                    name="color"
                    dir="ltr"
                    defaultValue={track.color ?? "#00B7B5"}
                    hint="رمز لوني مثل ‎#005461"
                  />
                  <Field
                    label="الترتيب"
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={track.order}
                    hint="الأصغر يظهر أولًا — ويُدرَس أولًا في التدرّج."
                  />
                </div>
                <Toggle
                  label="منشور"
                  name="isPublished"
                  defaultChecked={track.isPublished}
                />
                <div className="flex gap-2">
                  <SubmitButton>حفظ المسار</SubmitButton>
                  <ActionButton
                    action={deleteTrackAction.bind(null, track.id)}
                    tone="danger"
                    confirm={`سيُحذف «${track.title}» مع ${track._count.modules} وحدات وكل دروسها واختباراتها وتقدّم الطلاب فيها. لا يمكن التراجع. متابعة؟`}
                  >
                    <IconTrash />
                    حذف المسار
                  </ActionButton>
                </div>
              </AdminForm>
            </div>
          </details>
        ))}

        {/* ── مسار جديد ── */}
        <details className="card overflow-hidden">
          <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-display text-[15px] font-bold text-brand-700 hover:bg-cream-50">
            <IconPlus />
            إضافة مسار جديد
          </summary>
          <div className="border-t border-cream-200 bg-cream-50/60 p-5">
            <AdminForm action={saveTrackAction}>
              <input type="hidden" name="courseId" value={course.id} />
              <Field
                label="عنوان المسار"
                name="title"
                required
                placeholder="مثال: التربية على المواطنة"
              />
              <Field
                label="المعرّف (بالإنجليزية)"
                name="slug"
                dir="ltr"
                placeholder="civics"
                hint="حروف لاتينية بلا مسافات."
              />
              <TextArea label="وصف المسار" name="description" rows={2} />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="اللون المميّز"
                  name="color"
                  dir="ltr"
                  defaultValue="#00B7B5"
                />
                <Field
                  label="الترتيب"
                  name="order"
                  type="number"
                  min={0}
                  defaultValue={course.tracks.length}
                />
              </div>
              <Toggle label="منشور" name="isPublished" defaultChecked />
              <SubmitButton variant="brand">
                <IconPlus />
                إنشاء المسار
              </SubmitButton>
            </AdminForm>
          </div>
        </details>
      </section>
    </div>
  );
}
