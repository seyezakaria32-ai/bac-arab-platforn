"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * يُظهر العناصر الموسومة بـ data-reveal بحركة لطيفة عند وصولها إلى الشاشة.
 *
 * مبادئ التصميم:
 * - المحتوى ظاهر افتراضيًا. لا يُخفى شيء إلا بعد أن يعمل هذا المكوّن ويضيف
 *   الصنف reveal-on — فإن تعطّل JavaScript أو تأخّر لا تختفي الصفحة.
 * - ما هو ظاهر في الشاشة لحظة التشغيل يبقى ظاهرًا بلا حركة، وإلا لومض
 *   (ظاهر ← مخفيّ ← يظهر) أمام عين الزائر.
 * - كل عنصر يتحرّك مرّة واحدة فقط، ثم يُترك.
 * - من فعّل «تقليل الحركة» في جهازه لا يرى أيّ حركة.
 */
export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const root = document.documentElement;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"),
    );

    // الظاهر الآن يبقى ظاهرًا — قبل تفعيل الإخفاء
    const fold = window.innerHeight;
    for (const el of elements) {
      const r = el.getBoundingClientRect();
      if (r.top < fold && r.bottom > 0) el.classList.add("is-visible");
    }
    root.classList.add("reveal-on");

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      // يبدأ الظهور حين يدخل العنصر ١٠٪ من أسفل الشاشة، لا عند حافّتها
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 },
    );
    for (const el of elements) {
      if (!el.classList.contains("is-visible")) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
