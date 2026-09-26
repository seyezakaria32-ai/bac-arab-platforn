"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { logoutAction } from "@/app/(auth)/actions";
import {
  IconLogout,
  IconChevronDown,
  IconMenu,
  IconClose,
} from "@/components/ui/icons";

export type NavItem = { href: string; label: string };

export function AppHeader({
  user,
  nav,
  progressPercent,
}: {
  user: { name: string; email: string; role: string; avatarUrl?: string | null };
  nav: NavItem[];
  progressPercent?: number;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  /**
   * قائمة واحدة مفتوحة في كل مرّة: كانت قائمة الحساب وقائمة الهاتف تنفتحان
   * معًا فتتراكبان. النقر خارج الترويسة أو Esc يغلق المفتوح.
   * pointerdown لا mousedown: يصل فورًا مع اللمس بدل انتظار أحداث الفأرة
   * المحاكاة بعد رفع الإصبع.
   */
  useEffect(() => {
    const onPointer = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setMenuOpen(false);
      if (headerRef.current && !headerRef.current.contains(target)) setMobileOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setMenuOpen(false);
      setMobileOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMenuOpen(false);
  }, [pathname]);

  const initials = user.name.trim().charAt(0);
  // لوحة الإدارة تحمل ٨ روابط + شعارًا عريضًا: عند 1024px يتجاوز السطر الشاشة بـ100px،
  // فلا تظهر القائمة الأفقية إلا من 1280px، وتحت ذلك القائمة المنسدلة
  const dense = nav.length > 4;
  const showNav = dense ? "xl:flex" : "md:flex";
  const hideNav = dense ? "xl:hidden" : "md:hidden";

  return (
    <header ref={headerRef} className="sticky top-0 z-40 border-b border-cream-300 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center gap-4">
        <Logo />

        <nav className={`hidden flex-1 items-center gap-1 ${showNav}`}>
          {nav.map((item) => {
            const active =
              item.href === pathname || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`font-ui rounded-lg px-3 py-2 text-sm font-bold transition-colors ${
                  active
                    ? "bg-brand-50 text-brand-800"
                    : "text-ink-500 hover:bg-cream-100 hover:text-ink-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div
          className={`flex flex-1 items-center justify-end gap-2 ${
            dense ? "xl:flex-none" : "md:flex-none"
          }`}
        >
          {typeof progressPercent === "number" && (
            <div className="hidden items-center gap-2 rounded-full bg-cream-100 px-3 py-1.5 lg:flex">
              <span className="text-[12px] font-medium text-ink-500">تقدّمك</span>
              <span className="num text-[13px] font-black text-brand-700">
                {progressPercent}%
              </span>
            </div>
          )}

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setMenuOpen((v) => !v);
                setMobileOpen(false);
              }}
              aria-expanded={menuOpen}
              className="flex items-center gap-2 rounded-xl px-1.5 py-1.5 transition-colors hover:bg-cream-100"
            >
              <span className="grid size-9 place-items-center rounded-full bg-ink-900 text-sm font-black text-brand-300">
                {initials}
              </span>
              <span className="hidden max-w-32 truncate text-[13px] font-bold text-ink-800 sm:block">
                {user.name}
              </span>
              <IconChevronDown className="text-ink-300" />
            </button>

            {menuOpen && (
              <div className="absolute end-0 mt-2 w-60 overflow-hidden rounded-2xl border border-cream-300 bg-white shadow-xl">
                <div className="border-b border-cream-200 px-4 py-3">
                  <p className="truncate text-[13.5px] font-bold text-ink-900">
                    {user.name}
                  </p>
                  <p dir="ltr" className="truncate text-right text-[12px] text-ink-500">
                    {user.email}
                  </p>
                </div>
                <div className="p-1.5">
                  <Link
                    href="/profile"
                    className="block rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-cream-100"
                  >
                    حسابي وإعداداتي
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-cream-100"
                    >
                      لوحة الإدارة
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="block rounded-xl px-3 py-2.5 text-[13.5px] font-medium text-ink-700 transition-colors hover:bg-cream-100"
                  >
                    الموقع الرئيسي
                  </Link>
                  <form action={logoutAction}>
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-right text-[13.5px] font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      <IconLogout />
                      تسجيل الخروج
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setMobileOpen((v) => !v);
              setMenuOpen(false);
            }}
            className={`grid size-10 place-items-center rounded-xl border border-cream-300 text-lg text-ink-800 ${hideNav}`}
            aria-label="القائمة"
          >
            {mobileOpen ? <IconClose /> : <IconMenu />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav className={`border-t border-cream-200 bg-white px-4 py-3 ${hideNav}`}>
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-ui block rounded-xl px-3 py-3 text-[15px] font-bold text-ink-800 hover:bg-cream-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
