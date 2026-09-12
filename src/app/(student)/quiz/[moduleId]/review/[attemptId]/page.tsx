import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { getReviewedAttempt } from "@/lib/attempts";
import { getSettings } from "@/lib/settings";
import { ROLES } from "@/lib/constants";
import { Badge, LinkButton, Alert, ProgressBar } from "@/components/ui";
import {
  IconArrowPrev,
  IconCheckCircle,
  IconTarget,
} from "@/components/ui/icons";
import { AttemptReview } from "@/components/app/AttemptReview";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "مراجعة الإجابات" };

export default async function AttemptReviewPage({
  params,
}: {
  params: Promise<{ moduleId: string; attemptId: string }>;
}) {
  const { moduleId, attemptId } = await params;
  const user = await requireUser(`/quiz/${moduleId}/review/${attemptId}`);

  const attempt = await getReviewedAttempt(attemptId);
  if (!attempt) notFound();

  // الطالب يرى محاولاته فقط — والمسؤول يرى الجميع
  if (attempt.student.id !== user.id && user.role !== ROLES.ADMIN) notFound();

  const settings = await getSettings();
  const showAnswers = settings["quiz.showCorrectAnswers"];

  return (
    <div className="container-page max-w-3xl space-y-5 py-8">
      <Link
        href={`/quiz/${moduleId}`}
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-700"
      >
        <IconArrowPrev />
        العودة إلى الاختبار
      </Link>

      {/* ── ملخّص النتيجة ── */}
      <section className="card overflow-hidden">
        <div
          className={`px-6 py-7 text-white ${
            attempt.passed ? "bg-emerald-600" : "bg-ink-800"
          }`}
        >
          <p className="text-[12.5px] text-white/70">
            {attempt.trackTitle} · {attempt.moduleTitle}
          </p>
          <h1 className="mt-1 flex items-center gap-2.5 font-display text-xl font-black">
            {attempt.passed ? <IconCheckCircle /> : <IconTarget />}
            {attempt.quizTitle}
          </h1>

          <div className="mt-5 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[12px] text-white/70">النتيجة</p>
              <p className="num font-display text-4xl font-black">
                {attempt.score}%
              </p>
            </div>
            <div>
              <p className="text-[12px] text-white/70">النقاط</p>
              <p className="num font-display text-xl font-black">
                {attempt.earnedPoints}/{attempt.totalPoints}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-white/70">المحاولة</p>
              <p className="num font-display text-xl font-black">
                {attempt.attemptNumber}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-white/70">التاريخ</p>
              <p className="num font-display text-xl font-black">
                {formatDate(attempt.submittedAt)}
              </p>
            </div>
          </div>

          <ProgressBar
            value={attempt.score}
            className="mt-5 [&>div]:bg-white/20"
          />
          <p className="mt-2 text-[12px] text-white/70">
            درجة النجاح المطلوبة:{" "}
            <span className="num font-bold">{attempt.passScore}%</span>
          </p>
        </div>
      </section>

      {attempt.needsReview && (
        <Alert tone="warning" title="سؤال تطبيقي بانتظار تصحيح الأستاذ">
          نتيجتك الحالية محسوبة من الأسئلة الآلية فقط. بعد أن يصحّح الأستاذ
          السؤال التطبيقي ستُحدَّث النتيجة وتصلك ملاحظاته هنا.
        </Alert>
      )}

      {attempt.reviewNote && (
        <Alert tone="info" title="ملاحظات الأستاذ">
          <p className="leading-loose whitespace-pre-wrap">
            {attempt.reviewNote}
          </p>
        </Alert>
      )}

      {/* ── تفصيل الإجابات ── */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            تفصيل الإجابات
          </h2>
          <Badge tone="green">
            <span className="num">
              {attempt.questions.filter((q) => q.correct === true).length}
            </span>{" "}
            صحيحة من{" "}
            <span className="num">{attempt.questions.length}</span>
          </Badge>
        </div>

        {!showAnswers && (
          <p className="mb-3 rounded-xl bg-cream-200/60 px-4 py-2.5 text-[12.5px] text-ink-500">
            عرض الإجابات الصحيحة معطَّل من الإدارة — تظهر لك صحّة إجابتك فقط.
          </p>
        )}

        <AttemptReview
          questions={attempt.questions}
          showAnswers={showAnswers}
        />
      </section>

      <div className="flex flex-col gap-2 sm:flex-row">
        <LinkButton href={`/quiz/${moduleId}`} className="flex-1">
          العودة إلى الاختبار
        </LinkButton>
        <LinkButton href="/dashboard" variant="outline" className="flex-1">
          لوحتي
        </LinkButton>
      </div>
    </div>
  );
}
