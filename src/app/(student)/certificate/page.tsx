import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getCurriculum } from "@/lib/curriculum";
import { getSettings } from "@/lib/settings";
import { BRAND } from "@/lib/constants";
import { LinkButton, EmptyState, ProgressBar } from "@/components/ui";
import { IconAward, IconCheck } from "@/components/ui/icons";
import { PrintButton } from "./PrintButton";
import { formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إثبات الإتمام" };

function serialFor(userId: string) {
  const year = new Date().getFullYear();
  return `BAS-${year}-${userId.slice(-6).toUpperCase()}`;
}

export default async function CertificatePage() {
  const user = await requireUser("/certificate");
  const [curriculum, settings] = await Promise.all([
    getCurriculum(user),
    getSettings(),
  ]);

  if (!settings["certificate.enabled"]) {
    return (
      <div className="container-page max-w-xl py-16">
        <EmptyState
          icon={<IconAward />}
          title="الشهادات غير مفعّلة حاليًا"
          description="يمكن للإدارة تفعيلها من لوحة التحكّم."
          action={<LinkButton href="/dashboard">العودة إلى لوحتي</LinkButton>}
        />
      </div>
    );
  }

  if (!curriculum) return null;

  const required = settings["certificate.minCompletion"];
  if (curriculum.percent < required) {
    return (
      <div className="container-page max-w-xl py-16">
        <div className="card p-8 text-center">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-cream-100 text-2xl text-ink-300">
            <IconAward />
          </span>
          <h1 className="mt-4 font-display text-xl font-black text-ink-900">
            الشهادة لم تُفتح بعد
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-loose text-ink-500">
            تُمنَح الشهادة عند بلوغ{" "}
            <span className="num font-bold">{required}%</span> من البرنامج. أنجزت
            حتى الآن <span className="num font-bold">{curriculum.percent}%</span>{" "}
            — تبقّى{" "}
            <span className="num font-bold">{curriculum.remainingLessons}</span>{" "}
            درسًا.
          </p>
          <ProgressBar value={curriculum.percent} className="mx-auto mt-5 max-w-xs" />
          <LinkButton href="/dashboard" className="mt-6">
            متابعة التعلّم
          </LinkButton>
        </div>
      </div>
    );
  }

  // إصدار الشهادة عند أول زيارة مستوفية للشروط
  let certificate = await db.certificate.findFirst({
    where: { userId: user.id, courseId: curriculum.course.id },
  });

  if (!certificate) {
    const attempts = await db.quizAttempt.findMany({
      where: { userId: user.id, passed: true },
      select: { score: true },
    });
    const avg =
      attempts.length > 0
        ? Math.round(attempts.reduce((s, a) => s + a.score, 0) / attempts.length)
        : curriculum.percent;

    certificate = await db.certificate.create({
      data: {
        userId: user.id,
        courseId: curriculum.course.id,
        serial: serialFor(user.id),
        grade:
          avg >= 90 ? "ممتاز" : avg >= 80 ? "جيد جدًا" : avg >= 70 ? "جيد" : "مقبول",
      },
    });
  }

  return (
    <div className="container-page max-w-4xl py-8 print:py-0">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h1 className="font-display text-xl font-black text-ink-900">
            إثبات إتمام البرنامج
          </h1>
          <p className="mt-1 text-[13.5px] text-ink-500">
            يمكنك طباعتها أو حفظها بصيغة PDF من نافذة الطباعة.
          </p>
        </div>
        <div className="flex gap-2">
          <PrintButton />
          <LinkButton href="/dashboard" variant="outline">
            العودة إلى لوحتي
          </LinkButton>
        </div>
      </div>

      {/* ═══════════ الشهادة ═══════════ */}
      <div className="overflow-hidden rounded-3xl border-[3px] border-ink-900 bg-cream-50 print:rounded-none print:border-2">
        <div className="brand-gradient brand-texture px-8 py-6 text-center text-white">
          <p className="font-display text-[13px] tracking-[0.3em] text-brand-200">
            BAC ARABE SÉNÉGAL
          </p>
          <p className="mt-1 text-[12px] text-brand-50/70">
            منصّة منهجية التاريخ والجغرافيا
          </p>
        </div>

        <div className="px-8 py-10 text-center sm:px-14 sm:py-14">
          <span className="mx-auto grid size-16 place-items-center rounded-full border-2 border-gold-400 text-3xl text-gold-500">
            <IconAward />
          </span>

          <h2 className="mt-6 font-display text-2xl font-black text-ink-900 sm:text-3xl">
            إثبـات إتمـام البرنـامج
          </h2>
          <p className="mt-3 text-[14px] text-ink-500">
            تشهد إدارة المنصّة بأنّ الطالب(ة)
          </p>

          <p className="mt-4 border-y-2 border-dashed border-cream-300 py-4 font-display text-3xl font-black text-brand-800 sm:text-4xl">
            {user.name}
          </p>

          <p className="mx-auto mt-5 max-w-xl text-[15px] leading-loose text-ink-700">
            قد أتمّ بنجاح جميع وحدات ودروس برنامج{" "}
            <strong className="text-ink-900">«{curriculum.course.title}»</strong>{" "}
            بإشراف {BRAND.instructor}، واجتاز اختبارات الوحدات المقرّرة بتقدير{" "}
            <strong className="text-gold-600">{certificate.grade}</strong>.
          </p>

          <div className="mx-auto mt-8 grid max-w-xl gap-3 sm:grid-cols-3">
            {[
              { k: "عدد الدروس", v: String(curriculum.totalLessons) },
              { k: "عدد الوحدات", v: "٦" },
              { k: "نسبة الإنجاز", v: `${curriculum.percent}%` },
            ].map((s) => (
              <div
                key={s.k}
                className="rounded-xl border border-cream-300 bg-white px-4 py-3"
              >
                <p className="text-[11.5px] text-ink-500">{s.k}</p>
                <p className="num mt-0.5 font-display text-lg font-black text-ink-900">
                  {s.v}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-cream-300 pt-6 text-right">
            <div>
              <p className="text-[11.5px] text-ink-500">رقم الشهادة</p>
              <p className="num text-[13.5px] font-black text-ink-900">
                {certificate.serial}
              </p>
            </div>
            <div>
              <p className="text-[11.5px] text-ink-500">تاريخ الإصدار</p>
              <p className="num text-[13.5px] font-black text-ink-900">
                {formatDate(certificate.issuedAt)}
              </p>
            </div>
            <div className="text-center">
              <p className="font-display text-[15px] font-black text-brand-800">
                {BRAND.instructor}
              </p>
              <p className="mt-0.5 border-t border-ink-300 pt-1 text-[11.5px] text-ink-500">
                المشرف على البرنامج
              </p>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-5 flex items-center justify-center gap-2 text-center text-[12.5px] text-ink-500 print:hidden">
        <IconCheck className="text-brand-600" />
        شهادة صادرة إلكترونيًا — يمكن التحقّق منها لدى الإدارة برقمها التسلسلي.
      </p>
    </div>
  );
}
