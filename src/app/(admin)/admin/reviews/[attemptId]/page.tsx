import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { getReviewedAttempt } from "@/lib/attempts";
import { gradeAttemptAction } from "../../actions";
import {
  AdminForm,
  Field,
  TextArea,
  SubmitButton,
} from "@/components/admin/Form";
import { Badge, Alert, ProgressBar } from "@/components/ui";
import {
  IconArrowPrev,
  IconEdit,
  IconCheckCircle,
  IconClock,
} from "@/components/ui/icons";
import { AttemptReview } from "@/components/app/AttemptReview";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تصحيح عمل الطالب" };

export default async function GradeAttemptPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  await requireAdmin();
  const { attemptId } = await params;

  const attempt = await getReviewedAttempt(attemptId);
  if (!attempt) notFound();

  const openQuestions = attempt.questions.filter(
    (q) => q.type === "open" || q.correct === null,
  );

  return (
    <div className="container-page max-w-3xl space-y-5 py-8">
      <Link
        href="/admin/reviews"
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-700"
      >
        <IconArrowPrev />
        قائمة التصحيح
      </Link>

      {/* ── ترويسة ── */}
      <section className="card overflow-hidden">
        <div className="brand-gradient brand-texture px-6 py-6 text-white">
          <p className="text-[12.5px] text-brand-100/70">
            {attempt.trackTitle} · {attempt.moduleTitle}
          </p>
          <h1 className="mt-1 font-display text-xl font-black">
            {attempt.student.name}
          </h1>
          <p dir="ltr" className="text-right text-[12.5px] text-brand-50/70">
            {attempt.student.email}
          </p>

          <div className="mt-5 flex flex-wrap items-end gap-6">
            <div>
              <p className="text-[12px] text-brand-100/70">النتيجة الحالية</p>
              <p className="num font-display text-3xl font-black">
                {attempt.score}%
              </p>
            </div>
            <div>
              <p className="text-[12px] text-brand-100/70">النقاط</p>
              <p className="num font-display text-lg font-black">
                {attempt.earnedPoints}/{attempt.totalPoints}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-brand-100/70">المحاولة</p>
              <p className="num font-display text-lg font-black">
                {attempt.attemptNumber}
              </p>
            </div>
            <div>
              <p className="text-[12px] text-brand-100/70">النجاح من</p>
              <p className="num font-display text-lg font-black">
                {attempt.passScore}%
              </p>
            </div>
          </div>
          <ProgressBar
            value={attempt.score}
            className="mt-4 [&>div]:bg-white/20"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 py-3.5">
          <Badge tone={attempt.needsReview ? "amber" : "green"}>
            {attempt.needsReview ? (
              <>
                <IconClock />
                بانتظار التصحيح
              </>
            ) : (
              <>
                <IconCheckCircle />
                مصحَّح
              </>
            )}
          </Badge>
          <Link
            href={`/admin/students/${attempt.student.id}`}
            className="text-[12.5px] font-bold text-brand-700 hover:underline"
          >
            ملف الطالب
          </Link>
        </div>
      </section>

      {/* ── نموذج التصحيح ── */}
      {openQuestions.length > 0 ? (
        <section className="card p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-[16px] font-black text-ink-900">
            <IconEdit className="text-brand-600" />
            تصحيح الأسئلة التطبيقية
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            امنح كل سؤال نقطته، ثم أضف ملاحظاتك للطالب. تُعاد النتيجة تلقائيًا
            على مجموع الأسئلة.
          </p>

          <div className="mt-5">
            <AdminForm action={gradeAttemptAction}>
              <input type="hidden" name="attemptId" value={attempt.id} />

              {openQuestions.map((q, i) => (
                <div
                  key={q.id}
                  className="rounded-2xl border border-cream-300 bg-cream-50/60 p-4"
                >
                  <p className="num text-[12px] font-bold text-ink-500">
                    سؤال تطبيقي {i + 1} · من {q.points} نقاط
                  </p>
                  <p className="mt-1.5 text-[14px] leading-loose font-bold text-ink-900">
                    {q.prompt}
                  </p>

                  <div className="mt-3 rounded-xl bg-white px-4 py-3">
                    <p className="text-[11.5px] font-bold text-ink-500">
                      إجابة الطالب
                    </p>
                    <p className="mt-1 text-[14px] leading-loose whitespace-pre-wrap text-ink-800">
                      {q.givenText}
                    </p>
                  </div>

                  <div className="mt-3 max-w-40">
                    <Field
                      label="النقطة الممنوحة"
                      name={`points_${q.id}`}
                      type="number"
                      min={0}
                      max={q.points}
                      defaultValue={q.correct === null ? undefined : q.earned}
                      hint={`من ${q.points}`}
                    />
                  </div>
                </div>
              ))}

              <TextArea
                label="ملاحظات للطالب"
                name="note"
                rows={5}
                defaultValue={attempt.reviewNote}
                placeholder="مثال: مقدمتك سليمة البناء، لكن الإشكالية جاءت عامة. ركّز على ربطها بالمجال الزمني للموضوع…"
                hint="تظهر للطالب في صفحة مراجعة إجاباته."
              />

              <SubmitButton variant="brand">
                <IconCheckCircle />
                حفظ التصحيح وتحديث النتيجة
              </SubmitButton>
            </AdminForm>
          </div>
        </section>
      ) : (
        <Alert tone="success" title="لا يوجد سؤال يحتاج تصحيحًا يدويًا">
          كل أسئلة هذه المحاولة صُحِّحت آليًا.
        </Alert>
      )}

      {/* ── كل الإجابات ── */}
      <section>
        <h2 className="mb-3 font-display text-[16px] font-black text-ink-900">
          كل إجابات الطالب
        </h2>
        <AttemptReview questions={attempt.questions} showAnswers />
      </section>
    </div>
  );
}
