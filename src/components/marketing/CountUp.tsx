"use client";

import { useEffect, useRef } from "react";

/**
 * رقم يعدّ تصاعديًا من الصفر إلى قيمته عند تحميل الصفحة.
 *
 * الخادم يرسم القيمة النهائية، فيراها محرّك البحث ومن تعطّل عنده JavaScript
 * صحيحة. العدّ يكتب في النصّ مباشرة (لا state) حتى لا يُعاد رسم المكوّن ٦٠
 * مرّة في الثانية على هواتف ضعيفة.
 */
export function CountUp({ value, duration = 1400 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || value <= 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // تباطؤ في النهاية
      el.textContent = String(Math.round(value * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    el.textContent = "0";
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      el.textContent = String(value);
    };
  }, [value, duration]);

  return <span ref={ref}>{value}</span>;
}
