import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db, parseJson } from "@/lib/db";
import {
  saveQuizAction,
  saveQuestionAction,
  deleteQuestionAction,
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
import { Badge, LinkButton, Alert } from "@/components/ui";
import { IconArrowPrev, IconTrash, IconPlus } from "@/components/ui/icons";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تحرير الاختبار" };

const TYPE_OPTIONS = Object.entries(QUESTION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default async function QuizEditorPage({
  params,
}: {
  params: Promise<{ moduleId: string }>;
}) {
  await requireAdmin();
  const { moduleId } = await params;

  const mod = await db.module.findUnique({
    where: { id: moduleId },
    include: {
      track: true,
      quiz: {
        include: {
          questions: {
            orderBy: { order: "asc" },
            include: { options: { orderBy: { order: "asc" } } },
          },
          _count: { select: { attempts: true } },
        },
      },
    },
  });
  if (!mod) notFound();

  const quiz = mod.quiz;

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
        <h1 className="mt-3 font-display text-xl font-black text-ink-900 sm:text-2xl">
          اختبار الوحدة
        </h1>
        <p className="mt-1 text-[13px] text-ink-500">
          {mod.track.title} · {mod.title}
          {quiz && (
            <>
              {" "}
              · <span className="num">{quiz._count.attempts}</span> محاولة مسجّلة
            </>
          )}
        </p>
      </div>

      {/* ── إعدادات الاختبار ── */}
      <section className="card p-5 sm:p-6">
        <h2 className="font-display text-[16px] font-black text-ink-900">
          إعدادات الاختبار
        </h2>
        <div className="mt-5">
          <AdminForm action={saveQuizAction}>
            <input type="hidden" name="moduleId" value={mod.id} />

            <Field
              label="عنوان الاختبار"
              name="title"
              required
              defaultValue={quiz?.title ?? `اختبار ${mod.title}`}
            />
            <TextArea
              label="وصف الاختبار"
              name="description"
              rows={2}
              defaultValue={
                quiz?.description ??
                "اختبار قصير للتأكد من استيعابك لدروس الوحدة قبل الانتقال إلى الوحدة التالية."
              }
            />

            <div className="grid gap-4 sm:grid-cols-3">
              <Field
                label="درجة النجاح %"
                name="passScore"
                type="number"
                min={0}
                max={100}
                defaultValue={quiz?.passScore ?? 70}
              />
              <Field
                label="عدد المحاولات"
                name="maxAttempts"
                type="number"
                min={0}
                defaultValue={quiz?.maxAttempts ?? 0}
                hint="0 = غير محدود"
              />
              <Field
                label="المدّة بالدقائق"
                name="timeLimitMinutes"
                type="number"
                min={0}
                defaultValue={quiz?.timeLimitMinutes ?? 0}
                hint="0 = بلا حدّ زمني"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <Toggle
                label="منشور"
                name="isPublished"
                defaultChecked={quiz?.isPublished ?? true}
              />
              <Toggle
                label="خلط ترتيب الأسئلة"
                name="shuffleQuestions"
                defaultChecked={quiz?.shuffleQuestions ?? false}
              />
              <Select
                label="الباقة المطلوبة"
                name="requiredPlan"
                defaultValue={quiz?.requiredPlan ?? "start"}
                options={[
                  { value: "start", label: "START" },
                  { value: "premium", label: "PREMIUM ELITE" },
                ]}
              />
            </div>

            <SubmitButton>
              {quiz ? "حفظ الإعدادات" : "إنشاء الاختبار"}
            </SubmitButton>
          </AdminForm>
        </div>
      </section>

      {!quiz && (
        <Alert tone="info">
          أنشئ الاختبار أولًا من النموذج أعلاه، ثم ستتمكّن من إضافة الأسئلة.
        </Alert>
      )}

      {/* ── الأسئلة الحالية ── */}
      {quiz && (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-[16px] font-black text-ink-900">
              الأسئلة (<span className="num">{quiz.questions.length}</span>)
            </h2>

            {quiz.questions.length === 0 && (
              <p className="card px-5 py-8 text-center text-[13px] text-ink-500">
                لا توجد أسئلة بعد — أضف أول سؤال من النموذج أدناه.
              </p>
            )}

            {quiz.questions.map((q, i) => {
              const accepted = parseJson<string[]>(q.acceptedAnswers, []);
              return (
                <details key={q.id} className="card overflow-hidden">
                  <summary className="flex cursor-pointer items-start gap-3 px-5 py-4 hover:bg-cream-50">
                    <span className="num grid size-7 shrink-0 place-items-center rounded-lg bg-ink-900 text-[12px] font-black text-brand-300">
                      {i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] leading-snug font-bold text-ink-900">
                        {q.prompt}
                      </span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <Badge tone="slate">
                          {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                        </Badge>
                        <Badge tone="brand">
                          <span className="num">{q.points}</span> نقطة
                        </Badge>
                        {q.options.length > 0 && (
                          <Badge tone="ink">
                            <span className="num">{q.options.length}</span> خيارات
                          </Badge>
                        )}
                      </span>
                    </span>
                  </summary>

                  <div className="border-t border-cream-200 bg-cream-50/60 p-5">
                    <AdminForm action={saveQuestionAction}>
                      <input type="hidden" name="id" value={q.id} />
                      <input type="hidden" name="quizId" value={quiz.id} />

                      <TextArea
                        label="نصّ السؤال"
                        name="prompt"
                        rows={2}
                        defaultValue={q.prompt}
                      />

                      <div className="grid gap-4 sm:grid-cols-3">
                        <Select
                          label="نوع السؤال"
                          name="type"
                          defaultValue={q.type}
                          options={TYPE_OPTIONS}
                        />
                        <Field
                          label="النقاط"
                          name="points"
                          type="number"
                          min={1}
                          defaultValue={q.points}
                        />
                        <Field
                          label="الترتيب"
                          name="order"
                          type="number"
                          min={0}
                          defaultValue={q.order}
                        />
                      </div>

                      <TextArea
                        label="الخيارات"
                        name="options"
                        rows={4}
                        mono
                        defaultValue={q.options
                          .map((o) => (o.isCorrect ? `*${o.text}` : o.text))
                          .join("\n")}
                        hint="خيار في كل سطر — ضع * في بداية السطر للإجابة الصحيحة."
                      />

                      <TextArea
                        label="الإجابات المقبولة (للسؤال القصير)"
                        name="acceptedAnswers"
                        rows={2}
                        mono
                        defaultValue={accepted.join("\n")}
                        hint="إجابة في كل سطر — تُقارَن بتجاهل التشكيل وصيغ الألف والهاء."
                      />

                      <Field
                        label="تلميح (اختياري)"
                        name="hint"
                        defaultValue={q.hint}
                      />
                      <TextArea
                        label="شرح الإجابة"
                        name="explanation"
                        rows={2}
                        defaultValue={q.explanation}
                      />

                      <div className="flex gap-2">
                        <SubmitButton>حفظ السؤال</SubmitButton>
                        <ActionButton
                          action={deleteQuestionAction.bind(null, q.id)}
                          tone="danger"
                          confirm="حذف هذا السؤال؟"
                        >
                          <IconTrash />
                          حذف
                        </ActionButton>
                      </div>
                    </AdminForm>
                  </div>
                </details>
              );
            })}
          </section>

          {/* ── إضافة سؤال ── */}
          <section className="card p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-[16px] font-black text-ink-900">
              <IconPlus />
              إضافة سؤال جديد
            </h2>
            <div className="mt-5">
              <AdminForm action={saveQuestionAction}>
                <input type="hidden" name="quizId" value={quiz.id} />

                <TextArea
                  label="نصّ السؤال"
                  name="prompt"
                  rows={2}
                  placeholder="ما الوظيفة الأساسية للمقدمة في الإنشاء التاريخي؟"
                />

                <div className="grid gap-4 sm:grid-cols-3">
                  <Select
                    label="نوع السؤال"
                    name="type"
                    defaultValue="mcq"
                    options={TYPE_OPTIONS}
                  />
                  <Field label="النقاط" name="points" type="number" min={1} defaultValue={1} />
                  <Field
                    label="الترتيب"
                    name="order"
                    type="number"
                    min={0}
                    defaultValue={quiz.questions.length}
                  />
                </div>

                <TextArea
                  label="الخيارات"
                  name="options"
                  rows={4}
                  mono
                  placeholder={"*الإجابة الصحيحة\nخيار خاطئ\nخيار خاطئ آخر"}
                  hint="خيار في كل سطر — ضع * في بداية السطر للإجابة الصحيحة. اتركه فارغًا للأسئلة القصيرة والتطبيقية."
                />

                <TextArea
                  label="الإجابات المقبولة (للسؤال القصير)"
                  name="acceptedAnswers"
                  rows={2}
                  mono
                  placeholder={"الإشكالية\nالإشكال"}
                />

                <TextArea label="شرح الإجابة" name="explanation" rows={2} />

                <SubmitButton variant="brand">
                  <IconPlus />
                  إضافة السؤال
                </SubmitButton>
              </AdminForm>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
