import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Badge, ProgressBar, EmptyState } from "@/components/ui";
import { IconUsers, IconArrowNext, IconSparkle } from "@/components/ui/icons";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الطلاب" };

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  await requireAdmin();
  const { q, filter } = await searchParams;

  const totalLessons = await db.lesson.count({ where: { isPublished: true } });

  const students = await db.user.findMany({
    where: {
      role: "student",
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
      ...(filter === "active"
        ? { subscriptions: { some: { status: "active" } } }
        : filter === "inactive"
          ? { subscriptions: { none: { status: "active" } } }
          : {}),
    },
    include: {
      subscriptions: { include: { plan: true } },
      _count: { select: { progress: true, attempts: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  // عدد الدروس المكتملة لكل طالب
  const completed = await db.lessonProgress.groupBy({
    by: ["userId"],
    where: { status: "completed" },
    _count: { _all: true },
  });
  const completedMap = new Map(completed.map((c) => [c.userId, c._count._all]));

  return (
    <div className="container-page space-y-6 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink-900">
            الطلاب
          </h1>
          <p className="num mt-1 text-[13.5px] text-ink-500">
            {students.length} طالبًا معروضًا
          </p>
        </div>

        <form className="flex flex-wrap gap-2">
          <input
            name="q"
            defaultValue={q}
            placeholder="ابحث بالاسم أو البريد…"
            className="h-10 w-56 rounded-xl border border-cream-300 bg-white px-3.5 text-[13.5px] outline-none focus:border-brand-500"
          />
          <select
            name="filter"
            defaultValue={filter ?? ""}
            className="h-10 rounded-xl border border-cream-300 bg-white px-3 text-[13.5px] outline-none focus:border-brand-500"
          >
            <option value="">كل الطلاب</option>
            <option value="active">مشتركون نشطون</option>
            <option value="inactive">بلا اشتراك</option>
          </select>
          <button
            type="submit"
            className="h-10 rounded-xl bg-ink-900 px-4 text-[13.5px] font-bold text-white hover:bg-ink-800"
          >
            بحث
          </button>
        </form>
      </header>

      {students.length === 0 ? (
        <EmptyState
          icon={<IconUsers />}
          title="لا يوجد طلاب مطابقون"
          description="جرّب تعديل معايير البحث."
        />
      ) : (
        <section className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-cream-50 text-[12px] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">الطالب</th>
                  <th className="px-4 py-3 font-medium">الباقة</th>
                  <th className="px-4 py-3 font-medium">التقدّم</th>
                  <th className="px-4 py-3 font-medium">الاختبارات</th>
                  <th className="px-4 py-3 font-medium">آخر ظهور</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {students.map((s) => {
                  const sub = s.subscriptions[0];
                  const done = completedMap.get(s.id) ?? 0;
                  const percent =
                    totalLessons > 0
                      ? Math.round((done / totalLessons) * 100)
                      : 0;
                  const isPremium = sub?.plan.code === "PREMIUM_ELITE";

                  return (
                    <tr key={s.id} className="hover:bg-cream-50/60">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-ink-900 text-[12px] font-black text-brand-300">
                            {s.name.charAt(0)}
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate font-bold text-ink-900">
                              {s.name}
                              {!s.isActive && (
                                <Badge tone="red" className="mr-2">
                                  موقوف
                                </Badge>
                              )}
                            </span>
                            <span
                              dir="ltr"
                              className="block text-right text-[11.5px] text-ink-500"
                            >
                              {s.email}
                            </span>
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {sub && sub.status === "active" ? (
                          <Badge tone={isPremium ? "gold" : "brand"}>
                            {isPremium && <IconSparkle className="text-[10px]" />}
                            {sub.plan.name}
                          </Badge>
                        ) : (
                          <Badge tone="slate">
                            {sub?.status === "pending" ? "بانتظار الدفع" : "—"}
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={percent} size="sm" className="w-20" />
                          <span className="num text-[12px] font-bold text-ink-700">
                            {percent}%
                          </span>
                        </div>
                        <span className="num text-[11px] text-ink-500">
                          {done}/{totalLessons} درسًا
                        </span>
                      </td>
                      <td className="num px-4 py-3 text-ink-700">
                        {s._count.attempts}
                      </td>
                      <td className="num px-4 py-3 text-ink-500">
                        {s.lastSeenAt
                          ? formatDate(s.lastSeenAt)
                          : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/students/${s.id}`}
                          className="inline-flex items-center gap-1 text-[12.5px] font-bold text-brand-700 hover:underline"
                        >
                          التفاصيل
                          <IconArrowNext />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
