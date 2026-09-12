import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <Logo />
      <p className="num mt-10 font-display text-6xl font-black text-brand-500">
        404
      </p>
      <h1 className="mt-3 font-display text-xl font-black text-ink-900">
        الصفحة غير موجودة
      </h1>
      <p className="mt-2 max-w-sm text-[14px] leading-loose text-ink-500">
        ربّما حُذف هذا المحتوى أو تغيّر رابطه. تحقّق من العنوان أو عد إلى
        الصفحة الرئيسية.
      </p>
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <Link href="/" className={buttonClass("primary")}>
          الصفحة الرئيسية
        </Link>
        <Link href="/dashboard" className={buttonClass("outline")}>
          لوحة الطالب
        </Link>
      </div>
    </div>
  );
}
