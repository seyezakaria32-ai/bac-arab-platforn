"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, parseJson } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getCurriculum } from "@/lib/curriculum";
import { getSettings } from "@/lib/settings";
import { PROGRESS_STATUS } from "@/lib/constants";

/**
 * إجراءات الطالب.
 * كل إجراء يعيد التحقّق من الصلاحية عبر getCurriculum قبل تعديل أي شيء،
 * فلا يكفي أن يرسل المتصفّح معرّف درس ليُعتبر مفتوحًا.
 */

export type ActionResult = { ok: boolean; message?: string; data?: unknown };

/* ─────────────────── تسجيل بدء مشاهدة الدرس ─────────────────── */

export async function trackLessonViewAction(
  lessonId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول" };

  const curriculum = await getCurriculum(user);
  const node = curriculum?.flatLessons.find((l) => l.id === lessonId);
  if (!node?.accessible) return { ok: false, message: "هذا الدرس غير متاح" };

  const existing = await db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
  });

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { viewCount: { increment: 1 } },
    create: {
      userId: user.id,
      lessonId,
      status: PROGRESS_STATUS.IN_PROGRESS,
      viewCount: 1,
    },
  });

  await db.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  return { ok: true, data: { firstView: !existing } };
}

/* ─────────────────────── إتمام الدرس ─────────────────────── */

export async function completeLessonAction(
  lessonId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول" };

  const curriculum = await getCurriculum(user);
  const node = curriculum?.flatLessons.find((l) => l.id === lessonId);

  if (!node) return { ok: false, message: "الدرس غير موجود" };
  if (!node.accessible) {
    return {
      ok: false,
      message:
        node.lockReason === "subscription"
          ? "يجب تفعيل اشتراكك أولًا"
          : node.lockReason === "plan"
            ? "هذا الدرس متاح في باقة PREMIUM ELITE"
            : "أتمّ الدرس السابق أولًا",
    };
  }

  await db.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { status: PROGRESS_STATUS.COMPLETED, completedAt: new Date() },
    create: {
      userId: user.id,
      lessonId,
      status: PROGRESS_STATUS.COMPLETED,
      completedAt: new Date(),
      viewCount: 1,
    },
  });

  // إعادة الحساب بعد الإتمام لمعرفة الوجهة التالية
  const updated = await getCurriculum(user);
  const idx = updated?.flatLessons.findIndex((l) => l.id === lessonId) ?? -1;
  const next =
    idx >= 0 && updated ? (updated.flatLessons[idx + 1] ?? null) : null;

  // هل انتهت الوحدة وظهر اختبارها؟
  const moduleNode = updated?.tracks
    .flatMap((t) => t.modules)
    .find((m) => m.id === node.moduleId);
  const quizDue =
    moduleNode?.lessonsDone && moduleNode.quiz && !moduleNode.quiz.passed
      ? moduleNode.quiz
      : null;

  revalidatePath("/dashboard");
  revalidatePath(`/learn/${lessonId}`);

  return {
    ok: true,
    data: {
      quizId: quizDue?.id ?? null,
      moduleId: quizDue?.moduleId ?? null,
      nextLessonId: quizDue ? null : (next?.accessible ? next.id : null),
      courseComplete: updated?.isComplete ?? false,
    },
  };
}

/* ─────────────────── إلغاء إتمام الدرس (تراجع) ─────────────────── */

export async function reopenLessonAction(
  lessonId: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول" };

  await db.lessonProgress.updateMany({
    where: { userId: user.id, lessonId },
    data: { status: PROGRESS_STATUS.IN_PROGRESS, completedAt: null },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

/* ─────────────────── حفظ موضع الفيديو ─────────────────── */

export async function saveVideoPositionAction(
  lessonId: string,
  seconds: number,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false };

  await db.lessonProgress.updateMany({
    where: { userId: user.id, lessonId },
    data: { lastPositionSeconds: Math.max(0, Math.floor(seconds)) },
  });
  return { ok: true };
}

/* ─────────────────── ملاحظات الطالب على الدرس ─────────────────── */

export async function saveNoteAction(
  lessonId: string,
  body: string,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول" };

  const text = body.slice(0, 5000);

  if (!text.trim()) {
    await db.lessonNote.deleteMany({ where: { userId: user.id, lessonId } });
    return { ok: true };
  }

  await db.lessonNote.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    update: { body: text },
    create: { userId: user.id, lessonId, body: text },
  });
  return { ok: true, message: "حُفظت ملاحظتك" };
}

/* ═════════════════════════ الاختبارات ═════════════════════════ */

const answersSchema = z.record(
  z.string(),
  z.union([z.string(), z.array(z.string())]),
);

type StoredAnswer = {
  questionId: string;
  type: string;
  given: string | string[];
  correct: boolean | null; // null = يحتاج تصحيحًا يدويًا
  points: number;
  earned: number;
};

function normalizeArabic(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/[ً-ْـ]/g, "") // التشكيل والتطويل
    .replace(/[أإآا]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/[ىي]/g, "ي")
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[،,.]/g, "")
    .replace(/\s+/g, " ");
}

export async function submitQuizAction(
  quizId: string,
  rawAnswers: Record<string, string | string[]>,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول" };

  const parsed = answersSchema.safeParse(rawAnswers);
  if (!parsed.success) return { ok: false, message: "إجابات غير صالحة" };

  // التحقّق من أن الاختبار مفتوح فعلًا لهذا الطالب
  const curriculum = await getCurriculum(user);
  const quizNode = curriculum?.tracks
    .flatMap((t) => t.modules)
    .map((m) => m.quiz)
    .find((q) => q?.id === quizId);

  if (!quizNode) return { ok: false, message: "الاختبار غير موجود" };
  if (!quizNode.accessible) {
    return {
      ok: false,
      message:
        quizNode.lockReason === "sequence"
          ? "أكمل جميع دروس الوحدة قبل الاختبار"
          : quizNode.lockReason === "quiz"
            ? "استنفدت عدد المحاولات المسموح بها"
            : "هذا الاختبار غير متاح لك",
    };
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizId },
    include: { questions: { include: { options: true }, orderBy: { order: "asc" } } },
  });
  if (!quiz) return { ok: false, message: "الاختبار غير موجود" };

  const settings = await getSettings();

  let totalPoints = 0;
  let earnedPoints = 0;
  let needsReview = false;
  const details: StoredAnswer[] = [];

  for (const q of quiz.questions) {
    totalPoints += q.points;
    const given = parsed.data[q.id] ?? "";

    let correct: boolean | null = false;
    let earned = 0;

    if (q.type === "open") {
      // الأسئلة التطبيقية تُصحَّح يدويًا من الأستاذ
      correct = null;
      needsReview = true;
    } else if (q.type === "short") {
      const accepted = parseJson<string[]>(q.acceptedAnswers, []);
      const value = normalizeArabic(String(given));
      correct =
        value.length > 0 &&
        accepted.some((a) => normalizeArabic(a) === value);
      earned = correct ? q.points : 0;
    } else if (q.type === "multi") {
      const correctIds = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      const givenIds = Array.isArray(given) ? given : given ? [given] : [];
      correct =
        correctIds.length === givenIds.length &&
        correctIds.every((id) => givenIds.includes(id));
      earned = correct ? q.points : 0;
    } else {
      // mcq | true_false
      const correctId = q.options.find((o) => o.isCorrect)?.id;
      correct = Boolean(correctId) && given === correctId;
      earned = correct ? q.points : 0;
    }

    earnedPoints += earned;
    details.push({
      questionId: q.id,
      type: q.type,
      given,
      correct,
      points: q.points,
      earned,
    });
  }

  // الأسئلة المفتوحة تُستثنى من الحساب الآلي حتى لا تُظلم النتيجة
  const autoPoints = details
    .filter((d) => d.correct !== null)
    .reduce((s, d) => s + d.points, 0);

  const score =
    autoPoints === 0 ? 0 : Math.round((earnedPoints / autoPoints) * 100);
  const passed = score >= quiz.passScore;

  const previous = await db.quizAttempt.count({
    where: { userId: user.id, quizId },
  });

  const attempt = await db.quizAttempt.create({
    data: {
      quizId,
      userId: user.id,
      attemptNumber: previous + 1,
      score,
      earnedPoints,
      totalPoints,
      passed,
      needsReview,
      answers: JSON.stringify(details),
      submittedAt: new Date(),
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/quiz/${quizNode.moduleId}`);

  return {
    ok: true,
    data: {
      attemptId: attempt.id,
      score,
      passed,
      passScore: quiz.passScore,
      earnedPoints,
      totalPoints,
      needsReview,
      showAnswers: settings["quiz.showCorrectAnswers"],
    },
  };
}
