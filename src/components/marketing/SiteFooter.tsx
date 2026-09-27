import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { IconWhatsapp } from "@/components/ui/icons";
import { BRAND } from "@/lib/constants";

/** النصّ من «تصميم الموقع ← النصوص العامّة»، والروابط السريعة من القائمة العلوية */
export function SiteFooter({
  whatsapp,
  text,
  nav,
}: {
  whatsapp?: string;
  text: string;
  nav: { href: string; label: string }[];
}) {
  const phone = (whatsapp ?? BRAND.whatsapp).replace(/[^0-9]/g, "");

  return (
    <footer className="mt-24 border-t border-cream-300 bg-cream-50">
      <div className="container-page grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          {text && <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-500">{text}</p>}
          <a
            href={`https://wa.me/${phone}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
          >
            <IconWhatsapp className="text-base" />
            تواصل عبر واتساب
          </a>
        </div>

        {nav.length > 0 && (
          <div>
            <h4 className="font-display text-sm font-bold text-ink-900">روابط سريعة</h4>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-500">
              {nav.map((item) => (
                <li key={item.href}>
                  <a href={`/${item.href}`} className="transition-colors hover:text-brand-700">
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h4 className="font-display text-sm font-bold text-ink-900">حسابي</h4>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-500">
            <li>
              <Link href="/login" className="transition-colors hover:text-brand-700">
                تسجيل الدخول
              </Link>
            </li>
            <li>
              <Link href="/register" className="transition-colors hover:text-brand-700">
                إنشاء حساب
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="transition-colors hover:text-brand-700">
                لوحة الطالب
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-300">
        <div className="container-page flex flex-col items-center justify-between gap-2 py-5 text-xs text-ink-500 sm:flex-row">
          <p>
            © <span className="num">{new Date().getFullYear()}</span>{" "}
            {BRAND.name} — جميع الحقوق محفوظة.
          </p>
          <p>
            إشراف وتأطير: <span className="font-bold text-ink-700">{BRAND.instructor}</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
