import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/payments/service";
import { providerStatus } from "@/lib/payments";
import { PAYMENT_STATUS_LABELS, PROVIDER_LABELS } from "@/lib/constants";
import { approvePaymentAction, rejectPaymentAction } from "../actions";
import { ActionButton } from "@/components/admin/Form";
import { Badge, StatCard, EmptyState } from "@/components/ui";
import { formatDate } from "@/lib/format";
import {
  IconWallet,
  IconCheck,
  IconClose,
  IconDocument,
  IconShield,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "المدفوعات" };

const TABS = [
  { key: "review", label: "بانتظار التحقّق" },
  { key: "paid", label: "مؤكّدة" },
  { key: "pending", label: "غير مكتملة" },
  { key: "failed", label: "مرفوضة" },
  { key: "all", label: "الكل" },
];

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  await requireAdmin();
  const { tab = "review" } = await searchParams;

  const where =
    tab === "review"
      ? { status: "awaiting_review" }
      : tab === "paid"
        ? { status: "paid" }
        : tab === "pending"
          ? { status: "pending" }
          : tab === "failed"
            ? { status: { in: ["failed", "refunded"] } }
            : {};

  const [payments, counts, paidAll] = await Promise.all([
    db.payment.findMany({
      where,
      include: { user: true, plan: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.payment.groupBy({ by: ["status"], _count: { _all: true } }),
    db.payment.findMany({
      where: { status: "paid" },
      select: { amountCents: true, currency: true },
    }),
  ]);

  const countOf = (s: string) =>
    counts.find((c) => c.status === s)?._count._all ?? 0;
  const revenue = paidAll.reduce((s, p) => s + p.amountCents, 0);
  const currency = paidAll[0]?.currency ?? "XOF";

  return (
    <div className="container-page space-y-6 py-8">
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900">
          المدفوعات والاشتراكات
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-500">
          تأكيد عمليات الدفع اليدوية ومتابعة العمليات الآلية.
        </p>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="إجمالي المبيعات"
          value={formatPrice(revenue, currency)}
          tone="green"
          icon={<IconWallet />}
        />
        <StatCard label="عمليات مؤكّدة" value={countOf("paid")} />
        <StatCard
          label="بانتظار التحقّق"
          value={countOf("awaiting_review")}
          tone="gold"
        />
        <StatCard label="غير مكتملة" value={countOf("pending")} />
      </section>

      {/* ── حالة البوابات ── */}
      <section className="card p-5">
        <h2 className="flex items-center gap-2 font-display text-[15px] font-black text-ink-900">
          <IconShield className="text-brand-600" />
          بوابات الدفع
        </h2>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-500">
          تُفعَّل البوابات من متغيّر البيئة <code className="rounded bg-cream-100 px-1">PAYMENT_PROVIDERS</code>،
          وتُهيّأ بمفاتيحها في ملف <code className="rounded bg-cream-100 px-1">.env</code>.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {providerStatus().map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl bg-cream-50 px-4 py-3"
            >
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-bold text-ink-900">
                  {p.label}
                </span>
                <span className="block truncate text-[11.5px] text-ink-500">
                  {p.description}
                </span>
              </span>
              <Badge tone={p.enabled ? "green" : "slate"}>
                {p.enabled ? "مفعّلة" : "معطّلة"}
              </Badge>
              <Badge tone={p.configured ? "brand" : "amber"}>
                {p.configured ? "مهيّأة" : "بلا مفاتيح"}
              </Badge>
            </li>
          ))}
        </ul>
      </section>

      {/* ── التبويبات ── */}
      <nav className="flex flex-wrap gap-1.5">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={`/admin/payments?tab=${t.key}`}
            className={`rounded-xl px-3.5 py-2 text-[13px] font-bold transition-colors ${
              tab === t.key
                ? "bg-ink-900 text-white"
                : "bg-white text-ink-500 hover:bg-cream-100"
            }`}
          >
            {t.label}
            {t.key === "review" && countOf("awaiting_review") > 0 && (
              <span className="num mr-1.5 rounded-full bg-gold-400 px-1.5 py-0.5 text-[11px] text-ink-900">
                {countOf("awaiting_review")}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {payments.length === 0 ? (
        <EmptyState
          icon={<IconWallet />}
          title="لا توجد عمليات في هذه القائمة"
          description="ستظهر هنا فور قيام الطلاب بالدفع."
        />
      ) : (
        <ul className="space-y-3">
          {payments.map((p) => (
            <li key={p.id} className="card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-[15px] font-black text-ink-900">
                      {p.user.name}
                    </h3>
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
                    <Badge tone={p.plan.code === "PREMIUM_ELITE" ? "gold" : "brand"}>
                      {p.plan.name}
                    </Badge>
                  </div>
                  <p dir="ltr" className="mt-1 text-right text-[12px] text-ink-500">
                    {p.user.email}
                    {p.user.phone ? ` · ${p.user.phone}` : ""}
                  </p>
                  <p className="num mt-2 text-[12.5px] text-ink-500">
                    المرجع <strong className="text-ink-800">{p.reference}</strong> ·{" "}
                    {PROVIDER_LABELS[p.provider] ?? p.provider} ·{" "}
                    {formatDate(p.createdAt)}
                    {p.providerRef ? ` · مرجع البوابة ${p.providerRef}` : ""}
                  </p>
                  {p.payerNote && (
                    <p className="mt-2 rounded-xl bg-cream-50 px-3 py-2 text-[12.5px] leading-relaxed text-ink-700">
                      ملاحظة الطالب: {p.payerNote}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="num font-display text-xl font-black text-ink-900">
                    {formatPrice(p.amountCents, p.currency)}
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {p.receiptUrl && (
                      <a
                        href={p.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-cream-300 px-3 text-[13px] font-bold text-ink-700 hover:border-brand-300"
                      >
                        <IconDocument />
                        عرض الإيصال
                      </a>
                    )}
                    <Link
                      href={`/admin/students/${p.userId}`}
                      className="inline-flex h-9 items-center rounded-lg px-3 text-[13px] font-bold text-ink-500 hover:bg-cream-100"
                    >
                      ملف الطالب
                    </Link>
                    {p.status !== "paid" && (
                      <ActionButton
                        action={approvePaymentAction.bind(null, p.id)}
                        tone="brand"
                        confirm={`تأكيد دفع ${formatPrice(p.amountCents, p.currency)} وتفعيل باقة ${p.plan.name} للطالب ${p.user.name}؟`}
                      >
                        <IconCheck />
                        تأكيد وتفعيل
                      </ActionButton>
                    )}
                    {p.status !== "paid" && p.status !== "failed" && (
                      <ActionButton
                        action={rejectPaymentAction.bind(null, p.id, undefined)}
                        tone="danger"
                        confirm="رفض هذه العملية؟"
                      >
                        <IconClose />
                        رفض
                      </ActionButton>
                    )}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
