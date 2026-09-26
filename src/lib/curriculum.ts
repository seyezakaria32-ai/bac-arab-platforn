import "server-only";
import { db } from "./db";
import { getAccess, tierAllows, type Access, NO_ACCESS } from "./access";
import { getSettings } from "./settings";
import { PROGRESS_STATUS } from "./constants";

/**
 * محرّك المنهج والتدرّج الإجباري (Sequential Learning).
 *
 * القاعدة:
 *   الدرس 1 → إتمام → الدرس 2 → ... → إتمام كل دروس الوحدة
 *   → اختبار الوحدة → النجاح → فتح الوحدة التالية.
 *
 * كل حالات القفل تُحسب هنا في الخادم فقط، ولا تعتمد على الواجهة إطلاقًا،
 * حتى لا يستطيع الطالب فتح درس مقفل عبر تعديل الرابط.
 */

export type LockReason = null | "subscription" | "plan" | "sequence" | "quiz";

export type LessonNode = {
  id: string;
  title: string;
  slug: string;
  order: number;
  moduleId: string;
  trackId: string;
  contentType: string;
  durationMinutes: number;
  isFreePreview: boolean;
  requiredPlan: string;
  state: "completed" | "current" | "unlocked" | "locked";
  accessible: boolean;
  lockReason: LockReason;
  index: number; // ترتيبه العام داخل البرنامج
};

export type QuizNode = {
  id: string;
  moduleId: string;
  moduleTitle: string;
  title: string;
  passScore: number;
  maxAttempts: number;
  timeLimitMinutes: number;
  questionCount: number;
  attemptCount: number;
  bestScore: number;
  passed: boolean;
  attemptsLeft: number | null; // null = غير محدود
  accessible: boolean;
  lockReason: LockReason;
};

export type ModuleNode = {
  id: string;
  title: string;
  description: string | null;
  order: number;
  requiredPlan: string;
  trackId: string;
  trackTitle: string;
  lessons: LessonNode[];
  quiz: QuizNode | null;
  totalLessons: number;
  completedLessons: number;
  percent: number;
  lessonsDone: boolean;
  cleared: boolean; // أُنجزت دروسها واجتيز اختبارها
  state: "completed" | "current" | "unlocked" | "locked";
  accessible: boolean;
  lockReason: LockReason;
};

export type TrackNode = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  color: string | null;
  order: number;
  modules: ModuleNode[];
  totalLessons: number;
  completedLessons: number;
  percent: number;
};

export type CourseInfo = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  instructor: string | null;
  durationText: string | null;
  coverImage: string | null;
};

export type Curriculum = {
  course: CourseInfo;
  tracks: TrackNode[];
  access: Access;
  totalLessons: number;
  completedLessons: number;
  remainingLessons: number;
  percent: number;
  currentLesson: LessonNode | null;
  pendingQuiz: QuizNode | null;
  isComplete: boolean;
  flatLessons: LessonNode[];
};

function pct(done: number, total: number) {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

/** البرنامج المنشور الافتراضي */
export async function getDefaultCourse() {
  return db.course.findFirst({
    where: { isPublished: true },
    orderBy: { order: "asc" },
  });
}

const courseTreeInclude = {
  tracks: {
    where: { isPublished: true },
    orderBy: { order: "asc" as const },
    include: {
      modules: {
        where: { isPublished: true },
        orderBy: { order: "asc" as const },
        include: {
          lessons: {
            where: { isPublished: true },
            orderBy: { order: "asc" as const },
          },
          quiz: {
            include: { _count: { select: { questions: true } } },
          },
        },
      },
    },
  },
};

/**
 * يبني شجرة المنهج كاملة مع حساب حالة كل درس ووحدة لهذا المستخدم.
 * `user = null` يعطي العرض العام (كل شيء مقفل ما عدا دروس المعاينة).
 */
export async function getCurriculum(
  user: { id: string; role: string } | null,
  courseId?: string,
): Promise<Curriculum | null> {
  const course = courseId
    ? await db.course.findUnique({
        where: { id: courseId },
        include: courseTreeInclude,
      })
    : await db.course.findFirst({
        where: { isPublished: true },
        orderBy: { order: "asc" },
        include: courseTreeInclude,
      });

  if (!course) return null;

  const settings = await getSettings();
  const access = user ? await getAccess(user, course.id) : NO_ACCESS;

  const lessonIds: string[] = [];
  const quizIds: string[] = [];
  for (const t of course.tracks)
    for (const m of t.modules) {
      for (const l of m.lessons) lessonIds.push(l.id);
      if (m.quiz) quizIds.push(m.quiz.id);
    }

  // تقدّم الطالب في الدروس
  const progressRows = user
    ? await db.lessonProgress.findMany({
        where: { userId: user.id, lessonId: { in: lessonIds } },
        select: { lessonId: true, status: true },
      })
    : [];
  const doneSet = new Set(
    progressRows
      .filter((p) => p.status === PROGRESS_STATUS.COMPLETED)
      .map((p) => p.lessonId),
  );

  // محاولات الاختبارات
  const attempts = user
    ? await db.quizAttempt.findMany({
        where: {
          userId: user.id,
          quizId: { in: quizIds },
          submittedAt: { not: null },
        },
        select: { quizId: true, score: true, passed: true },
      })
    : [];
  const quizStats = new Map<
    string,
    { count: number; best: number; passed: boolean }
  >();
  for (const a of attempts) {
    const s = quizStats.get(a.quizId) ?? { count: 0, best: 0, passed: false };
    s.count += 1;
    s.best = Math.max(s.best, a.score);
    s.passed = s.passed || a.passed;
    quizStats.set(a.quizId, s);
  }

  // المسؤول يراجع المحتوى ولا يتعلّمه: التدرّج الإجباري لا يسري عليه، وإلا
  // لم يستطع معاينة درس من لوحة الإدارة قبل «إتمام» كل ما قبله
  const preview = access.isAdmin;
  const sequential = settings["learning.sequential"] && !preview;
  const acrossTracks = settings["learning.sequentialAcrossTracks"] && !preview;
  const requireQuiz = settings["learning.requireQuizToAdvance"] && !preview;
  const allowRewatch = settings["learning.allowRewatch"] || preview;

  const tracks: TrackNode[] = [];
  const flatLessons: LessonNode[] = [];
  let currentLesson: LessonNode | null = null;
  let pendingQuiz: QuizNode | null = null;

  /** هل السلسلة مفتوحة حتى هذه النقطة؟ */
  let chainOpen: boolean = true;
  let globalIndex = 0;

  for (const track of course.tracks) {
    if (!acrossTracks) chainOpen = true; // كل مادة تبدأ سلسلتها الخاصة

    const modules: ModuleNode[] = [];
    let trackDone = 0;
    let trackTotal = 0;

    for (const mod of track.modules) {
      const planOk = tierAllows(access.tier, mod.requiredPlan);
      const seqOk: boolean = !sequential || chainOpen;
      const moduleAccessible: boolean = access.hasAccess && planOk && seqOk;

      const moduleLockReason: LockReason = !access.hasAccess
        ? "subscription"
        : !planOk
          ? "plan"
          : !seqOk
            ? "sequence"
            : null;

      const lessons: LessonNode[] = [];
      let prevDone = true;
      let moduleCompletedCount = 0;

      for (const l of mod.lessons) {
        const isDone = doneSet.has(l.id);
        if (isDone) moduleCompletedCount += 1;

        const lessonPlanOk = tierAllows(access.tier, l.requiredPlan);
        const seqLessonOk = !sequential || prevDone;

        let accessible =
          moduleAccessible && lessonPlanOk && (seqLessonOk || isDone);
        // دروس المعاينة المجانية مفتوحة للجميع حتى قبل الاشتراك
        if (l.isFreePreview) accessible = true;
        // منع إعادة المشاهدة إن عُطّلت من الإعدادات
        if (isDone && !allowRewatch) accessible = false;

        let lockReason: LockReason = null;
        if (!accessible) {
          lockReason = !access.hasAccess
            ? "subscription"
            : !lessonPlanOk || !planOk
              ? "plan"
              : "sequence";
        }

        const isCurrentCandidate = !isDone && accessible;
        const node: LessonNode = {
          id: l.id,
          title: l.title,
          slug: l.slug,
          order: l.order,
          moduleId: mod.id,
          trackId: track.id,
          contentType: l.contentType,
          durationMinutes: l.durationMinutes,
          isFreePreview: l.isFreePreview,
          requiredPlan: l.requiredPlan,
          accessible,
          lockReason,
          state: isDone
            ? "completed"
            : isCurrentCandidate && !currentLesson
              ? "current"
              : accessible
                ? "unlocked"
                : "locked",
          index: globalIndex++,
        };

        if (node.state === "current") currentLesson = node;
        lessons.push(node);
        flatLessons.push(node);
        prevDone = isDone;
      }

      const totalLessons = lessons.length;
      const lessonsDone = totalLessons > 0 && moduleCompletedCount === totalLessons;

      // ── اختبار الوحدة ──
      let quizNode: QuizNode | null = null;
      if (mod.quiz && mod.quiz.isPublished) {
        const stats = quizStats.get(mod.quiz.id) ?? {
          count: 0,
          best: 0,
          passed: false,
        };
        const quizPlanOk = tierAllows(access.tier, mod.quiz.requiredPlan);
        const attemptsLeft =
          mod.quiz.maxAttempts > 0
            ? Math.max(0, mod.quiz.maxAttempts - stats.count)
            : null;
        // المسؤول يعاين الاختبار دون إتمام دروس الوحدة
        const quizAccessible: boolean = preview
          ? true
          : moduleAccessible && quizPlanOk && lessonsDone && !stats.passed
            ? attemptsLeft === null || attemptsLeft > 0
            : moduleAccessible && quizPlanOk && lessonsDone;

        quizNode = {
          id: mod.quiz.id,
          moduleId: mod.id,
          moduleTitle: mod.title,
          title: mod.quiz.title,
          passScore: mod.quiz.passScore,
          maxAttempts: mod.quiz.maxAttempts,
          timeLimitMinutes: mod.quiz.timeLimitMinutes,
          questionCount: mod.quiz._count.questions,
          attemptCount: stats.count,
          bestScore: stats.best,
          passed: stats.passed,
          attemptsLeft,
          accessible: quizAccessible,
          lockReason: quizAccessible
            ? null
            : !access.hasAccess
              ? "subscription"
              : !quizPlanOk
                ? "plan"
                : !lessonsDone
                  ? "sequence"
                  : "quiz",
        };

        if (!pendingQuiz && lessonsDone && !stats.passed && quizAccessible) {
          pendingQuiz = quizNode;
        }
      }

      const quizCleared: boolean =
        !requireQuiz || !quizNode || quizNode.passed || quizNode.questionCount === 0;
      const cleared: boolean = lessonsDone && quizCleared;

      const moduleNode: ModuleNode = {
        id: mod.id,
        title: mod.title,
        description: mod.description,
        order: mod.order,
        requiredPlan: mod.requiredPlan,
        trackId: track.id,
        trackTitle: track.title,
        lessons,
        quiz: quizNode,
        totalLessons,
        completedLessons: moduleCompletedCount,
        percent: pct(moduleCompletedCount, totalLessons),
        lessonsDone,
        cleared,
        accessible: moduleAccessible,
        lockReason: moduleLockReason,
        state: cleared
          ? "completed"
          : moduleAccessible && moduleCompletedCount >= 0 && chainOpen
            ? moduleCompletedCount > 0 || lessonsDone
              ? "current"
              : "unlocked"
            : "locked",
      };

      modules.push(moduleNode);
      trackDone += moduleCompletedCount;
      trackTotal += totalLessons;

      if (sequential) chainOpen = cleared;
    }

    tracks.push({
      id: track.id,
      slug: track.slug,
      title: track.title,
      description: track.description,
      color: track.color,
      order: track.order,
      modules,
      totalLessons: trackTotal,
      completedLessons: trackDone,
      percent: pct(trackDone, trackTotal),
    });
  }

  const totalLessons = flatLessons.length;
  const completedLessons = flatLessons.filter(
    (l) => l.state === "completed",
  ).length;

  // إن لم يوجد «درس حالي» مفتوح ولم يكتمل البرنامج، فالطالب متوقّف عند اختبار
  if (!currentLesson && completedLessons < totalLessons) {
    currentLesson =
      flatLessons.find((l) => l.state !== "completed" && l.accessible) ?? null;
  }

  return {
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle,
      description: course.description,
      instructor: course.instructor,
      durationText: course.durationText,
      coverImage: course.coverImage,
    },
    tracks,
    access,
    totalLessons,
    completedLessons,
    remainingLessons: totalLessons - completedLessons,
    percent: pct(completedLessons, totalLessons),
    currentLesson,
    pendingQuiz,
    isComplete: totalLessons > 0 && completedLessons === totalLessons,
    flatLessons,
  };
}

/** المنهج للعرض العام في الصفحة الرئيسية (بدون أي بيانات مستخدم) */
export async function getPublicCurriculum() {
  const course = await db.course.findFirst({
    where: { isPublished: true },
    orderBy: { order: "asc" },
    include: {
      tracks: {
        where: { isPublished: true },
        orderBy: { order: "asc" },
        include: {
          modules: {
            where: { isPublished: true },
            orderBy: { order: "asc" },
            include: {
              lessons: {
                where: { isPublished: true },
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  title: true,
                  durationMinutes: true,
                  isFreePreview: true,
                  requiredPlan: true,
                },
              },
            },
          },
        },
      },
    },
  });
  return course;
}

/** الدرس السابق والتالي حسب الترتيب العام */
export function neighbours(curriculum: Curriculum, lessonId: string) {
  const i = curriculum.flatLessons.findIndex((l) => l.id === lessonId);
  if (i === -1) return { prev: null, next: null, current: null };
  return {
    prev: i > 0 ? curriculum.flatLessons[i - 1] : null,
    next:
      i < curriculum.flatLessons.length - 1
        ? curriculum.flatLessons[i + 1]
        : null,
    current: curriculum.flatLessons[i],
  };
}

/** يجد الوحدة التي ينتمي إليها درس */
export function findModule(curriculum: Curriculum, moduleId: string) {
  for (const t of curriculum.tracks) {
    const m = t.modules.find((x) => x.id === moduleId);
    if (m) return { track: t, module: m };
  }
  return null;
}
