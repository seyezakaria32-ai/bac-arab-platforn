import type { Metadata } from "next";
import Link from "next/link";
import { db, parseJson } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { formatPrice } from "@/lib/payments/service";
import { couponLabel } from "@/lib/coupons";
import {
  saveCouponAction,
  toggleCouponAction,
  deleteCouponAction,
} from "../actions";
import {
  AdminForm,
  Field,
  Toggle,
  SubmitButton,
  ActionButton,
} from "@/components/admin/Form";
import { Badge, StatCard, EmptyState } from "@/components/ui";
import { requestOrigin } from "@/lib/site-url";
import {
  IconArrowPrev,
  IconPlus,
  IconTrash,
  IconUsers,
  IconWallet,
  IconSparkle,
  IconEdit,
} from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "أكواد الخصم" };

type CouponRow = Awaited<ReturnType<typeof db.coupon.findMany>>[number];
type PlanOption = { code: string; name: string };

/** نموذج إنشاء/تعديل كود — نفس الحقول في الحالتين */
function CouponForm({
  coupon,
  plans,
}: {
  coupon?: CouponRow;
  plans: PlanOption[];
}) {
  const selectedPlans = coupon ? parseJson<string[]>(coupon.planCodes, []) : [];
  const isFixed = coupon?.kind === "fixed";

  return (
    <AdminForm action={saveCouponAction}>
      {coupon && <input type="hidden" name="id" value={coupon.id} />}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="الكود"
          name="code"
          dir="ltr"
          required
          defaultValue={coupon?.code}
          placeholder="PROF10"
          hint="حروف لاتينية وأرقام، بلا مسافات — يكتبه الطالب عند الدفع."
        />
        <Field
          label="صاحب الكود (للإحالة)"
          name="owner"
          defaultValue={coupon?.owner ?? ""}
          placeholder="مثال: الأستاذ فلان، ثانوية كذا"
          hint="لتعرف من جلب لك المشتركين وكم ربحت عبره."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
            نوع الخصم
          </span>
          <select
            name="kind"
            defaultValue={coupon?.kind ?? "percent"}
            className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          >
            <option value="percent">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (فرنك)</option>
          </select>
        </label>
        <Field
          label="قيمة الخصم"
          name="value"
          type="number"
          min={1}
          required
          defaultValue={
            coupon ? (isFixed ? Math.round(coupon.value / 100) : coupon.value) : 20
          }
          hint="20 = خصم 20% — أو 2000 = خصم 2,000 فرنك. 100% = اشتراك مجاني."
        />
      </div>

      <div>
        <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
          الباقات المشمولة
        </span>
        <div className="flex flex-wrap gap-2">
          {plans.map((p) => (
            <label
              key={p.code}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cream-300 bg-white px-3 py-2 text-[13px] font-bold text-ink-700 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50"
            >
              <input
                type="checkbox"
                name="planCodes"
                value={p.code}
                defaultChecked={selectedPlans.includes(p.code)}
                className="accent-brand-600"
              />
              {p.name}
            </label>
          ))}
        </div>
        <p className="mt-1 text-[11.5px] text-ink-500">
          اترك الكل دون تحديد ليعمل الكود على جميع الباقات.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="الحدّ الأقصى للاستعمال"
          name="maxUses"
          type="number"
          min={0}
          defaultValue={coupon?.maxUses ?? 0}
          hint="0 = بلا حدّ. يُحتسب الاستعمال عند تأكيد الدفع فقط."
        />
        <Field
          label="تاريخ الانتهاء (اختياري)"
          name="expiresAt"
          type="date"
          dir="ltr"
          defaultValue={coupon?.expiresAt?.toISOString().slice(0, 10) ?? ""}
        />
      </div>

      <Field
        label="ملاحظة داخلية (اختياري)"
        name="description"
        defaultValue={coupon?.description ?? ""}
        placeholder="مثال: عرض الدخول المدرسي"
      />

      <Toggle
        label="مفعّل"
        name="isActive"
        defaultChecked={coupon?.isActive ?? true}
      />

      <SubmitButton variant={coupon ? undefined : "brand"}>
        {coupon ? (
          "حفظ التعديلات"
        ) : (
          <>
            <IconPlus />
            إنشاء الكود
          </>
        )}
      </SubmitButton>
    </AdminForm>
  );
}

export default async function AdminCouponsPage() {
  await requireAdmin();

  const [coupons, plans, stats] = await Promise.all([
    db.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    db.plan.findMany({ orderBy: { order: "asc" }, select: { code: true, name: true } }),
    db.payment.groupBy({
      by: ["couponId"],
      where: { status: "paid", couponId: { not: null } },
      _count: { _all: true },
      _sum: { amountCents: true, discountCents: true },
    }),
  ]);

  const byCoupon = new Map(stats.map((s) => [s.couponId, s]));
  const totalRevenue = stats.reduce((n, s) => n + (s._sum.amountCents ?? 0), 0);
  const totalDiscount = stats.reduce((n, s) => n + (s._sum.discountCents ?? 0), 0);
  const totalUses = stats.reduce((n, s) => n + s._count._all, 0);
  const site = await requestOrigin();

  return (
    <div className="container-page max-w-5xl space-y-6 py-8">
      <div>
        <Link
          href="/admin/plans"
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-700"
        >
          <IconArrowPrev />
          الباقات والأسعار
        </Link>
        <h1 className="mt-3 font-display text-2xl font-black text-ink-900">
          أكواد الخصم والإحالة
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
          أعطِ كل أستاذ أو مؤثّر أو مدرسة كودًا خاصًا: يحصل الطالب على خصم، وتعرف
          أنت بدقّة كم مشتركًا وكم ربحًا جاء عبر كل كود.
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="اشتراكات عبر الأكواد"
          value={totalUses}
          icon={<IconUsers />}
        />
        <StatCard
          label="مبيعات عبر الأكواد"
          value={formatPrice(totalRevenue)}
          tone="green"
          icon={<IconWallet />}
        />
        <StatCard
          label="إجمالي الخصومات الممنوحة"
          value={formatPrice(totalDiscount)}
          tone="gold"
          icon={<IconSparkle />}
        />
      </section>

      {/* ── كود جديد ── */}
      <details className="card overflow-hidden" open={coupons.length === 0}>
        <summary className="flex cursor-pointer items-center gap-2 px-5 py-4 font-display text-[15px] font-bold text-brand-700 hover:bg-cream-50">
          <IconPlus />
          إنشاء كود جديد
        </summary>
        <div className="border-t border-cream-200 bg-cream-50/60 p-5">
          <CouponForm plans={plans} />
        </div>
      </details>

      {/* ── القائمة ── */}
      {coupons.length === 0 ? (
        <EmptyState
          icon={<IconSparkle />}
          title="لا توجد أكواد بعد"
          description="أنشئ أول كود من الأعلى — مثلًا PROF10 لأستاذ يروّج للبرنامج."
        />
      ) : (
        <ul className="space-y-3">
          {coupons.map((c) => {
            const s = byCoupon.get(c.id);
            const allowed = parseJson<string[]>(c.planCodes, []);
            const linkPlan = (allowed[0] ?? "START").toLowerCase();
            const expired = c.expiresAt ? c.expiresAt < new Date() : false;
            const exhausted = c.maxUses > 0 && c.usedCount >= c.maxUses;
            const status = !c.isActive
              ? { tone: "slate" as const, text: "موقوف" }
              : expired
                ? { tone: "red" as const, text: "منتهي" }
                : exhausted
                  ? { tone: "amber" as const, text: "مستنفد" }
                  : { tone: "green" as const, text: "فعّال" };

            return (
              <li key={c.id} className="card overflow-hidden">
                <div className="flex flex-wrap items-center gap-4 p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        dir="ltr"
                        className="rounded-lg bg-ink-900 px-2.5 py-1 font-mono text-[14px] font-bold tracking-wider text-brand-300"
                      >
                        {c.code}
                      </span>
                      <Badge tone="brand">{couponLabel(c)}</Badge>
                      <Badge tone={status.tone}>{status.text}</Badge>
                    </div>
                    <p className="mt-2 text-[13px] text-ink-500">
                      {c.owner ? (
                        <>
                          صاحبه: <strong className="text-ink-800">{c.owner}</strong>
                        </>
                      ) : (
                        "بلا صاحب محدّد"
                      )}
                      {" · "}
                      {allowed.length ? allowed.join("، ") : "كل الباقات"}
                      {c.expiresAt && (
                        <>
                          {" · ينتهي "}
                          <span className="num">
                            {c.expiresAt.toISOString().slice(0, 10)}
                          </span>
                        </>
                      )}
                    </p>
                    <p className="mt-1.5 text-[12px] text-ink-500">
                      رابط الإحالة:{" "}
                      <code
                        dir="ltr"
                        className="rounded bg-cream-100 px-1.5 py-0.5 text-[11.5px] text-ink-700 select-all"
                      >
                        {site}/checkout/{linkPlan}?code={c.code}
                      </code>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-center">
                    <div>
                      <p className="num font-display text-xl font-black text-ink-900">
                        {c.usedCount}
                        {c.maxUses > 0 && (
                          <span className="text-[13px] text-ink-300">/{c.maxUses}</span>
                        )}
                      </p>
                      <p className="text-[11.5px] text-ink-500">استعمال</p>
                    </div>
                    <div>
                      <p className="num font-display text-xl font-black text-emerald-700">
                        {formatPrice(s?._sum.amountCents ?? 0)}
                      </p>
                      <p className="text-[11.5px] text-ink-500">مبيعات</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <ActionButton
                      action={toggleCouponAction.bind(null, c.id)}
                      tone="outline"
                    >
                      {c.isActive ? "إيقاف" : "تفعيل"}
                    </ActionButton>
                    <ActionButton
                      action={deleteCouponAction.bind(null, c.id)}
                      tone="danger"
                      title="حذف"
                      confirm={`حذف الكود ${c.code}؟ عمليات الدفع السابقة تبقى محفوظة، لكن يُفضَّل «إيقاف» الكود بدل حذفه للاحتفاظ بإحصائياته.`}
                    >
                      <IconTrash />
                    </ActionButton>
                  </div>
                </div>

                <details className="border-t border-cream-200">
                  <summary className="flex cursor-pointer items-center gap-1.5 px-5 py-2.5 text-[12.5px] font-bold text-ink-500 hover:bg-cream-50 hover:text-brand-700">
                    <IconEdit />
                    تعديل
                  </summary>
                  <div className="bg-cream-50/60 p-5">
                    <CouponForm coupon={c} plans={plans} />
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
