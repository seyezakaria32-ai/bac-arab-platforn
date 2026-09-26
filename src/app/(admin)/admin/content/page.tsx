import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Badge, LinkButton, EmptyState } from "@/components/ui";
import {
  IconPlus,
  IconEdit,
  IconTarget,
  IconLock,
  IconSparkle,
  IconClock,
  IconArrowNext,
  IconDocument,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إدارة المحتوى" };

export default async function AdminContentPage() {
  await requireAdmin();

  const course = await db.course.findFirst({
    orderBy: { order: "asc" },
    include: {
      tracks: {
        orderBy: { order: "asc" },
        include: {
          modules: {
            orderBy: { order: "asc" },
            include: {
              lessons: { orderBy: { order: "asc" } },
              quiz: { include: { _count: { select: { questions: true } } } },
            },
          },
        },
      },
    },
  });

  if (!course) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="لا يوجد برنامج"
          description="يُنشأ البرنامج والمنهج تلقائيًا عند إقلاع الخادم. أعد النشر، وإن بقيت الصفحة فارغة فراجع سجلّ الإقلاع (الأسطر التي تبدأ بـ [seed] و[start])."
        />
      </div>
    );
  }

  const totalLessons = course.tracks.reduce(
    (n, t) => n + t.modules.reduce((m, mod) => m + mod.lessons.length, 0),
    0,
  );

  return (
    <div className="container-page space-y-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink-900">
            إدارة المحتوى
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-500">
            {course.title} · <span className="num">{totalLessons}</span> درسًا في{" "}
            <span className="num">
              {course.tracks.reduce((n, t) => n + t.modules.length, 0)}
            </span>{" "}
            وحدات
          </p>
        </div>
        <LinkButton href="/admin/content/course" variant="outline">
          <IconEdit />
          بيانات البرنامج والمسارات
        </LinkButton>
      </header>

      {course.tracks.map((track) => (
        <section key={track.id} className="card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-cream-200 bg-cream-50 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <span
                className="size-3 rounded-full"
                style={{ background: track.color ?? "#00B7B5" }}
              />
              <h2 className="font-display text-[16px] font-black text-ink-900">
                {track.title}
              </h2>
              {!track.isPublished && <Badge tone="slate">غير منشور</Badge>}
            </div>
            <LinkButton
              href={`/admin/content/modules/new?trackId=${track.id}`}
              size="sm"
              variant="outline"
            >
              <IconPlus />
              وحدة جديدة
            </LinkButton>
          </div>

          <ul className="divide-y divide-cream-200">
            {track.modules.map((mod) => (
              <li key={mod.id} className="px-5 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-[14.5px] font-bold text-ink-900">
                        {mod.title}
                      </h3>
                      {!mod.isPublished && <Badge tone="slate">مخفية</Badge>}
                      {mod.requiredPlan === "premium" && (
                        <Badge tone="gold">
                          <IconSparkle className="text-[10px]" />
                          PREMIUM
                        </Badge>
                      )}
                    </div>
                    <p className="num mt-1 text-[12.5px] text-ink-500">
                      {mod.lessons.length} درسًا ·{" "}
                      {mod.lessons.reduce((s, l) => s + l.durationMinutes, 0)}{" "}
                      دقيقة
                      {mod.quiz
                        ? ` · اختبار (${mod.quiz._count.questions} أسئلة)`
                        : " · بلا اختبار"}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <LinkButton
                      href={`/admin/content/modules/${mod.id}`}
                      size="sm"
                      variant="outline"
                    >
                      <IconEdit />
                      الوحدة
                    </LinkButton>
                    <LinkButton
                      href={`/admin/content/quizzes/${mod.id}`}
                      size="sm"
                      variant="outline"
                    >
                      <IconTarget />
                      الاختبار
                    </LinkButton>
                    <LinkButton
                      href={`/admin/content/lessons/new?moduleId=${mod.id}`}
                      size="sm"
                      variant="primary"
                    >
                      <IconPlus />
                      درس
                    </LinkButton>
                  </div>
                </div>

                {mod.lessons.length > 0 && (
                  <ol className="mt-3 divide-y divide-cream-200 overflow-hidden rounded-xl border border-cream-200">
                    {mod.lessons.map((lesson, i) => (
                      <li key={lesson.id}>
                        <Link
                          href={`/admin/content/lessons/${lesson.id}`}
                          className="flex items-center gap-3 bg-white px-4 py-2.5 transition-colors hover:bg-cream-50"
                        >
                          <span className="num w-5 shrink-0 text-[11.5px] text-ink-300">
                            {i + 1}
                          </span>
                          <span
                            className={`min-w-0 flex-1 truncate text-[13.5px] ${
                              lesson.isPublished
                                ? "text-ink-800"
                                : "text-ink-300 line-through"
                            }`}
                          >
                            {lesson.title}
                          </span>
                          {lesson.isFreePreview && (
                            <Badge tone="green">معاينة</Badge>
                          )}
                          {lesson.requiredPlan === "premium" && (
                            <Badge tone="gold">PREMIUM</Badge>
                          )}
                          {!lesson.videoUrl && (
                            <Badge tone="amber">
                              <IconDocument className="text-[10px]" />
                              بلا فيديو
                            </Badge>
                          )}
                          <span className="num hidden items-center gap-1 text-[11.5px] text-ink-500 sm:flex">
                            <IconClock />
                            {lesson.durationMinutes} د
                          </span>
                          <IconArrowNext className="shrink-0 text-ink-300" />
                        </Link>
                      </li>
                    ))}
                  </ol>
                )}

                {mod.lessons.length === 0 && (
                  <p className="mt-3 rounded-xl border border-dashed border-cream-300 px-4 py-5 text-center text-[13px] text-ink-500">
                    لا توجد دروس في هذه الوحدة بعد.
                  </p>
                )}
              </li>
            ))}
          </ul>

          {track.modules.length === 0 && (
            <p className="px-5 py-10 text-center text-[13px] text-ink-500">
              <IconLock className="mx-auto mb-2 text-xl opacity-40" />
              لا توجد وحدات في هذا المسار.
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
