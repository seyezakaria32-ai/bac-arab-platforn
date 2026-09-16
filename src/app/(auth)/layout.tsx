import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { IconCheck, IconArrowPrev } from "@/components/ui/icons";
import { BRAND } from "@/lib/constants";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      {/* لوحة النموذج */}
      <div className="flex flex-col px-5 py-8 sm:px-10">
        <div className="flex items-center justify-between">
          <Logo />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[13px] font-bold text-ink-500 transition-colors hover:text-brand-700"
          >
            <IconArrowPrev />
            العودة للموقع
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>

        <p className="text-center text-[12px] text-ink-300">
          © <span className="num">{new Date().getFullYear()}</span> {BRAND.name}
        </p>
      </div>

      {/* اللوحة الجانبية التسويقية */}
      <aside className="brand-gradient brand-texture relative hidden flex-col justify-center overflow-hidden px-14 text-white lg:flex">
        <h2 className="font-display text-3xl leading-snug font-black">
          {BRAND.programTitle}
          <span className="mt-1 block text-brand-300">
            {BRAND.programSubtitle}
          </span>
        </h2>
        <p className="mt-5 max-w-md leading-loose text-brand-50/80">
          انضمّ إلى البرنامج التدريبي الذي يأخذ بيدك خطوة بخطوة نحو إتقان
          منهجية الإجابة، بإشراف {BRAND.instructor} — ابدأ اليوم وتعلّم بإيقاعك.
        </p>

        <ul className="mt-9 space-y-3.5">
          {[
            "ابدأ فور التسجيل — بلا مواعيد ولا دفعات",
            "دفعة واحدة تكفيك طوال موسم البكالوريا",
            "تدرّج منظّم: درس بعد درس، بلا تشتّت",
            "اختبار في نهاية كل وحدة يقيس استيعابك",
            "تقدّمك محفوظ تلقائيًا — تعود من حيث توقّفت",
          ].map((item) => (
            <li key={item} className="flex items-start gap-3 text-[15px]">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-brand-500/20 text-brand-300 ring-1 ring-brand-400/30">
                <IconCheck className="text-[13px]" />
              </span>
              {item}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
