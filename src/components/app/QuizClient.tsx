"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { submitQuizAction } from "@/app/(student)/actions";
import { Button, LinkButton, Alert, Badge, ProgressBar } from "@/components/ui";
import {
  IconCheck,
  IconCheckCircle,
  IconTarget,
  IconArrowNext,
  IconClose,
  IconClock,
  IconDocument,
} from "@/components/ui/icons";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";

/** الأسئلة تصل إلى المتصفّح بلا أي إشارة إلى الإجابة الصحيحة */
export type ClientQuestion = {
  id: string;
  type: string;
  prompt: string;
  hint: string | null;
  points: number;
  options: { id: string; text: string }[];
};

/** العدد مع المعدود بقواعد العربية: سؤال واحد، سؤالان، 3 أسئلة، 11 سؤالًا */
function remainingQuestions(n: number) {
  if (n === 1) return "بقي سؤال واحد";
  if (n === 2) return "بقي سؤالان";
  if (n >= 3 && n <= 10) return `بقيت ${n} أسئلة`;
  return `بقي ${n} سؤالًا`;
}

type Result = {
  attemptId: string;
  /** رقم المحاولة المحفوظة فعلًا — الخاصية attemptNumber تتقدّم إلى المحاولة
   *  التالية لحظة إعادة تحميل الصفحة بعد الإرسال، فتعرض النتيجةَ برقم خاطئ */
  attemptNumber: number;
  score: number;
  passed: boolean;
  passScore: number;
  earnedPoints: number;
  totalPoints: number;
  needsReview: boolean;
};

export function QuizClient({
  quizId,
  moduleId,
  moduleTitle,
  questions,
  passScore,
  attemptNumber,
  attemptsLeft,
  nextLessonId,
  timeLimitMinutes = 0,
  previousBest = null,
}: {
  quizId: string;
  moduleId: string;
  moduleTitle: string;
  questions: ClientQuestion[];
  passScore: number;
  attemptNumber: number;
  attemptsLeft: number | null;
  nextLessonId: string | null;
  timeLimitMinutes?: number;
  /** أفضل نتيجة سابقة، أو null في المحاولة الأولى */
  previousBest?: number | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [secondsLeft, setSecondsLeft] = useState(timeLimitMinutes * 60);

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => {
        const v = answers[q.id];
        return Array.isArray(v) ? v.length > 0 : Boolean(v && String(v).trim());
      }).length,
    [answers, questions],
  );

  const setSingle = (qid: string, value: string) =>
    setAnswers((s) => ({ ...s, [qid]: value }));

  const toggleMulti = (qid: string, oid: string) =>
    setAnswers((s) => {
      const current = Array.isArray(s[qid]) ? (s[qid] as string[]) : [];
      return {
        ...s,
        [qid]: current.includes(oid)
          ? current.filter((x) => x !== oid)
          : [...current, oid],
      };
    });

  const send = useCallback(
    (payload: Record<string, string | string[]>) => {
      startTransition(async () => {
        const res = await submitQuizAction(quizId, payload);
        if (!res.ok) {
          setError(res.message ?? "تعذّر إرسال الاختبار");
          return;
        }
        setResult(res.data as Result);
        router.refresh();
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    },
    [quizId, router],
  );

  // رسالة «أجب عن جميع الأسئلة» تذكر عددًا؛ تُمحى عند أيّ إجابة جديدة حتى لا تبقى
  // «بقي سؤالان» معروضة بعد أن صار الباقي سؤالًا واحدًا
  useEffect(() => {
    setError(null);
  }, [answeredCount]);

  const submit = () => {
    setError(null);
    if (answeredCount < questions.length) {
      setError(
        `أجب عن جميع الأسئلة قبل الإرسال — ${remainingQuestions(
          questions.length - answeredCount,
        )}.`,
      );
      return;
    }
    send(answers);
  };

  /* ── المؤقّت: يُرسل ما أُجيب عنه تلقائيًا عند انتهاء الوقت ── */
  const answersRef = useRef(answers);
  answersRef.current = answers;
  const submittedRef = useRef(false);

  useEffect(() => {
    if (timeLimitMinutes <= 0 || result) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          if (!submittedRef.current) {
            submittedRef.current = true;
            send(answersRef.current);
          }
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timeLimitMinutes, result, send]);

  const clock = `${String(Math.floor(secondsLeft / 60)).padStart(2, "0")}:${String(
    secondsLeft % 60,
  ).padStart(2, "0")}`;
  const timeCritical = timeLimitMinutes > 0 && secondsLeft <= 60;

  /* ═════════════════════ شاشة النتيجة ═════════════════════ */
  if (result) {
    return (
      <div className="card overflow-hidden">
        <div
          className={`px-6 py-10 text-center text-white ${
            result.passed ? "bg-emerald-600" : "bg-ink-800"
          }`}
        >
          <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-white/15 text-3xl ring-1 ring-white/20">
            {result.passed ? <IconCheckCircle /> : <IconTarget />}
          </span>
          <p className="num mt-4 font-display text-5xl font-black">
            {result.score}%
          </p>
          <h2 className="mt-2 font-display text-xl font-black">
            {result.passed
              ? "أحسنت! لقد أتممت الوحدة."
              : "راجع الدروس ثم أعد الاختبار."}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-[14px] leading-relaxed text-white/75">
            {result.passed
              ? "فُتحت لك الوحدة التالية. واصل على هذا المستوى."
              : `درجة النجاح المطلوبة ${passScore}%. راجع دروس الوحدة جيدًا، ثم أعد المحاولة — لا حدّ للتعلّم.`}
          </p>
        </div>

        <div className="space-y-4 p-6">
          <dl className="grid gap-3 sm:grid-cols-3">
            {[
              { k: "النتيجة", v: `${result.score}%` },
              {
                k: "النقاط",
                v: `${result.earnedPoints} / ${result.totalPoints}`,
              },
              { k: "رقم المحاولة", v: String(result.attemptNumber) },
            ].map((s) => (
              <div key={s.k} className="rounded-xl bg-cream-100 px-4 py-3">
                <dt className="text-[12px] text-ink-500">{s.k}</dt>
                <dd className="num mt-0.5 font-display text-lg font-black text-ink-900">
                  {s.v}
                </dd>
              </div>
            ))}
          </dl>

          {result.needsReview && (
            <Alert tone="info" title="أسئلة بانتظار التصحيح">
              يحتوي هذا الاختبار على سؤال تطبيقي يصحّحه الأستاذ يدويًا. لم يُحتسَب
              ضمن النتيجة الآلية، وستصلك ملاحظاته لاحقًا.
            </Alert>
          )}

          <LinkButton
            href={`/quiz/${moduleId}/review/${result.attemptId}`}
            variant="dark"
            size="lg"
            className="w-full"
          >
            <IconDocument />
            مراجعة إجاباتي سؤالًا بسؤال
          </LinkButton>

          <div className="flex flex-col gap-2 sm:flex-row">
            {result.passed ? (
              <>
                {nextLessonId && (
                  <LinkButton href={`/learn/${nextLessonId}`} size="lg" className="flex-1">
                    متابعة إلى الوحدة التالية
                    <IconArrowNext className="text-lg" />
                  </LinkButton>
                )}
                <LinkButton href="/dashboard" variant="outline" size="lg" className="flex-1">
                  العودة إلى لوحتي
                </LinkButton>
              </>
            ) : (
              <>
                <Button
                  size="lg"
                  className="flex-1"
                  onClick={() => {
                    setResult(null);
                    setAnswers({});
                  }}
                  disabled={attemptsLeft !== null && attemptsLeft <= 1}
                >
                  إعادة المحاولة
                </Button>
                <LinkButton href="/dashboard" variant="outline" size="lg" className="flex-1">
                  مراجعة الدروس
                </LinkButton>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ═════════════════════ شاشة الأسئلة ═════════════════════ */
  return (
    <div className="space-y-5">
      {/* هنا لا في الصفحة: كان يظهر فوق نتيجة المحاولة التي أُرسلت للتوّ
          معلنًا «المحاولة رقم 3» بينما الطالب يقرأ نتيجة المحاولة 2 */}
      {previousBest !== null && (
        <Alert tone="warning" title={`المحاولة رقم ${attemptNumber}`}>
          أفضل نتيجة سابقة: <span className="num font-bold">{previousBest}%</span>.
          راجع الدروس التي أخطأت فيها قبل إعادة المحاولة.
        </Alert>
      )}
      <div className="card sticky top-16 z-10 flex items-center gap-4 px-5 py-3.5">
        <div className="min-w-0 flex-1">
          <p className="num text-[12.5px] font-bold text-ink-500">
            {answeredCount} / {questions.length} سؤالًا
          </p>
          <ProgressBar
            value={(answeredCount / questions.length) * 100}
            size="sm"
            className="mt-1.5"
          />
        </div>
        {timeLimitMinutes > 0 && (
          <Badge tone={timeCritical ? "red" : "ink"}>
            <IconClock />
            <span className="num">{clock}</span>
          </Badge>
        )}
        <Badge tone="ink">
          النجاح من <span className="num">{passScore}</span>%
        </Badge>
      </div>

      {timeCritical && secondsLeft > 0 && (
        <Alert tone="warning">
          بقيت أقل من دقيقة — سيُرسَل الاختبار تلقائيًا عند انتهاء الوقت.
        </Alert>
      )}

      {error && <Alert tone="error">{error}</Alert>}

      <ol className="space-y-4">
        {questions.map((q, i) => (
          <li key={q.id} className="card p-5">
            <div className="flex items-start gap-3">
              <span className="num grid size-8 shrink-0 place-items-center rounded-xl bg-ink-900 text-[13px] font-black text-brand-300">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="slate">{QUESTION_TYPE_LABELS[q.type] ?? q.type}</Badge>
                  {q.points > 1 && (
                    <Badge tone="brand">
                      <span className="num">{q.points}</span> نقاط
                    </Badge>
                  )}
                </div>
                <p className="mt-2.5 text-[15px] leading-loose font-bold text-ink-900">
                  {q.prompt}
                </p>
                {q.hint && (
                  <p className="mt-1 text-[12.5px] text-ink-500">{q.hint}</p>
                )}

                <div className="mt-4 space-y-2">
                  {/* اختيار واحد */}
                  {(q.type === "mcq" || q.type === "true_false") &&
                    q.options.map((o) => {
                      const selected = answers[q.id] === o.id;
                      return (
                        <label
                          key={o.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                            selected
                              ? "border-brand-500 bg-brand-50"
                              : "border-cream-300 hover:border-brand-200 hover:bg-cream-50"
                          }`}
                        >
                          <input
                            type="radio"
                            name={q.id}
                            className="sr-only"
                            checked={selected}
                            onChange={() => setSingle(q.id, o.id)}
                          />
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
                              selected
                                ? "border-brand-600 bg-brand-500 text-white"
                                : "border-ink-300"
                            }`}
                          >
                            {selected && <IconCheck className="text-[11px]" />}
                          </span>
                          <span className="text-[14.5px] leading-relaxed text-ink-800">
                            {o.text}
                          </span>
                        </label>
                      );
                    })}

                  {/* اختيار متعدّد */}
                  {q.type === "multi" &&
                    q.options.map((o) => {
                      const list = Array.isArray(answers[q.id])
                        ? (answers[q.id] as string[])
                        : [];
                      const selected = list.includes(o.id);
                      return (
                        <label
                          key={o.id}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border-2 px-4 py-3 transition-colors ${
                            selected
                              ? "border-brand-500 bg-brand-50"
                              : "border-cream-300 hover:border-brand-200 hover:bg-cream-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={selected}
                            onChange={() => toggleMulti(q.id, o.id)}
                          />
                          <span
                            className={`grid size-5 shrink-0 place-items-center rounded-md border-2 ${
                              selected
                                ? "border-brand-600 bg-brand-500 text-white"
                                : "border-ink-300"
                            }`}
                          >
                            {selected && <IconCheck className="text-[11px]" />}
                          </span>
                          <span className="text-[14.5px] leading-relaxed text-ink-800">
                            {o.text}
                          </span>
                        </label>
                      );
                    })}

                  {/* سؤال قصير */}
                  {q.type === "short" && (
                    <input
                      type="text"
                      value={(answers[q.id] as string) ?? ""}
                      onChange={(e) => setSingle(q.id, e.target.value)}
                      placeholder="اكتب إجابتك…"
                      className="w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-[15px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                    />
                  )}

                  {/* سؤال تطبيقي */}
                  {q.type === "open" && (
                    <>
                      <textarea
                        rows={6}
                        value={(answers[q.id] as string) ?? ""}
                        onChange={(e) => setSingle(q.id, e.target.value)}
                        placeholder="حرّر إجابتك هنا…"
                        className="w-full resize-y rounded-xl border border-cream-300 bg-white px-4 py-3 text-[14.5px] leading-loose outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                      />
                      <p className="text-[12px] text-ink-500">
                        هذا السؤال يصحّحه الأستاذ يدويًا ولا يدخل في الحساب الآلي
                        للنتيجة.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ol>

      <div className="card flex flex-col items-center gap-3 p-5 sm:flex-row sm:justify-between">
        <p className="text-[13px] text-ink-500">
          {answeredCount === questions.length
            ? "أجبت عن جميع الأسئلة — يمكنك الإرسال."
            : `${remainingQuestions(questions.length - answeredCount)}.`}
        </p>
        <div className="flex w-full gap-2 sm:w-auto">
          <LinkButton href="/dashboard" variant="ghost" size="lg">
            <IconClose />
            إنهاء لاحقًا
          </LinkButton>
          <Button onClick={submit} disabled={pending} size="lg" className="flex-1 sm:flex-none">
            {pending ? "جارٍ التصحيح…" : `إرسال إجابات ${moduleTitle.slice(0, 18)}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
