import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurriculum, findModule } from "@/lib/curriculum";
import { Badge, LinkButton, EmptyState } from "@/components/ui";
import {
  IconLock,
  IconTarget,
  IconCheckCircle,
  IconArrowNext,
  IconClock,
} from "@/components/ui/icons";
import { QuizClient, type ClientQuestion } from "@/components/app/QuizClient";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "اختبار الوحدة" };

export default async function QuizPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  const { moduleId } = await params;
  const user = await requireUser(`/quiz/${moduleId}`);
  const curriculum = await getCurriculum(user);
  if (!curriculum) notFound();

  const found = findModule(curriculum, moduleId);
  if (!found) notFound();

  const { module: mod, track } = found;
  const quizNode = mod.quiz;

  if (!quizNode || quizNode.questionCount === 0) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState
          icon={<IconTarget />}
          title="لا يوجد اختبار لهذه الوحدة"
          description="يمكنك متابعة الدروس مباشرة."
          action={<LinkButton href="/dashboard">العودة إلى لوحتي</LinkButton>}
        />
      </div>
    );
  }

  /* ── الاختبار مقفل ── */
  if (!quizNode.accessible && !quizNode.passed) {
    return (
      <div className="container-page max-w-2xl py-16">
        <div className="card p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cream-100 text-2xl text-ink-500">
            <IconLock />
          </span>
          <h1 className="mt-4 font-display text-xl font-black text-ink-900">
            اختبار الوحدة غير متاح بعد
          </h1>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-loose text-ink-500">
            {quizNode.lockReason === "sequence"
              ? `يجب إتمام جميع دروس «${mod.title}» أولًا. أنجزت ${mod.completedLessons} من ${mod.totalLessons} درسًا.`
              : quizNode.lockReason === "quiz"
                ? "استنفدت عدد المحاولات المسموح بها. تواصل مع الإدارة."
                : quizNode.lockReason === "plan"
                  ? "هذا الاختبار متاح في باقة PREMIUM ELITE."
                  : "يجب تفعيل اشتراكك أولًا."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            {curriculum.currentLesson && (
              <LinkButton href={`/learn/${curriculum.currentLesson.id}`}>
                متابعة الدروس
              </LinkButton>
            )}
            <LinkButton href="/dashboard" variant="outline">
              العودة إلى لوحتي
            </LinkButton>
          </div>
        </div>
      </div>
    );
  }

  const quiz = await db.quiz.findUnique({
    where: { id: quizNode.id },
    include: {
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { order: "asc" } } },
      },
    },
  });
  if (!quiz) notFound();

  // لا تُرسَل الإجابات الصحيحة إلى المتصفّح إطلاقًا
  const clientQuestions: ClientQuestion[] = quiz.questions.map((q) => ({
    id: q.id,
    type: q.type,
    prompt: q.prompt,
    hint: q.hint,
    points: q.points,
    options: q.options.map((o) => ({ id: o.id, text: o.text })),
  }));

  const attempts = await db.quizAttempt.findMany({
    where: { userId: user.id, quizId: quiz.id, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
  });

  // أول درس مفتوح بعد هذه الوحدة (للانتقال بعد النجاح)
  const lastLesson = mod.lessons[mod.lessons.length - 1];
  const lastIndex = curriculum.flatLessons.findIndex(
    (l) => l.id === lastLesson?.id,
  );
  const nextLesson =
    lastIndex >= 0 ? (curriculum.flatLessons[lastIndex + 1] ?? null) : null;

  /* ── الوحدة مجتازة سلفًا ── */
  if (quizNode.passed) {
    return (
      <div className="container-page max-w-2xl space-y-5 py-12">
        <div className="card overflow-hidden">
          <div className="bg-emerald-600 px-6 py-9 text-center text-white">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/15 text-2xl ring-1 ring-white/20">
              <IconCheckCircle />
            </span>
            <p className="num mt-3 font-display text-4xl font-black">
              {quizNode.bestScore}%
            </p>
            <h1 className="mt-1.5 font-display text-lg font-black">
              أحسنت! لقد أتممت هذه الوحدة.
            </h1>
            <p className="mt-1.5 text-[13.5px] text-white/75">{mod.title}</p>
          </div>
          <div className="flex flex-col gap-2 p-5 sm:flex-row">
            {nextLesson?.accessible && (
              <LinkButton href={`/learn/${nextLesson.id}`} className="flex-1">
                متابعة إلى الوحدة التالية
                <IconArrowNext />
              </LinkButton>
            )}
            <LinkButton href="/dashboard" variant="outline" className="flex-1">
              العودة إلى لوحتي
            </LinkButton>
          </div>
        </div>

        <div className="card p-5">
          <h2 className="font-display text-[15px] font-black text-ink-900">
            سجلّ محاولاتك
          </h2>
          <ul className="mt-3 space-y-2">
            {attempts.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/quiz/${moduleId}/review/${a.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl bg-cream-50 px-4 py-2.5 text-[13px] transition-colors hover:bg-cream-100"
                >
                  <span className="num text-ink-500">
                    المحاولة {a.attemptNumber} ·{" "}
                    {formatDate(a.submittedAt)}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-[12px] font-bold text-brand-700">
                      مراجعة الإجابات
                    </span>
                    <Badge tone={a.passed ? "green" : "red"}>
                      <span className="num">{a.score}</span>%
                    </Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  }

  /* ── الاختبار متاح ── */
  return (
    <div className="container-page max-w-3xl space-y-5 py-8">
      <div className="card overflow-hidden">
        <div className="brand-gradient brand-texture px-6 py-7 text-white">
          <nav className="flex items-center gap-2 text-[12.5px] text-brand-100/70">
            <Link href="/dashboard" className="hover:text-white">
              لوحتي
            </Link>
            <span>/</span>
            <span>{track.title}</span>
          </nav>
          <h1 className="mt-2 flex items-center gap-2.5 font-display text-xl font-black sm:text-2xl">
            <IconTarget className="shrink-0 text-brand-300" />
            {quiz.title}
          </h1>
          {quiz.description && (
            <p className="mt-2 max-w-xl text-[13.5px] leading-relaxed text-brand-50/75">
              {quiz.description}
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/20">
              <span className="num">{quiz.questions.length}</span> أسئلة
            </Badge>
            <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/20">
              النجاح من <span className="num">{quiz.passScore}</span>%
            </Badge>
            <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/20">
              {quiz.maxAttempts === 0 ? (
                "محاولات غير محدودة"
              ) : (
                <>
                  <span className="num">{quizNode.attemptsLeft}</span> محاولات
                  متبقّية
                </>
              )}
            </Badge>
            {quiz.timeLimitMinutes > 0 && (
              <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/20">
                <IconClock />
                <span className="num">{quiz.timeLimitMinutes}</span> دقيقة
              </Badge>
            )}
          </div>
        </div>
      </div>

      <QuizClient
        quizId={quiz.id}
        moduleId={mod.id}
        timeLimitMinutes={quiz.timeLimitMinutes}
        moduleTitle={mod.title}
        questions={clientQuestions}
        passScore={quiz.passScore}
        attemptNumber={attempts.length + 1}
        previousBest={attempts.length > 0 ? quizNode.bestScore : null}
        attemptsLeft={quizNode.attemptsLeft}
        nextLessonId={nextLesson?.id ?? null}
      />
    </div>
  );
}
