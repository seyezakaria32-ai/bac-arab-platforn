import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db, parseJson } from "@/lib/db";
import { getCurriculum, neighbours, findModule } from "@/lib/curriculum";
import { getBlocksByPlacement } from "@/lib/blocks";
import { BlockSlot } from "@/components/marketing/BlockSlot";
import { tierAllows } from "@/lib/access";
import { toEmbed } from "@/lib/video";
import { Badge, Alert, LinkButton } from "@/components/ui";
import {
  IconLock,
  IconClock,
  IconDocument,
  IconDownload,
  IconTarget,
  IconCheck,
  IconSparkle,
  IconArrowPrev,
} from "@/components/ui/icons";
import { LessonSidebar } from "@/components/app/LessonSidebar";
import {
  LessonPlayer,
  LessonFooter,
  LessonNotes,
} from "@/components/app/LessonClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}): Promise<Metadata> {
  const { lessonId } = await params;
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { title: true },
  });
  return { title: lesson?.title ?? "الدرس" };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const user = await requireUser(`/learn/${lessonId}`);
  const [curriculum, blocks] = await Promise.all([
    getCurriculum(user),
    getBlocksByPlacement("lesson"),
  ]);
  if (!curriculum) notFound();

  const node = curriculum.flatLessons.find((l) => l.id === lessonId);
  if (!node) notFound();

  /* ── الحماية: لا وصول إلى درس مقفل عبر الرابط المباشر ── */
  if (!node.accessible) {
    const found = findModule(curriculum, node.moduleId);
    return (
      <div className="container-page max-w-2xl py-16">
        <div className="card p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cream-100 text-2xl text-ink-500">
            <IconLock />
          </span>
          <h1 className="mt-4 font-display text-xl font-black text-ink-900">
            هذا الدرس مقفل
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-loose text-ink-500">
            {node.lockReason === "subscription"
              ? curriculum.access.status === "expired"
                ? "انتهى وصولك لموسم البكالوريا السابق. اشترك للموسم الجديد لتتابع من حيث توقّفت — تقدّمك محفوظ."
                : "يجب تفعيل اشتراكك في البرنامج قبل الوصول إلى الدروس."
              : node.lockReason === "plan"
                ? "هذا المحتوى متاح في باقة PREMIUM ELITE فقط."
                : `البرنامج يعتمد التدرّج الإجباري — أتمّ الدروس السابقة${
                    found ? ` في «${found.module.title}»` : ""
                  } أولًا ليُفتح لك هذا الدرس.`}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <LinkButton href="/dashboard">العودة إلى لوحتي</LinkButton>
            {node.lockReason === "subscription" && (
              <LinkButton
                href={
                  curriculum.access.status === "expired" && curriculum.access.planCode
                    ? "/checkout/" + curriculum.access.planCode
                    : "/#plans"
                }
                variant="outline"
              >
                {curriculum.access.status === "expired" ? "اشترك للموسم الجديد" : "عرض الباقات"}
              </LinkButton>
            )}
            {node.lockReason === "plan" && (
              <LinkButton href="/checkout/PREMIUM_ELITE" variant="gold">
                الترقية إلى PREMIUM ELITE
              </LinkButton>
            )}
            {node.lockReason === "sequence" && curriculum.currentLesson && (
              <LinkButton
                href={`/learn/${curriculum.currentLesson.id}`}
                variant="outline"
              >
                الذهاب إلى درسي الحالي
              </LinkButton>
            )}
          </div>
        </div>
      </div>
    );
  }

  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    include: {
      resources: { orderBy: { order: "asc" } },
      module: { include: { track: true } },
      notes: { where: { userId: user.id } },
      progress: { where: { userId: user.id } },
    },
  });
  if (!lesson) notFound();

  // درس معاينة مجانية لزائر بلا اشتراك: نعرضه لكن دون تسجيل تقدّم
  const isPreviewOnly = !curriculum.access.hasAccess && lesson.isFreePreview;

  const { prev, next } = neighbours(curriculum, lessonId);
  const moduleInfo = findModule(curriculum, lesson.moduleId);
  const embed = toEmbed(lesson.videoUrl, lesson.videoProvider);
  const objectives = parseJson<string[]>(lesson.objectives, []);
  const userTier = curriculum.access.tier;
  const lessonIndex =
    (moduleInfo?.module.lessons.findIndex((l) => l.id === lessonId) ?? 0) + 1;

  return (
    <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_380px]">
      {/* ═══════════ العمود الرئيسي ═══════════ */}
      <div className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        {/* مسار التنقّل */}
        <nav className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-500">
          <Link href="/dashboard" className="hover:text-brand-700">
            لوحتي
          </Link>
          <span className="text-ink-300">/</span>
          <span>{lesson.module.track.title}</span>
          <span className="text-ink-300">/</span>
          <span className="font-bold text-ink-700">{lesson.module.title}</span>
        </nav>

        <div className="mt-3 flex flex-wrap items-center gap-2.5">
          <Badge tone="ink">
            الدرس <span className="num">{lessonIndex}</span> من{" "}
            <span className="num">{moduleInfo?.module.totalLessons ?? 0}</span>
          </Badge>
          {lesson.durationMinutes > 0 && (
            <Badge tone="slate">
              <IconClock />
              <span className="num">{lesson.durationMinutes}</span> دقيقة
            </Badge>
          )}
          {node.state === "completed" && <Badge tone="green">مكتمل ✓</Badge>}
          {lesson.requiredPlan === "premium" && (
            <Badge tone="gold">
              <IconSparkle className="text-[10px]" />
              PREMIUM
            </Badge>
          )}
        </div>

        <h1 className="mt-3 font-display text-xl leading-snug font-black text-ink-900 sm:text-2xl">
          {lesson.title}
        </h1>

        {isPreviewOnly && (
          <div className="mt-4">
            <Alert tone="info" title="معاينة مجانية">
              أنت تشاهد درسًا مفتوحًا للمعاينة. للوصول إلى بقية البرنامج وحفظ
              تقدّمك، فعّل اشتراكك.
              <div className="mt-3">
                <LinkButton href="/#plans" size="sm">
                  عرض الباقات
                </LinkButton>
              </div>
            </Alert>
          </div>
        )}

        {/* المشغّل */}
        <div className="mt-5">
          <LessonPlayer
            lessonId={lessonId}
            embed={embed}
            title={lesson.title}
            startSeconds={lesson.progress[0]?.lastPositionSeconds ?? 0}
          />
        </div>

        {/* المحتوى */}
        <div className="mt-7 space-y-7">
          {lesson.summary && (
            <section>
              <h2 className="font-display text-[16px] font-black text-ink-900">
                وصف الدرس
              </h2>
              <p className="mt-2 text-[14.5px] leading-loose text-ink-700">
                {lesson.summary}
              </p>
            </section>
          )}

          {objectives.length > 0 && (
            <section className="rounded-2xl border border-brand-200 bg-brand-50/60 p-5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-black text-ink-900">
                <IconTarget className="text-brand-600" />
                أهداف الدرس
              </h2>
              <ul className="mt-3 space-y-2">
                {objectives.map((o) => (
                  <li
                    key={o}
                    className="flex items-start gap-2.5 text-[14px] leading-relaxed text-ink-800"
                  >
                    <IconCheck className="mt-1 shrink-0 text-brand-600" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {lesson.content && (
            <section className="prose-ar text-[14.5px]">
              <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
            </section>
          )}

          {/* الملفات المرفقة */}
          {lesson.resources.length > 0 && (
            <section>
              <h2 className="font-display text-[16px] font-black text-ink-900">
                الملفات المرفقة
              </h2>
              <ul className="mt-3 space-y-2">
                {lesson.resources.map((r) => {
                  const allowed = tierAllows(userTier, r.requiredPlan);
                  return (
                    <li key={r.id}>
                      {allowed ? (
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="card flex items-center gap-3 px-4 py-3 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
                        >
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-700">
                            <IconDocument />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-bold text-ink-900">
                              {r.title}
                            </span>
                            {r.sizeLabel && (
                              <span className="text-[12px] text-ink-500">
                                {r.sizeLabel}
                              </span>
                            )}
                          </span>
                          <IconDownload className="shrink-0 text-lg text-ink-500" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-3 rounded-2xl border border-dashed border-gold-400/60 bg-gold-50/50 px-4 py-3">
                          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-100 text-gold-600">
                            <IconLock />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-bold text-ink-500">
                              {r.title}
                            </span>
                            <span className="text-[12px] text-gold-600">
                              متاح في باقة PREMIUM ELITE
                            </span>
                          </span>
                          <Link
                            href="/checkout/PREMIUM_ELITE"
                            className="shrink-0 text-[12.5px] font-bold text-gold-600 hover:underline"
                          >
                            ترقية
                          </Link>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* تمرين الدرس */}
          {lesson.exercise && (
            <section className="rounded-2xl border border-cream-300 bg-white p-5">
              <h2 className="font-display text-[15px] font-black text-ink-900">
                تمرين الدرس
              </h2>
              <p className="mt-2 text-[14px] leading-loose text-ink-700">
                {lesson.exercise}
              </p>
            </section>
          )}

          {/* الملاحظات */}
          {!isPreviewOnly && (
            <section>
              <LessonNotes
                lessonId={lessonId}
                initial={lesson.notes[0]?.body ?? ""}
              />
            </section>
          )}

          {/* أزرار التنقّل */}
          {isPreviewOnly ? (
            <div className="border-t border-cream-200 pt-5">
              <LinkButton href="/#plans" size="lg" className="w-full">
                فعّل اشتراكك لمتابعة البرنامج
              </LinkButton>
            </div>
          ) : (
            <LessonFooter
              lessonId={lessonId}
              isCompleted={node.state === "completed"}
              prev={
                prev
                  ? { id: prev.id, title: prev.title, accessible: prev.accessible }
                  : null
              }
              next={
                next
                  ? { id: next.id, title: next.title, accessible: next.accessible }
                  : null
              }
            />
          )}

          {/* من لوحة الإدارة، الموضع «أسفل محتوى الدرس» */}
          <BlockSlot bare blocks={blocks["lesson.bottom"]} className="border-t border-cream-200 pt-8" />
        </div>
      </div>

      {/* ═══════════ القائمة الجانبية ═══════════ */}
      <aside className="border-t border-cream-300 bg-white lg:sticky lg:top-16 lg:h-[calc(100dvh-4rem)] lg:border-t-0 lg:border-r">
        <div className="flex items-center justify-between border-b border-cream-200 px-4 py-3 lg:hidden">
          <h2 className="font-display text-[14px] font-black text-ink-900">
            محتوى البرنامج
          </h2>
          <Link
            href="/dashboard"
            className="flex items-center gap-1 text-[12.5px] font-bold text-brand-700"
          >
            <IconArrowPrev />
            لوحتي
          </Link>
        </div>
        <LessonSidebar
          curriculum={curriculum}
          activeLessonId={lessonId}
          activeModuleId={lesson.moduleId}
        />
      </aside>
    </div>
  );
}
