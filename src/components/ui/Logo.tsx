import Image from "next/image";
import Link from "next/link";

/**
 * علامة المنصّة: شعار Bac Arabe Sénégal الأصلي كاملًا
 * (الدائرة | الخط الفاصل | الاسم) مستخرَجًا من ملفات الهوية بخلفية شفّافة.
 * الاسم جزء من الصورة، فلا نكرّره نصًّا.
 *
 * `compact` يعرض الدائرة وحدها للأماكن الضيّقة.
 */
export function Logo({
  variant = "dark",
  href = "/",
  compact = false,
}: {
  variant?: "dark" | "light";
  href?: string | null;
  compact?: boolean;
}) {
  const isLight = variant === "light";

  const content = compact ? (
    <Image
      src="/brand/logo-mark.png"
      alt="Bac Arabe Sénégal"
      width={192}
      height={192}
      priority
      className="size-10 shrink-0 rounded-full"
    />
  ) : (
    <Image
      src="/brand/logo-lockup.png"
      alt="Bac Arabe Sénégal"
      width={634}
      height={104}
      priority
      className={`h-9 w-auto ${isLight ? "brightness-0 invert" : ""}`}
    />
  );

  if (!href) return content;
  return (
    <Link href={href} className="shrink-0" aria-label="الصفحة الرئيسية">
      {content}
    </Link>
  );
}
