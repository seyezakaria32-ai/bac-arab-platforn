import "server-only";
import { db, parseJson } from "./db";

/**
 * قراءة محاولة اختبار وتحويلها إلى بنية جاهزة للعرض (مراجعة الطالب أو تصحيح الأستاذ).
 * الإجابات تُخزَّن كـ JSON في QuizAttempt.answers، وهذا الملفّ هو المكان الوحيد
 * الذي يعرف شكلها — فأي تغيير في التخزين يبقى محصورًا هنا.
 */

export type StoredAnswer = {
  questionId: string;
  type: string;
  given: string | string[];
  /** null = سؤال تطبيقي بانتظار تصحيح الأستاذ */
  correct: boolean | null;
  points: number;
  earned: number;
};

export type ReviewedQuestion = {
  id: string;
  order: number;
  type: string;
  prompt: string;
  explanation: string | null;
  points: number;
  earned: number;
  correct: boolean | null;
  /** نصّ إجابة الطالب كما تُعرض */
  givenText: string;
  /** نصّ الإجابة الصحيحة (للأسئلة الآلية) */
  correctText: string;
  options: { id: string; text: string; isCorrect: boolean; chosen: boolean }[];
};

export type ReviewedAttempt = {
  id: string;
  quizId: string;
  moduleId: string;
  moduleTitle: string;
  trackTitle: string;
  quizTitle: string;
  passScore: number;
  attemptNumber: number;
  score: number;
  earnedPoints: number;
  totalPoints: number;
  passed: boolean;
  needsReview: boolean;
  reviewNote: string | null;
  submittedAt: Date | null;
  student: { id: string; name: string; email: string };
  questions: ReviewedQuestion[];
};

export async function getReviewedAttempt(
  attemptId: string,
): Promise<ReviewedAttempt | null> {
  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: {
      user: { select: { id: true, name: true, email: true } },
      quiz: {
        include: {
          module: { include: { track: true } },
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
          },
        },
      },
    },
  });
  if (!attempt) return null;

  const stored = parseJson<StoredAnswer[]>(attempt.answers, []);
  const byQuestion = new Map(stored.map((a) => [a.questionId, a]));

  const questions: ReviewedQuestion[] = attempt.quiz.questions.map((q) => {
    const answer = byQuestion.get(q.id);
    const given = answer?.given ?? "";
    const givenIds = Array.isArray(given) ? given : given ? [given] : [];

    const options = q.options.map((o) => ({
      id: o.id,
      text: o.text,
      isCorrect: o.isCorrect,
      chosen: givenIds.includes(o.id),
    }));

    const isChoice = ["mcq", "multi", "true_false"].includes(q.type);

    return {
      id: q.id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      explanation: q.explanation,
      points: q.points,
      earned: answer?.earned ?? 0,
      correct: answer?.correct ?? null,
      givenText: isChoice
        ? options
            .filter((o) => o.chosen)
            .map((o) => o.text)
            .join("، ") || "—"
        : String(given || "—"),
      correctText: isChoice
        ? options
            .filter((o) => o.isCorrect)
            .map((o) => o.text)
            .join("، ")
        : parseJson<string[]>(q.acceptedAnswers, []).join(" / "),
      options,
    };
  });

  return {
    id: attempt.id,
    quizId: attempt.quizId,
    moduleId: attempt.quiz.moduleId,
    moduleTitle: attempt.quiz.module.title,
    trackTitle: attempt.quiz.module.track.title,
    quizTitle: attempt.quiz.title,
    passScore: attempt.quiz.passScore,
    attemptNumber: attempt.attemptNumber,
    score: attempt.score,
    earnedPoints: attempt.earnedPoints,
    totalPoints: attempt.totalPoints,
    passed: attempt.passed,
    needsReview: attempt.needsReview,
    reviewNote: attempt.reviewNote,
    submittedAt: attempt.submittedAt,
    student: attempt.user,
    questions,
  };
}
