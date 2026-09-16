import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getCurriculum, type ModuleNode } from "@/lib/curriculum";
import { getSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/format";
import { daysLeft } from "@/lib/subscription-period";
import {
  Badge,
  LinkButton,
  ProgressBar,
  ProgressRing,
  StatCard,
  Alert,
  EmptyState,
} from "@/components/ui";
import {
  IconCheckCircle,
  IconPlayCircle,
  IconCircle,
  IconLock,
  IconArrowNext,
  IconAward,
  IconTarget,
  IconClock,
  IconSparkle,
  IconShield,
} from "@/components/ui/icons";

export const metadata: Metadata = { title: "لوحتي" };
export const dynamic = "force-dynamic";

/* ─────────────── أيقونة حالة الوحدة كما في مواصفات البرنامج ─────────────── */
function ModuleStateIcon({ module }: { module: ModuleNode }) {
  if (module.cleared)
    return <IconCheckCircle className="text-lg text-emerald-600" />;
  if (module.accessible && module.completedLessons > 0)
    return <IconPlayCircle className="text-lg text-brand-600" />;
  if (module.accessible) return <IconCircle className="text-lg text-ink-300" />;
  return <IconLock className="text-base text-ink-300" />;
}

export default async function DashboardPage() {
  const user = await requireUser();
  const [curriculum, settings] = await Promise.all([
    getCurriculum(user),
    getSettings(),
  ]);

  if (!curriculum) {
    return (
      <div className="container-page py-16">
        <EmptyState
          title="لا يوجد برنامج منشور بعد"
          description="تواصل مع الإدارة لتفعيل المحتوى."
        />
      </div>
    );
  }

  const { access } = curriculum;

  /* ═════════ الحالة الأولى: لا اشتراك نشِط ═════════ */
  if (!access.hasAccess) {
    const expired = access.status === "expired";
    const pending = await db.payment.findFirst({
      where: { userId: user.id, status: { in: ["pending", "awaiting_review"] } },
      orderBy: { createdAt: "desc" },
      include: { plan: true },
    });

    return (
      <div className="container-page max-w-3xl py-12">
        <div className="card overflow-hidden">
          <div className="brand-gradient brand-texture px-6 py-10 text-center text-white sm:px-10">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-white/10 text-2xl ring-1 ring-white/20">
              <IconLock />
            </span>
            <h1 className="mt-4 font-display text-2xl font-black">
              مرحبًا {user.name.split(" ")[0]} 👋
            </h1>
            <p className="mx-auto mt-2 max-w-md leading-relaxed text-brand-50/85">
              {expired
                ? "انتهى وصولك لموسم البكالوريا السابق. اشترك للموسم الجديد لتتابع من حيث توقّفت — تقدّمك ونتائج اختباراتك محفوظة."
                : "حسابك جاهز، لكن محتوى البرنامج لم يُفعَّل بعد. اختر باقتك وأتمّ عملية الدفع ليُفتح لك البرنامج كاملًا."}
            </p>
          </div>

          <div className="space-y-4 p-6 sm:p-8">
            {pending && (
              <Alert tone="warning" title="لديك عملية دفع قيد المعالجة">
                عملية بالمرجع{" "}
                <span className="num font-bold">{pending.reference}</span> لباقة{" "}
                <strong>{pending.plan.name}</strong>{" "}
                {pending.status === "awaiting_review"
                  ? "قيد التحقّق من الإدارة — سيُفعَّل حسابك قريبًا."
                  : "لم تكتمل بعد."}
                <div className="mt-3">
                  <LinkButton
                    href={`/checkout/${pending.plan.code}`}
                    size="sm"
                    variant="outline"
                  >
                    متابعة عملية الدفع
                  </LinkButton>
                </div>
              </Alert>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard label="الوحدات" value={6} hint="٣ في كل مادة" />
              <StatCard label="الدروس" value={curriculum.totalLessons} />
              <StatCard label="الوصول" value="موسم كامل" hint="دفعة واحدة" />
            </div>

            <LinkButton
              href={expired && access.planCode ? "/checkout/" + access.planCode : "/#plans"}
              size="lg"
              className="w-full"
            >
              {expired ? "اشترك للموسم الجديد" : "اختر باقتك وابدأ البرنامج"}
              <IconArrowNext className="text-lg" />
            </LinkButton>

            <p className="flex items-center justify-center gap-2 text-center text-[12.5px] text-ink-500">
              <IconShield className="text-brand-600" />
              لا يُفتح المحتوى قبل تأكيد الدفع.
            </p>
          </div>
        </div>
      </div>
    );
  }

  /* ═════════ الحالة الثانية: اشتراك نشِط ═════════ */

  const current = curriculum.currentLesson;
  const pendingQuiz = curriculum.pendingQuiz;
  const isPremium = access.planCode === "PREMIUM_ELITE";
  const remaining = access.isAdmin ? null : daysLeft(access.expiresAt);

  const attempts = await db.quizAttempt.findMany({
    where: { userId: user.id, submittedAt: { not: null } },
    orderBy: { submittedAt: "desc" },
    take: 4,
    include: { quiz: { include: { module: true } } },
  });

  return (
    <div className="container-page space-y-8 py-8 sm:py-10">
      {remaining !== null && remaining <= 5 && (
        <Alert
          tone="warning"
          title={
            remaining === 0
              ? "ينتهي وصولك اليوم"
              : "ينتهي وصولك خلال " + remaining + (remaining === 1 ? " يوم" : " أيام")
          }
        >
          ينتهي وصولك مع نهاية موسم البكالوريا. استثمر ما تبقّى في مراجعة
          الوحدات التي تحتاجها — بالتوفيق في امتحانك.
        </Alert>
      )}

      {/* ── ترويسة الطالب ── */}
      <section className="card overflow-hidden">
        <div className="brand-gradient brand-texture px-5 py-6 text-white sm:px-8 sm:py-7">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/10 font-display text-xl font-black text-brand-300 ring-1 ring-white/20">
                {user.name.trim().charAt(0)}
              </span>
              <div>
                <p className="text-[13px] text-brand-100/75">مرحبًا بعودتك</p>
                <h1 className="font-display text-xl font-black sm:text-2xl">
                  {user.name}
                </h1>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-[12.5px] text-brand-50/70">
                  {curriculum.course.title}
                  <Badge
                    tone={isPremium ? "gold" : "brand"}
                    className={
                      isPremium
                        ? ""
                        : "bg-white/10 text-brand-100 ring-white/25"
                    }
                  >
                    {isPremium && <IconSparkle className="text-[10px]" />}
                    {isPremium ? "PREMIUM ELITE" : "START"}
                  </Badge>
                </p>
                {remaining !== null && access.expiresAt && (
                  <p className="mt-1 text-[12px] text-brand-100/75">
                    وصولك فعّال حتى {formatDate(access.expiresAt)} ·{" "}
                    <span className="num">{remaining}</span> يومًا متبقّيًا
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-5">
              <div className="text-left">
                <p className="text-[12px] text-brand-100/75">التقدّم في البرنامج</p>
                <p className="num font-display text-3xl font-black">
                  {curriculum.percent}%
                </p>
              </div>
              <div className="rounded-2xl bg-white/10 p-2 ring-1 ring-white/15">
                <ProgressRing value={curriculum.percent} size={78} stroke={8} />
              </div>
            </div>
          </div>

          <ProgressBar
            value={curriculum.percent}
            className="mt-6 [&>div]:bg-white/15"
          />
        </div>

        {/* شريط المتابعة */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8">
          {curriculum.isComplete ? (
            <>
              <div className="flex items-center gap-3">
                <IconAward className="text-2xl text-gold-500" />
                <div>
                  <p className="font-display text-[15px] font-bold text-ink-900">
                    أتممت البرنامج كاملًا 🎉
                  </p>
                  <p className="text-[13px] text-ink-500">
                    مبروك! يمكنك الآن استخراج إثبات الإتمام.
                  </p>
                </div>
              </div>
              {settings["certificate.enabled"] && (
                <LinkButton href="/certificate" variant="gold">
                  استخراج الشهادة
                </LinkButton>
              )}
            </>
          ) : pendingQuiz ? (
            <>
              <div className="flex items-center gap-3">
                <IconTarget className="text-2xl text-brand-600" />
                <div>
                  <p className="font-display text-[15px] font-bold text-ink-900">
                    اختبار الوحدة في انتظارك
                  </p>
                  <p className="text-[13px] text-ink-500">
                    {pendingQuiz.moduleTitle} · النجاح من{" "}
                    <span className="num">{pendingQuiz.passScore}</span>%
                  </p>
                </div>
              </div>
              <LinkButton href={`/quiz/${pendingQuiz.moduleId}`}>
                ابدأ الاختبار
                <IconArrowNext className="text-lg" />
              </LinkButton>
            </>
          ) : current ? (
            <>
              <div className="flex min-w-0 items-center gap-3">
                <IconPlayCircle className="shrink-0 text-2xl text-brand-600" />
                <div className="min-w-0">
                  <p className="text-[12.5px] text-ink-500">
                    {curriculum.completedLessons === 0
                      ? "ابدأ من هنا"
                      : "آخر درس وصلت إليه"}
                  </p>
                  <p className="truncate font-display text-[15px] font-bold text-ink-900">
                    {current.title}
                  </p>
                </div>
              </div>
              <LinkButton href={`/learn/${current.id}`} size="md">
                {curriculum.completedLessons === 0
                  ? "ابدأ الدرس الأول"
                  : "متابعة التعلّم"}
                <IconArrowNext className="text-lg" />
              </LinkButton>
            </>
          ) : (
            <p className="text-[14px] text-ink-500">لا يوجد درس متاح حاليًا.</p>
          )}
        </div>
      </section>

      {/* ── الإحصائيات ── */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="الدروس المكتملة"
          value={curriculum.completedLessons}
          hint={`من أصل ${curriculum.totalLessons}`}
          tone="green"
          icon={<IconCheckCircle />}
        />
        <StatCard
          label="الدروس المتبقّية"
          value={curriculum.remainingLessons}
          icon={<IconClock />}
        />
        <StatCard
          label="الوحدات المكتملة"
          value={
            curriculum.tracks.flatMap((t) => t.modules).filter((m) => m.cleared)
              .length
          }
          hint="من أصل ٦ وحدات"
          tone="brand"
          icon={<IconTarget />}
        />
        <StatCard
          label="اختبارات مجتازة"
          value={
            curriculum.tracks
              .flatMap((t) => t.modules)
              .filter((m) => m.quiz?.passed).length
          }
          tone="gold"
          icon={<IconAward />}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr] lg:items-start">
        {/* ── شجرة المنهج ── */}
        <section className="space-y-6">
          <h2 className="font-display text-lg font-black text-ink-900">
            مسارك في البرنامج
          </h2>

          {curriculum.tracks.map((track) => (
            <div key={track.id} className="card overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-cream-200 px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span
                    className="size-3 rounded-full"
                    style={{ background: track.color ?? "#00B7B5" }}
                  />
                  <h3 className="font-display text-[16px] font-black text-ink-900">
                    {track.title}
                  </h3>
                </div>
                <span className="num text-[12.5px] font-bold text-ink-500">
                  {track.completedLessons}/{track.totalLessons}
                </span>
              </div>

              <ul className="divide-y divide-cream-200">
                {track.modules.map((mod, i) => {
                  const href = mod.accessible
                    ? mod.lessonsDone && mod.quiz && !mod.quiz.passed
                      ? `/quiz/${mod.id}`
                      : `/learn/${
                          mod.lessons.find((l) => l.state !== "completed")?.id ??
                          mod.lessons[0]?.id
                        }`
                    : null;

                  const inner = (
                    <>
                      <ModuleStateIcon module={mod} />
                      <span className="min-w-0 flex-1">
                        <span
                          className={`block text-[14px] leading-snug font-bold ${
                            mod.accessible ? "text-ink-900" : "text-ink-300"
                          }`}
                        >
                          {mod.title}
                        </span>
                        <span className="mt-1.5 flex items-center gap-2">
                          <ProgressBar
                            value={mod.percent}
                            size="sm"
                            className="w-24"
                            tone={mod.cleared ? "brand" : "dark"}
                          />
                          <span className="num text-[11.5px] text-ink-500">
                            {mod.completedLessons}/{mod.totalLessons} درسًا
                          </span>
                          {mod.quiz?.passed && (
                            <Badge tone="green">
                              الاختبار <span className="num">{mod.quiz.bestScore}</span>%
                            </Badge>
                          )}
                          {mod.lessonsDone && mod.quiz && !mod.quiz.passed && (
                            <Badge tone="amber">الاختبار مطلوب</Badge>
                          )}
                          {mod.requiredPlan === "premium" && !isPremium && (
                            <Badge tone="gold">PREMIUM</Badge>
                          )}
                        </span>
                      </span>
                      {mod.accessible && (
                        <IconArrowNext className="shrink-0 text-ink-300" />
                      )}
                    </>
                  );

                  return (
                    <li key={mod.id}>
                      {href ? (
                        <Link
                          href={href}
                          className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-cream-50"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-start gap-3 px-5 py-4 opacity-70">
                          {inner}
                        </div>
                      )}
                      <span className="sr-only">الوحدة رقم {i + 1}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </section>

        {/* ── العمود الجانبي ── */}
        <aside className="space-y-5">
          {/* نتائج الاختبارات */}
          <div className="card p-5">
            <h3 className="font-display text-[15px] font-black text-ink-900">
              آخر نتائج الاختبارات
            </h3>
            {attempts.length === 0 ? (
              <p className="mt-3 text-[13px] leading-relaxed text-ink-500">
                لم تجتز أي اختبار بعد. يظهر اختبار كل وحدة بعد إتمام دروسها.
              </p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {attempts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-cream-50 px-3 py-2.5"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-bold text-ink-800">
                        {a.quiz.module.title}
                      </span>
                      <span className="num text-[11.5px] text-ink-500">
                        المحاولة {a.attemptNumber} ·{" "}
                        {formatDate(a.submittedAt)}
                      </span>
                    </span>
                    <Badge tone={a.passed ? "green" : "red"}>
                      <span className="num">{a.score}</span>%
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ترقية الباقة */}
          {!isPremium && (
            <div className="overflow-hidden rounded-2xl border-2 border-gold-400 bg-gold-50">
              <div className="px-5 py-5">
                <Badge tone="gold">
                  <IconSparkle className="text-[10px]" />
                  ترقية
                </Badge>
                <h3 className="mt-2.5 font-display text-[15px] font-black text-ink-900">
                  انتقل إلى PREMIUM ELITE
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">
                  تمارين وتصحيحات إضافية، نماذج امتحانات حصرية، تصحيح أعمالك من
                  الأستاذ، ومساحة دعم خاصة.
                </p>
                <LinkButton
                  href="/checkout/PREMIUM_ELITE"
                  variant="gold"
                  size="sm"
                  className="mt-4 w-full"
                >
                  عرض التفاصيل
                </LinkButton>
              </div>
            </div>
          )}

          {/* كيف يعمل النظام */}
          <div className="card p-5">
            <h3 className="font-display text-[15px] font-black text-ink-900">
              كيف يتقدّم البرنامج؟
            </h3>
            <ol className="mt-3 space-y-2.5 text-[13px] leading-relaxed text-ink-700">
              {[
                "شاهد الدرس واطّلع على ملفاته.",
                "اضغط «إتمام الدرس» ليُفتح الدرس التالي.",
                "بعد آخر درس في الوحدة يظهر اختبارها.",
                `اجتز الاختبار بـ ${settings["quiz.defaultPassScore"]}% لتُفتح الوحدة التالية.`,
              ].map((s, i) => (
                <li key={s} className="flex gap-2.5">
                  <span className="num grid size-5 shrink-0 place-items-center rounded-md bg-brand-50 text-[11px] font-black text-brand-700">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>
    </div>
  );
}
