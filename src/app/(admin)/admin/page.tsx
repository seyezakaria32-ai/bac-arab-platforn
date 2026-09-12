import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { formatPrice } from "@/lib/payments/service";
import { PAYMENT_STATUS_LABELS } from "@/lib/constants";
import { Badge, StatCard, ProgressBar, LinkButton } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  IconUsers,
  IconWallet,
  IconAward,
  IconChart,
  IconSparkle,
  IconArrowNext,
  IconPlayCircle,
  IconClock,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "لوحة الإدارة" };

const DAY = 86_400_000;

export default async function AdminHome() {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY);
  const twoWeeksAgo = new Date(now - 14 * DAY);

  const [
    studentCount,
    activeCount,
    subsByPlan,
    paidPayments,
    pendingPayments,
    totalLessons,
    completedProgress,
    attemptsAgg,
    topLessons,
    stalled,
    recentPayments,
    certificates,
  ] = await Promise.all([
    db.user.count({ where: { role: "student" } }),
    db.user.count({ where: { role: "student", lastSeenAt: { gte: weekAgo } } }),
    db.subscription.groupBy({
      by: ["planId"],
      where: { status: "active" },
      _count: { _all: true },
    }),
    db.payment.findMany({
      where: { status: "paid" },
      select: { amountCents: true, currency: true },
    }),
    db.payment.count({ where: { status: { in: ["pending", "awaiting_review"] } } }),
    db.lesson.count({ where: { isPublished: true } }),
    db.lessonProgress.count({ where: { status: "completed" } }),
    db.quizAttempt.aggregate({
      _avg: { score: true },
      _count: { _all: true },
      where: { submittedAt: { not: null } },
    }),
    db.lessonProgress.groupBy({
      by: ["lessonId"],
      _sum: { viewCount: true },
      orderBy: { _sum: { viewCount: "desc" } },
      take: 5,
    }),
    db.user.findMany({
      where: {
        role: "student",
        lastSeenAt: { lt: twoWeeksAgo },
        subscriptions: { some: { status: "active" } },
      },
      select: { id: true, name: true, email: true, lastSeenAt: true },
      orderBy: { lastSeenAt: "asc" },
      take: 6,
    }),
    db.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { user: true, plan: true },
    }),
    db.certificate.count(),
  ]);

  const plans = await db.plan.findMany();
  const planMap = new Map(plans.map((p) => [p.id, p]));
  const startCount =
    subsByPlan.find((s) => planMap.get(s.planId)?.code === "START")?._count._all ??
    0;
  const premiumCount =
    subsByPlan.find((s) => planMap.get(s.planId)?.code === "PREMIUM_ELITE")
      ?._count._all ?? 0;

  const revenue = paidPayments.reduce((s, p) => s + p.amountCents, 0);
  const currency = paidPayments[0]?.currency ?? "XOF";

  const activeSubs = startCount + premiumCount;
  const completionRate =
    activeSubs > 0 && totalLessons > 0
      ? Math.round((completedProgress / (activeSubs * totalLessons)) * 100)
      : 0;

  const topLessonDetails = await db.lesson.findMany({
    where: { id: { in: topLessons.map((t) => t.lessonId) } },
    include: { module: { include: { track: true } } },
  });
  const topWithCounts = topLessons
    .map((t) => ({
      lesson: topLessonDetails.find((l) => l.id === t.lessonId),
      views: t._sum.viewCount ?? 0,
    }))
    .filter((x) => x.lesson);

  return (
    <div className="container-page space-y-7 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink-900">
            لوحة الإدارة
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-500">
            نظرة شاملة على المنصّة والطلاب والمبيعات.
          </p>
        </div>
        {pendingPayments > 0 && (
          <LinkButton href="/admin/payments" variant="dark">
            <IconWallet />
            <span className="num">{pendingPayments}</span> عملية بانتظار التحقّق
          </LinkButton>
        )}
      </header>

      {/* ── الأرقام الأساسية ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="عدد الطلاب"
          value={studentCount}
          icon={<IconUsers />}
        />
        <StatCard
          label="الطلاب النشطون"
          value={activeCount}
          hint="خلال آخر ٧ أيام"
          tone="green"
          icon={<IconPlayCircle />}
        />
        <StatCard
          label="مشتركو START"
          value={startCount}
          tone="brand"
        />
        <StatCard
          label="مشتركو PREMIUM ELITE"
          value={premiumCount}
          tone="gold"
          icon={<IconSparkle />}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي المبيعات"
          value={formatPrice(revenue, currency)}
          hint={`${paidPayments.length} عملية مؤكّدة`}
          tone="green"
          icon={<IconWallet />}
        />
        <StatCard
          label="معدّل إكمال البرنامج"
          value={`${completionRate}%`}
          hint="متوسّط عبر المشتركين"
          tone="brand"
          icon={<IconChart />}
        />
        <StatCard
          label="متوسّط نتائج الاختبارات"
          value={`${Math.round(attemptsAgg._avg.score ?? 0)}%`}
          hint={`${attemptsAgg._count._all} محاولة`}
          icon={<IconAward />}
        />
        <StatCard
          label="الشهادات الممنوحة"
          value={certificates}
          tone="gold"
          icon={<IconAward />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ── أكثر الدروس مشاهدة ── */}
        <section className="card overflow-hidden">
          <h2 className="border-b border-cream-200 px-5 py-4 font-display text-[15px] font-black text-ink-900">
            أكثر الدروس مشاهدة
          </h2>
          {topWithCounts.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-500">
              لا توجد بيانات مشاهدة بعد.
            </p>
          ) : (
            <ol className="divide-y divide-cream-200">
              {topWithCounts.map(({ lesson, views }, i) => (
                <li key={lesson!.id} className="flex items-center gap-3 px-5 py-3">
                  <span className="num grid size-7 shrink-0 place-items-center rounded-lg bg-cream-100 text-[12px] font-black text-ink-500">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] font-bold text-ink-900">
                      {lesson!.title}
                    </span>
                    <span className="text-[11.5px] text-ink-500">
                      {lesson!.module.track.title} · {lesson!.module.title}
                    </span>
                  </span>
                  <Badge tone="brand">
                    <span className="num">{views}</span> مشاهدة
                  </Badge>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ── الطلاب المتوقّفون ── */}
        <section className="card overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-cream-200 px-5 py-4 font-display text-[15px] font-black text-ink-900">
            <IconClock className="text-amber-600" />
            طلاب توقّفوا عن التعلّم
          </h2>
          {stalled.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13px] text-ink-500">
              لا يوجد طالب متوقّف منذ أكثر من أسبوعين — ممتاز!
            </p>
          ) : (
            <ul className="divide-y divide-cream-200">
              {stalled.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/admin/students/${s.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-cream-50"
                  >
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-amber-50 text-[12px] font-black text-amber-700">
                      {s.name.charAt(0)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-bold text-ink-900">
                        {s.name}
                      </span>
                      <span dir="ltr" className="block text-right text-[11.5px] text-ink-500">
                        {s.email}
                      </span>
                    </span>
                    <Badge tone="amber">
                      <span className="num">
                        {s.lastSeenAt
                          ? Math.floor((now - s.lastSeenAt.getTime()) / DAY)
                          : "—"}
                      </span>{" "}
                      يومًا
                    </Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* ── آخر العمليات ── */}
      <section className="card overflow-hidden">
        <div className="flex items-center justify-between border-b border-cream-200 px-5 py-4">
          <h2 className="font-display text-[15px] font-black text-ink-900">
            آخر عمليات الدفع
          </h2>
          <Link
            href="/admin/payments"
            className="flex items-center gap-1 text-[12.5px] font-bold text-brand-700 hover:underline"
          >
            الكل
            <IconArrowNext />
          </Link>
        </div>
        {recentPayments.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13px] text-ink-500">
            لا توجد عمليات بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-cream-50 text-[12px] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">الطالب</th>
                  <th className="px-4 py-3 font-medium">الباقة</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {recentPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/60">
                    <td className="px-5 py-3 font-bold text-ink-900">
                      {p.user.name}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{p.plan.name}</td>
                    <td className="num px-4 py-3 text-ink-700">
                      {formatPrice(p.amountCents, p.currency)}
                    </td>
                    <td className="num px-4 py-3 text-ink-500">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-5 py-3">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── تقدّم عام ── */}
      <section className="card p-5">
        <h2 className="font-display text-[15px] font-black text-ink-900">
          نبض المنصّة
        </h2>
        <div className="mt-4 space-y-4">
          {[
            {
              label: "نسبة الطلاب النشطين",
              value: studentCount ? Math.round((activeCount / studentCount) * 100) : 0,
            },
            { label: "معدّل إكمال البرنامج", value: completionRate },
            {
              label: "متوسّط نتائج الاختبارات",
              value: Math.round(attemptsAgg._avg.score ?? 0),
            },
          ].map((row) => (
            <div key={row.label}>
              <div className="mb-1.5 flex items-center justify-between text-[13px]">
                <span className="text-ink-700">{row.label}</span>
                <span className="num font-black text-ink-900">{row.value}%</span>
              </div>
              <ProgressBar value={row.value} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
