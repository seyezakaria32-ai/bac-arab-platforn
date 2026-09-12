import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurriculum } from "@/lib/curriculum";
import { getDefaultCourse } from "@/lib/curriculum";
import { formatPrice } from "@/lib/payments/service";
import { PAYMENT_STATUS_LABELS, PROVIDER_LABELS } from "@/lib/constants";
import {
  grantSubscriptionAction,
  revokeSubscriptionAction,
  toggleStudentActiveAction,
  resetStudentProgressAction,
} from "../../actions";
import {
  AdminForm,
  Select,
  SubmitButton,
  ActionButton,
} from "@/components/admin/Form";
import { Badge, ProgressBar, StatCard, ProgressRing } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  IconArrowPrev,
  IconCheckCircle,
  IconPlayCircle,
  IconCircle,
  IconLock,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "ملف الطالب" };

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;

  const student = await db.user.findUnique({
    where: { id },
    include: {
      subscriptions: { include: { plan: true, course: true } },
      payments: { include: { plan: true }, orderBy: { createdAt: "desc" } },
      attempts: {
        where: { submittedAt: { not: null } },
        include: { quiz: { include: { module: true } } },
        orderBy: { submittedAt: "desc" },
      },
      certificates: true,
    },
  });
  if (!student) notFound();

  const [curriculum, course, plans] = await Promise.all([
    getCurriculum({ id: student.id, role: student.role }),
    getDefaultCourse(),
    db.plan.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
  ]);

  const sub = student.subscriptions[0];
  const avgScore =
    student.attempts.length > 0
      ? Math.round(
          student.attempts.reduce((s, a) => s + a.score, 0) /
            student.attempts.length,
        )
      : 0;

  return (
    <div className="container-page max-w-5xl space-y-6 py-8">
      <div>
        <Link
          href="/admin/students"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-700"
        >
          <IconArrowPrev />
          كل الطلاب
        </Link>
      </div>

      {/* ── الترويسة ── */}
      <section className="card overflow-hidden">
        <div className="flex flex-wrap items-center gap-5 px-5 py-5 sm:px-6">
          <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-ink-900 font-display text-xl font-black text-brand-300">
            {student.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-black text-ink-900">
              {student.name}
              {!student.isActive && (
                <Badge tone="red" className="mr-2">
                  موقوف
                </Badge>
              )}
            </h1>
            <p dir="ltr" className="text-right text-[13px] text-ink-500">
              {student.email}
            </p>
            <p className="num mt-1 text-[12px] text-ink-500">
              انضمّ في {formatDate(student.createdAt)}
              {student.phone && ` · ${student.phone}`}
              {student.lastSeenAt &&
                ` · آخر ظهور ${formatDate(student.lastSeenAt)}`}
            </p>
          </div>
          <ProgressRing value={curriculum?.percent ?? 0} size={72} stroke={8} />
          <div className="flex gap-1.5">
            <ActionButton
              action={toggleStudentActiveAction.bind(null, student.id)}
              tone="outline"
              confirm={
                student.isActive
                  ? "إيقاف حساب الطالب؟ لن يستطيع تسجيل الدخول."
                  : "إعادة تفعيل الحساب؟"
              }
            >
              {student.isActive ? "إيقاف الحساب" : "تفعيل الحساب"}
            </ActionButton>
            <ActionButton
              action={resetStudentProgressAction.bind(null, student.id)}
              tone="danger"
              confirm="سيُمحى كل تقدّم الطالب في الدروس ويعود إلى البداية. متابعة؟"
            >
              تصفير التقدّم
            </ActionButton>
          </div>
        </div>
      </section>

      {/* ── الأرقام ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="نسبة التقدّم"
          value={`${curriculum?.percent ?? 0}%`}
          tone="brand"
        />
        <StatCard
          label="دروس مكتملة"
          value={curriculum?.completedLessons ?? 0}
          hint={`من ${curriculum?.totalLessons ?? 0}`}
          tone="green"
        />
        <StatCard label="محاولات الاختبار" value={student.attempts.length} />
        <StatCard label="متوسّط النتائج" value={`${avgScore}%`} tone="gold" />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_.85fr] lg:items-start">
        {/* ── تقدّم الوحدات ── */}
        <section className="card overflow-hidden">
          <h2 className="border-b border-cream-200 px-5 py-4 font-display text-[15px] font-black text-ink-900">
            التقدّم في الوحدات
          </h2>
          {curriculum ? (
            <div className="divide-y divide-cream-200">
              {curriculum.tracks.map((track) => (
                <div key={track.id}>
                  <p className="bg-cream-50 px-5 py-2.5 text-[12.5px] font-black text-ink-800">
                    {track.title}
                  </p>
                  <ul>
                    {track.modules.map((m) => (
                      <li
                        key={m.id}
                        className="flex items-center gap-3 px-5 py-3"
                      >
                        {m.cleared ? (
                          <IconCheckCircle className="text-emerald-600" />
                        ) : m.completedLessons > 0 ? (
                          <IconPlayCircle className="text-brand-600" />
                        ) : m.accessible ? (
                          <IconCircle className="text-ink-300" />
                        ) : (
                          <IconLock className="text-ink-300" />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[13px] font-bold text-ink-800">
                            {m.title}
                          </span>
                          <ProgressBar
                            value={m.percent}
                            size="sm"
                            className="mt-1.5 w-32"
                          />
                        </span>
                        <span className="num shrink-0 text-[12px] text-ink-500">
                          {m.completedLessons}/{m.totalLessons}
                        </span>
                        {m.quiz?.passed && (
                          <Badge tone="green">
                            <span className="num">{m.quiz.bestScore}</span>%
                          </Badge>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}

          {curriculum?.currentLesson && (
            <div className="border-t border-cream-200 bg-brand-50/50 px-5 py-3.5">
              <p className="text-[12px] text-ink-500">آخر درس وصل إليه</p>
              <p className="mt-0.5 text-[13.5px] font-bold text-ink-900">
                {curriculum.currentLesson.title}
              </p>
            </div>
          )}
        </section>

        <div className="space-y-6">
          {/* ── الاشتراك ── */}
          <section className="card p-5">
            <h2 className="font-display text-[15px] font-black text-ink-900">
              الاشتراك
            </h2>

            {sub ? (
              <div className="mt-3 space-y-2 text-[13px]">
                <div className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-2.5">
                  <span className="text-ink-500">الباقة</span>
                  <Badge tone={sub.plan.code === "PREMIUM_ELITE" ? "gold" : "brand"}>
                    {sub.plan.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-2.5">
                  <span className="text-ink-500">الحالة</span>
                  <Badge tone={sub.status === "active" ? "green" : "amber"}>
                    {sub.status === "active"
                      ? "نشِط"
                      : sub.status === "pending"
                        ? "بانتظار الدفع"
                        : sub.status === "expired"
                          ? "منتهٍ"
                          : "ملغى"}
                  </Badge>
                </div>
                {sub.status === "active" && (
                  <ActionButton
                    action={revokeSubscriptionAction.bind(null, sub.id)}
                    tone="danger"
                    confirm="إلغاء اشتراك هذا الطالب؟ سيفقد الوصول إلى المحتوى."
                  >
                    إلغاء الاشتراك
                  </ActionButton>
                )}
              </div>
            ) : (
              <p className="mt-2 text-[13px] text-ink-500">لا يوجد اشتراك.</p>
            )}

            {course && (
              <div className="mt-5 border-t border-cream-200 pt-4">
                <h3 className="text-[13px] font-bold text-ink-800">
                  منح اشتراك يدويًا
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-ink-500">
                  للطلاب الذين دفعوا خارج المنصّة (نقدًا أو تحويل مباشر).
                </p>
                <div className="mt-3">
                  <AdminForm action={grantSubscriptionAction} className="space-y-3">
                    <input type="hidden" name="userId" value={student.id} />
                    <input type="hidden" name="courseId" value={course.id} />
                    <Select
                      label="الباقة"
                      name="planCode"
                      options={plans.map((p) => ({
                        value: p.code,
                        label: p.name,
                      }))}
                    />
                    <SubmitButton variant="brand">تفعيل الاشتراك</SubmitButton>
                  </AdminForm>
                </div>
              </div>
            )}
          </section>

          {/* ── المدفوعات ── */}
          {student.payments.length > 0 && (
            <section className="card overflow-hidden">
              <h2 className="border-b border-cream-200 px-5 py-4 font-display text-[15px] font-black text-ink-900">
                المدفوعات
              </h2>
              <ul className="divide-y divide-cream-200">
                {student.payments.map((p) => (
                  <li key={p.id} className="px-5 py-3 text-[12.5px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="num font-bold text-ink-900">
                        {p.reference}
                      </span>
                      <Badge
                        tone={
                          p.status === "paid"
                            ? "green"
                            : p.status === "failed"
                              ? "red"
                              : "amber"
                        }
                      >
                        {PAYMENT_STATUS_LABELS[p.status] ?? p.status}
                      </Badge>
                    </div>
                    <p className="num mt-1 text-ink-500">
                      {formatPrice(p.amountCents, p.currency)} ·{" "}
                      {PROVIDER_LABELS[p.provider] ?? p.provider} ·{" "}
                      {formatDate(p.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </div>

      {/* ── نتائج الاختبارات ── */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-cream-200 px-5 py-4 font-display text-[15px] font-black text-ink-900">
          نتائج الاختبارات
        </h2>
        {student.attempts.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-ink-500">
            لم يُنجز الطالب أي اختبار بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-cream-50 text-[12px] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">الوحدة</th>
                  <th className="px-4 py-3 font-medium">المحاولة</th>
                  <th className="px-4 py-3 font-medium">النقاط</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-5 py-3 font-medium">النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {student.attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-cream-50/60">
                    <td className="px-5 py-3 font-bold text-ink-900">
                      {a.quiz.module.title}
                    </td>
                    <td className="num px-4 py-3 text-ink-500">
                      {a.attemptNumber}
                    </td>
                    <td className="num px-4 py-3 text-ink-700">
                      {a.earnedPoints}/{a.totalPoints}
                    </td>
                    <td className="num px-4 py-3 text-ink-500">
                      {formatDate(a.submittedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={a.passed ? "green" : "red"}>
                        <span className="num">{a.score}</span>%
                      </Badge>
                      {a.needsReview && (
                        <Badge tone="amber" className="mr-1.5">
                          يحتاج تصحيحًا
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
