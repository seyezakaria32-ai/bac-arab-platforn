"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { buttonClass } from "@/components/ui";
import { IconMenu, IconClose } from "@/components/ui/icons";

/** روابط القائمة تُبنى من أقسام الصفحة الرئيسية (اسم القسم في القائمة) */
export function SiteHeader({
  user,
  nav,
}: {
  user: { name: string; role: string } | null;
  nav: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // منع تمرير الصفحة خلف القائمة المفتوحة
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-cream-300 bg-cream-50/85 backdrop-blur-lg"
          : "bg-transparent"
      }`}
    >
      <div className="container-page flex h-16 items-center justify-between gap-4 sm:h-18">
        <Logo />

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="font-ui rounded-lg px-3 py-2 text-sm font-medium text-ink-700 transition-colors hover:bg-white hover:text-brand-700"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <Link
              href={user.role === "admin" ? "/admin" : "/dashboard"}
              className={buttonClass("primary", "sm")}
            >
              {user.role === "admin" ? "لوحة الإدارة" : "لوحتي"}
            </Link>
          ) : (
            <>
              <Link href="/login" className={buttonClass("ghost", "sm")}>
                تسجيل الدخول
              </Link>
              <Link href="#plans" className={buttonClass("primary", "sm")}>
                سجّل الآن
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="grid size-10 place-items-center rounded-xl border border-cream-300 bg-white text-xl text-ink-800 lg:hidden"
          aria-label={open ? "إغلاق القائمة" : "فتح القائمة"}
          aria-expanded={open}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      </header>

      {/* لوحة القائمة خارج <header> عمدًا: عند التمرير تحمل الترويسة
          backdrop-blur، وأي أب يحمل backdrop-filter يصير المرجع لعناصر
          position:fixed بداخله، فتنكمش اللوحة إلى ارتفاع الترويسة
          ويظهر محتوى الصفحة فوقها. */}
      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-[60] border-t border-cream-300 bg-cream-50 px-4 py-5 sm:top-[72px] lg:hidden">
          <nav className="flex flex-col gap-1">
            {nav.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-ui rounded-xl px-4 py-3 text-base font-bold text-ink-800 transition-colors hover:bg-white"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="mt-5 flex flex-col gap-2 border-t border-cream-300 pt-5">
            {user ? (
              <Link
                href={user.role === "admin" ? "/admin" : "/dashboard"}
                className={buttonClass("primary", "lg")}
                onClick={() => setOpen(false)}
              >
                {user.role === "admin" ? "لوحة الإدارة" : "متابعة التعلّم"}
              </Link>
            ) : (
              <>
                <Link
                  href="#plans"
                  className={buttonClass("primary", "lg")}
                  onClick={() => setOpen(false)}
                >
                  ابدأ البرنامج
                </Link>
                <Link
                  href="/login"
                  className={buttonClass("outline", "lg")}
                  onClick={() => setOpen(false)}
                >
                  تسجيل الدخول
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
