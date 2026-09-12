import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { Badge, EmptyState, StatCard } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  IconEdit,
  IconArrowNext,
  IconCheckCircle,
  IconSparkle,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "تصحيح الأعمال" };

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab = "pending" } = await searchParams;

  const [pending, done, pendingCount, doneCount] = await Promise.all([
    db.quizAttempt.findMany({
      where: { needsReview: true, submittedAt: { not: null } },
      include: {
        user: { include: { subscriptions: { include: { plan: true } } } },
        quiz: { include: { module: { include: { track: true } } } },
      },
      orderBy: { submittedAt: "asc" },
      take: 60,
    }),
    db.quizAttempt.findMany({
      where: { needsReview: false, reviewNote: { not: null } },
      include: {
        user: { include: { subscriptions: { include: { plan: true } } } },
        quiz: { include: { module: { include: { track: true } } } },
      },
      orderBy: { submittedAt: "desc" },
      take: 30,
    }),
    db.quizAttempt.count({ where: { needsReview: true } }),
    db.quizAttempt.count({ where: { reviewNote: { not: null } } }),
  ]);

  const rows = tab === "done" ? done : pending;

  return (
    <div className="container-page space-y-6 py-8">
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900">
          تصحيح أعمال الطلاب
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
          الأسئلة التطبيقية لا تُصحَّح آليًا. صحّحها هنا وأضف ملاحظاتك — تُحدَّث
          نتيجة الطالب فورًا، وقد تُفتح له الوحدة التالية.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="بانتظار التصحيح"
          value={pendingCount}
          tone="gold"
          icon={<IconEdit />}
        />
        <StatCard
          label="أعمال مصحَّحة"
          value={doneCount}
          tone="green"
          icon={<IconCheckCircle />}
        />
        <StatCard
          label="خدمة PREMIUM ELITE"
          value="مفعّلة"
          icon={<IconSparkle />}
        />
      </section>

      <nav className="flex gap-1.5">
        {[
          { key: "pending", label: `بانتظار التصحيح (${pendingCount})` },
          { key: "done", label: "مصحَّحة" },
        ].map((t) => (
          <Link
            key={t.key}
            href={`/admin/reviews?tab=${t.key}`}
            className={`rounded-xl px-3.5 py-2 text-[13px] font-bold transition-colors ${
              tab === t.key
                ? "bg-ink-900 text-white"
                : "bg-white text-ink-500 hover:bg-cream-100"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </nav>

      {rows.length === 0 ? (
        <EmptyState
          icon={<IconCheckCircle />}
          title={
            tab === "done"
              ? "لا توجد أعمال مصحَّحة بعد"
              : "لا يوجد عمل بانتظار التصحيح"
          }
          description={
            tab === "done"
              ? "ستظهر هنا الأعمال بعد أن تصحّحها."
              : "كل الأسئلة التطبيقية مصحَّحة — عمل ممتاز."
          }
        />
      ) : (
        <ul className="space-y-3">
          {rows.map((a) => {
            const plan = a.user.subscriptions[0]?.plan;
            return (
              <li key={a.id}>
                <Link
                  href={`/admin/reviews/${a.id}`}
                  className="card flex flex-wrap items-center gap-4 p-5 transition-colors hover:border-brand-300"
                >
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-ink-900 text-[14px] font-black text-brand-300">
                    {a.user.name.charAt(0)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-[15px] font-bold text-ink-900">
                      {a.user.name}
                      {plan?.code === "PREMIUM_ELITE" && (
                        <Badge tone="gold" className="mr-2">
                          <IconSparkle className="text-[10px]" />
                          PREMIUM
                        </Badge>
                      )}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] text-ink-500">
                      {a.quiz.module.title}
                    </span>
                    <span className="num mt-0.5 block text-[11.5px] text-ink-300">
                      المحاولة {a.attemptNumber} ·{" "}
                      {formatDate(a.submittedAt)}
                    </span>
                  </span>
                  <Badge tone={a.needsReview ? "amber" : a.passed ? "green" : "red"}>
                    {a.needsReview ? (
                      "بانتظار التصحيح"
                    ) : (
                      <>
                        <span className="num">{a.score}</span>%
                      </>
                    )}
                  </Badge>
                  <IconArrowNext className="shrink-0 text-ink-300" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
