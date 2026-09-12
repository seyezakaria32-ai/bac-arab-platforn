import { Badge } from "@/components/ui";
import {
  IconCheck,
  IconClose,
  IconClock,
  IconCheckCircle,
} from "@/components/ui/icons";
import { QUESTION_TYPE_LABELS } from "@/lib/constants";
import type { ReviewedQuestion } from "@/lib/attempts";

/**
 * عرض تفصيلي لإجابات محاولة اختبار.
 * `showAnswers=false` يُخفي الإجابة الصحيحة والشرح (إعداد لوحة الإدارة)،
 * ويبقى الطالب يرى ما أجاب به وهل كان صحيحًا.
 */
export function AttemptReview({
  questions,
  showAnswers = true,
}: {
  questions: ReviewedQuestion[];
  showAnswers?: boolean;
}) {
  return (
    <ol className="space-y-3">
      {questions.map((q, i) => {
        const pending = q.correct === null;
        const tone = pending
          ? "border-amber-200 bg-amber-50/40"
          : q.correct
            ? "border-emerald-200 bg-emerald-50/40"
            : "border-red-200 bg-red-50/40";

        return (
          <li key={q.id} className={`rounded-2xl border-2 p-5 ${tone}`}>
            <div className="flex items-start gap-3">
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-xl text-[14px] text-white ${
                  pending
                    ? "bg-amber-500"
                    : q.correct
                      ? "bg-emerald-600"
                      : "bg-red-500"
                }`}
              >
                {pending ? (
                  <IconClock />
                ) : q.correct ? (
                  <IconCheck />
                ) : (
                  <IconClose />
                )}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="num text-[12px] font-bold text-ink-500">
                    السؤال {i + 1}
                  </span>
                  <Badge tone="slate">
                    {QUESTION_TYPE_LABELS[q.type] ?? q.type}
                  </Badge>
                  <Badge
                    tone={pending ? "amber" : q.correct ? "green" : "red"}
                  >
                    {/* الكسر داخل عنصر واحد — تقسيمه على عنصرين يقلب ترتيبه في RTL */}
                    <span className="num">
                      {q.earned}/{q.points}
                    </span>{" "}
                    نقطة
                  </Badge>
                  {pending && <Badge tone="amber">بانتظار تصحيح الأستاذ</Badge>}
                </div>

                <p className="mt-2 text-[14.5px] leading-loose font-bold text-ink-900">
                  {q.prompt}
                </p>

                {/* خيارات الأسئلة الاختيارية */}
                {q.options.length > 0 ? (
                  <ul className="mt-3 space-y-1.5">
                    {q.options.map((o) => {
                      const reveal = showAnswers && o.isCorrect;
                      return (
                        <li
                          key={o.id}
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2 text-[13.5px] ${
                            reveal
                              ? "border-emerald-300 bg-white font-bold text-emerald-800"
                              : o.chosen
                                ? "border-red-300 bg-white text-red-800"
                                : "border-transparent bg-white/60 text-ink-500"
                          }`}
                        >
                          <span
                            className={`grid size-4 shrink-0 place-items-center rounded-full border-2 ${
                              o.chosen
                                ? reveal
                                  ? "border-emerald-600 bg-emerald-600 text-white"
                                  : "border-red-500 bg-red-500 text-white"
                                : reveal
                                  ? "border-emerald-500"
                                  : "border-ink-300/50"
                            }`}
                          >
                            {o.chosen && <IconCheck className="text-[9px]" />}
                          </span>
                          <span className="flex-1">{o.text}</span>
                          {o.chosen && (
                            <span className="shrink-0 text-[11px] font-bold">
                              إجابتك
                            </span>
                          )}
                          {reveal && !o.chosen && (
                            <span className="shrink-0 text-[11px] font-bold">
                              الصحيحة
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="mt-3 space-y-2">
                    <div className="rounded-xl bg-white px-3.5 py-2.5">
                      <p className="text-[11.5px] font-bold text-ink-500">
                        إجابتك
                      </p>
                      <p className="mt-0.5 text-[13.5px] leading-loose whitespace-pre-wrap text-ink-800">
                        {q.givenText}
                      </p>
                    </div>
                    {showAnswers && q.correctText && (
                      <div className="rounded-xl bg-white px-3.5 py-2.5">
                        <p className="text-[11.5px] font-bold text-emerald-700">
                          الإجابة المقبولة
                        </p>
                        <p className="mt-0.5 text-[13.5px] leading-loose text-ink-800">
                          {q.correctText}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {showAnswers && q.explanation && (
                  <p className="mt-3 flex items-start gap-2 rounded-xl bg-white px-3.5 py-2.5 text-[13px] leading-loose text-ink-700">
                    <IconCheckCircle className="mt-1 shrink-0 text-brand-600" />
                    {q.explanation}
                  </p>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
