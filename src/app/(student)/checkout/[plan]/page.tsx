import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getDefaultCourse } from "@/lib/curriculum";
import { getAccess } from "@/lib/access";
import { availableProviders } from "@/lib/payments";
import { formatPrice, planFeatures } from "@/lib/payments/service";
import { formatDate } from "@/lib/format";
import { nextPeriod } from "@/lib/subscription-period";
import { Badge, LinkButton, Alert } from "@/components/ui";
import {
  IconCheck,
  IconSparkle,
  IconCheckCircle,
  IconArrowPrev,
} from "@/components/ui/icons";
import { CheckoutClient } from "@/components/app/CheckoutClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إتمام الاشتراك" };

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ plan: string }>;
  searchParams: Promise<{ status?: string; ref?: string; code?: string }>;
}) {
  const [{ plan: planCode }, { status, ref, code }] = await Promise.all([
    params,
    searchParams,
  ]);

  // نحتفظ بكود الإحالة عبر صفحة الدخول حتى لا يضيع
  const user = await requireUser(
    `/checkout/${planCode}${code ? `?code=${encodeURIComponent(code)}` : ""}`,
  );
  const [plan, course] = await Promise.all([
    db.plan.findUnique({ where: { code: planCode.toUpperCase() } }),
    getDefaultCourse(),
  ]);

  if (!plan || !plan.isActive || !course) notFound();

  const access = await getAccess(user, course.id);
  const features = planFeatures(plan);
  const price = formatPrice(plan.priceCents, plan.currency);
  const providers = availableProviders();
  const isPremium = plan.code === "PREMIUM_ELITE";

  // تجديد الاشتراك الشهري: الطالب مشترك في نفس الباقة وما زال وصوله قائمًا
  const renewing =
    access.hasAccess &&
    !access.isAdmin &&
    access.planCode === plan.code &&
    plan.durationDays > 0;
  const renewedUntil = renewing
    ? nextPeriod({
        durationDays: plan.durationDays,
        planId: plan.id,
        current: { planId: plan.id, status: "active", expiresAt: access.expiresAt },
      }).expiresAt
    : null;

  /* ── عاد من بوابة الدفع ── */
  const returned = status === "success" || status === "cancelled";
  const payment = ref
    ? await db.payment.findUnique({ where: { reference: ref } })
    : null;

  /* ── مشترك بالفعل في نفس الباقة أو أعلى ── */
  if (access.hasAccess && access.planCode === plan.code && plan.durationDays === 0) {
    return (
      <div className="container-page max-w-xl py-16">
        <div className="card p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
            <IconCheckCircle />
          </span>
          <h1 className="mt-4 font-display text-xl font-black text-ink-900">
            أنت مشترك بالفعل في باقة {plan.name}
          </h1>
          <p className="mt-2 text-[14px] text-ink-500">
            يمكنك متابعة البرنامج مباشرة من لوحتك.
          </p>
          <LinkButton href="/dashboard" className="mt-6">
            الذهاب إلى لوحتي
          </LinkButton>
        </div>
      </div>
    );
  }

  return (
    <div className="container-page max-w-5xl py-8 sm:py-10">
      <Link
        href="/#plans"
        className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-700"
      >
        <IconArrowPrev />
        العودة إلى الباقات
      </Link>

      <h1 className="mt-4 font-display text-2xl font-black text-ink-900">
        إتمام الاشتراك
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-500">
        {renewing
          ? "جدّد اشتراكك قبل انتهائه — تُضاف المدّة الجديدة إلى نهاية شهرك الحالي."
          : "خطوة أخيرة — بعد تأكيد الدفع يُفتح البرنامج كاملًا في حسابك."}
      </p>

      {renewing && access.expiresAt && renewedUntil && (
        <div className="mt-5">
          <Alert tone="info" title="تجديد الاشتراك الشهري">
            اشتراكك الحالي فعّال حتى <strong>{formatDate(access.expiresAt)}</strong>.
            بعد الدفع يمتدّ حتى <strong>{formatDate(renewedUntil)}</strong> دون أن
            تخسر أي يوم.
          </Alert>
        </div>
      )}

      {returned && (
        <div className="mt-5">
          {status === "success" ? (
            payment?.status === "paid" ? (
              <Alert tone="success" title="تمّ تأكيد الدفع">
                فُعِّل اشتراكك بنجاح.
                <div className="mt-3">
                  <LinkButton href="/dashboard" size="sm">
                    ابدأ الدرس الأول
                  </LinkButton>
                </div>
              </Alert>
            ) : (
              <Alert tone="info" title="بانتظار تأكيد البوابة">
                استلمنا عودتك من بوابة الدفع، ولم يصل إشعار التأكيد بعد. عادةً لا
                يستغرق الأمر أكثر من دقائق — ستجد البرنامج مفتوحًا في لوحتك فور
                وصول التأكيد.
              </Alert>
            )
          ) : (
            <Alert tone="warning" title="أُلغيت عملية الدفع">
              لم يُخصم أي مبلغ. يمكنك المحاولة من جديد أدناه.
            </Alert>
          )}
        </div>
      )}

      <div className="mt-7 grid gap-6 lg:grid-cols-[1fr_.85fr] lg:items-start">
        {/* ── نموذج الدفع ── */}
        <div className="order-2 lg:order-1">
          <CheckoutClient
            planCode={plan.code}
            planName={plan.name}
            price={price}
            providers={providers}
            initialCode={code}
          />
        </div>

        {/* ── ملخّص الطلب ── */}
        <aside className="order-1 lg:order-2">
          <div
            className={`card overflow-hidden ${
              isPremium ? "border-gold-400" : ""
            }`}
          >
            <div className="border-b border-cream-200 px-5 py-5">
              <div className="flex items-center justify-between gap-3">
                <h2
                  className={`font-display text-xl font-black ${
                    isPremium ? "text-gold-600" : "text-ink-900"
                  }`}
                >
                  {plan.name}
                </h2>
                {plan.badge && <Badge tone="gold">{plan.badge}</Badge>}
              </div>
              {plan.tagline && (
                <p className="mt-1 text-[13px] text-ink-500">{plan.tagline}</p>
              )}

              <div className="mt-4 flex items-end gap-2">
                <span className="num font-display text-3xl font-black text-ink-900">
                  {price}
                </span>
                {plan.comparePriceCents && (
                  <span className="num mb-1 text-[13px] text-ink-300 line-through">
                    {formatPrice(plan.comparePriceCents, plan.currency)}
                  </span>
                )}
              </div>
              <p className="mt-1 text-[12px] text-ink-500">
                {plan.durationDays > 0
                  ? "اشتراك شهري (" + plan.durationDays + " يومًا)"
                  : "دفعة واحدة"}{" "}
                · {course.title}
              </p>
            </div>

            <ul className="space-y-2.5 bg-cream-50/60 px-5 py-5">
              {features
                .filter((f) => f.included)
                .map((f) => (
                  <li
                    key={f.label}
                    className="flex items-start gap-2.5 text-[13px] leading-relaxed text-ink-800"
                  >
                    {isPremium ? (
                      <IconSparkle className="mt-1 shrink-0 text-gold-500" />
                    ) : (
                      <IconCheck className="mt-1 shrink-0 text-brand-600" />
                    )}
                    {f.label}
                  </li>
                ))}
            </ul>

            <div className="border-t border-cream-200 px-5 py-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-ink-500">الحساب</span>
                <span className="font-bold text-ink-900">{user.name}</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[13px]">
                <span className="text-ink-500">البريد</span>
                <span dir="ltr" className="text-ink-700">
                  {user.email}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
