import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurriculum } from "@/lib/curriculum";
import { getSettings } from "@/lib/settings";
import { formatPrice } from "@/lib/payments/service";
import {
  PAYMENT_STATUS_LABELS,
  PROVIDER_LABELS,
} from "@/lib/constants";
import {
  Badge,
  LinkButton,
  ProgressBar,
  StatCard,
  Alert,
} from "@/components/ui";
import {
  IconAward,
  IconSparkle,
  IconCheckCircle,
  IconWallet,
} from "@/components/ui/icons";
import { ProfileForm } from "./ProfileForm";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "حسابي" };

export default async function ProfilePage() {
  const user = await requireUser("/profile");
  const [curriculum, settings] = await Promise.all([
    getCurriculum(user),
    getSettings(),
  ]);

  const [subscription, payments, attempts, certificate] = await Promise.all([
    db.subscription.findFirst({
      where: { userId: user.id },
      include: { plan: true, course: true },
      orderBy: { createdAt: "desc" },
    }),
    db.payment.findMany({
      where: { userId: user.id },
      include: { plan: true },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.quizAttempt.findMany({
      where: { userId: user.id, submittedAt: { not: null } },
      include: { quiz: { include: { module: { include: { track: true } } } } },
      orderBy: { submittedAt: "desc" },
    }),
    db.certificate.findFirst({ where: { userId: user.id } }),
  ]);

  const isPremium = subscription?.plan.code === "PREMIUM_ELITE";
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
      : 0;

  return (
    <div className="container-page max-w-5xl space-y-6 py-8 sm:py-10">
      <header className="card overflow-hidden">
        <div className="brand-gradient brand-texture flex flex-wrap items-center gap-5 px-6 py-7 text-white">
          <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white/10 font-display text-2xl font-black text-brand-300 ring-1 ring-white/20">
            {user.name.trim().charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="font-display text-xl font-black sm:text-2xl">
              {user.name}
            </h1>
            <p dir="ltr" className="mt-0.5 text-right text-[13px] text-brand-50/75">
              {user.email}
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              {subscription ? (
                <Badge
                  tone={isPremium ? "gold" : "brand"}
                  className={isPremium ? "" : "bg-white/10 text-brand-100 ring-white/25"}
                >
                  {isPremium && <IconSparkle className="text-[10px]" />}
                  {subscription.plan.name}
                </Badge>
              ) : (
                <Badge tone="slate">بلا اشتراك</Badge>
              )}
              <Badge tone="brand" className="bg-white/10 text-brand-100 ring-white/25">
                عضو منذ{" "}
                <span className="num">
                  {formatDate(user.createdAt)}
                </span>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* ── الإحصائيات ── */}
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
        <StatCard label="اختبارات مُنجَزة" value={attempts.length} />
        <StatCard
          label="متوسّط النتائج"
          value={`${avgScore}%`}
          tone="gold"
          icon={<IconAward />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-start">
        {/* ── البيانات الشخصية ── */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            البيانات الشخصية
          </h2>
          <p className="mt-1 text-[13px] text-ink-500">
            حدّث معلوماتك أو غيّر كلمة المرور.
          </p>
          <div className="mt-5">
            <ProfileForm
              defaults={{
                name: user.name,
                email: user.email,
                phone: user.phone ?? "",
              }}
            />
          </div>
        </section>

        <div className="space-y-6">
          {/* ── الاشتراك ── */}
          <section className="card p-5 sm:p-6">
            <h2 className="font-display text-[16px] font-black text-ink-900">
              اشتراكي
            </h2>
            {subscription ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                  <span className="text-[13px] text-ink-500">البرنامج</span>
                  <span className="text-[13.5px] font-bold text-ink-900">
                    {subscription.course.title.slice(0, 34)}…
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                  <span className="text-[13px] text-ink-500">مستوى الاشتراك</span>
                  <Badge tone={isPremium ? "gold" : "brand"}>
                    {subscription.plan.name}
                  </Badge>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-cream-50 px-4 py-3">
                  <span className="text-[13px] text-ink-500">الحالة</span>
                  <Badge
                    tone={subscription.status === "active" ? "green" : "amber"}
                  >
                    {subscription.status === "active"
                      ? "نشِط"
                      : subscription.status === "pending"
                        ? "بانتظار الدفع"
                        : subscription.status === "expired"
                          ? "منتهٍ"
                          : "ملغى"}
                  </Badge>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[13px]">
                    <span className="text-ink-500">التقدّم</span>
                    <span className="num font-bold text-brand-700">
                      {curriculum?.percent ?? 0}%
                    </span>
                  </div>
                  <ProgressBar value={curriculum?.percent ?? 0} />
                </div>

                {!isPremium && subscription.status === "active" && (
                  <LinkButton
                    href="/checkout/PREMIUM_ELITE"
                    variant="gold"
                    size="sm"
                    className="w-full"
                  >
                    <IconSparkle />
                    الترقية إلى PREMIUM ELITE
                  </LinkButton>
                )}
              </div>
            ) : (
              <div className="mt-4">
                <Alert tone="info">
                  لم تشترك في أي برنامج بعد.
                  <div className="mt-3">
                    <LinkButton href="/#plans" size="sm">
                      عرض الباقات
                    </LinkButton>
                  </div>
                </Alert>
              </div>
            )}
          </section>

          {/* ── الشهادة ── */}
          {settings["certificate.enabled"] && (
            <section className="card p-5 sm:p-6">
              <h2 className="flex items-center gap-2 font-display text-[16px] font-black text-ink-900">
                <IconAward className="text-gold-500" />
                إثبات الإتمام
              </h2>
              {certificate ? (
                <div className="mt-3">
                  <p className="text-[13.5px] text-ink-700">
                    شهادتك جاهزة برقم{" "}
                    <span className="num font-bold">{certificate.serial}</span>
                  </p>
                  <LinkButton href="/certificate" variant="gold" size="sm" className="mt-3">
                    عرض الشهادة
                  </LinkButton>
                </div>
              ) : curriculum?.isComplete ? (
                <div className="mt-3">
                  <p className="text-[13.5px] text-ink-700">
                    أتممت البرنامج — يمكنك استخراج شهادتك الآن.
                  </p>
                  <LinkButton href="/certificate" variant="gold" size="sm" className="mt-3">
                    استخراج الشهادة
                  </LinkButton>
                </div>
              ) : (
                <p className="mt-3 text-[13.5px] leading-relaxed text-ink-500">
                  تُمنَح الشهادة بعد إتمام جميع الدروس واجتياز اختبارات الوحدات.
                  تبقّى لك{" "}
                  <span className="num font-bold text-ink-800">
                    {curriculum?.remainingLessons ?? 0}
                  </span>{" "}
                  درسًا.
                </p>
              )}
            </section>
          )}
        </div>
      </div>

      {/* ── نتائج الاختبارات ── */}
      <section className="card overflow-hidden">
        <h2 className="border-b border-cream-200 px-5 py-4 font-display text-[16px] font-black text-ink-900">
          سجلّ الاختبارات
        </h2>
        {attempts.length === 0 ? (
          <p className="px-5 py-8 text-center text-[13.5px] text-ink-500">
            لم تُنجز أي اختبار بعد.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-cream-50 text-[12px] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">الوحدة</th>
                  <th className="px-4 py-3 font-medium">المادة</th>
                  <th className="px-4 py-3 font-medium">المحاولة</th>
                  <th className="px-4 py-3 font-medium">التاريخ</th>
                  <th className="px-5 py-3 font-medium">النتيجة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-cream-50/60">
                    <td className="px-5 py-3 font-bold text-ink-900">
                      {a.quiz.module.title}
                    </td>
                    <td className="px-4 py-3 text-ink-500">
                      {a.quiz.module.track.title}
                    </td>
                    <td className="num px-4 py-3 text-ink-500">
                      {a.attemptNumber}
                    </td>
                    <td className="num px-4 py-3 text-ink-500">
                      {formatDate(a.submittedAt)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={a.passed ? "green" : "red"}>
                        {a.passed && <IconCheckCircle className="text-[11px]" />}
                        <span className="num">{a.score}</span>%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ── سجلّ المدفوعات ── */}
      {payments.length > 0 && (
        <section className="card overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-cream-200 px-5 py-4 font-display text-[16px] font-black text-ink-900">
            <IconWallet className="text-ink-500" />
            سجلّ المدفوعات
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-[13px]">
              <thead className="bg-cream-50 text-[12px] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-medium">المرجع</th>
                  <th className="px-4 py-3 font-medium">الباقة</th>
                  <th className="px-4 py-3 font-medium">الطريقة</th>
                  <th className="px-4 py-3 font-medium">المبلغ</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-200">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-cream-50/60">
                    <td className="num px-5 py-3 font-bold text-ink-900">
                      {p.reference}
                    </td>
                    <td className="px-4 py-3 text-ink-700">{p.plan.name}</td>
                    <td className="px-4 py-3 text-ink-500">
                      {PROVIDER_LABELS[p.provider] ?? p.provider}
                    </td>
                    <td className="num px-4 py-3 text-ink-700">
                      {formatPrice(p.amountCents, p.currency)}
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
        </section>
      )}
    </div>
  );
}
