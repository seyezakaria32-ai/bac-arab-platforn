"use client";

import { useCallback } from "react";

/** أطول من حركة الطيّ في Collapse (350ms) بهامش */
const FOLLOW_MS = 450;

/**
 * يُبقي العنصر المنقور ثابتًا على الشاشة بينما يتغيّر ما فوقه.
 *
 * في القوائم المطويّة التي يُغلق فيها العنصر المفتوح تلقائيًا: فتح سؤال يطوي
 * جوابًا فوقه، فيرتفع السؤال المنقور مع انكماش ما فوقه — وقد يخرج من الشاشة
 * إن كان الجواب طويلًا. هنا نعوّض التمرير إطارًا بإطار طوال الحركة، فيبقى
 * العنوان تحت إصبع الزائر ويُفتح جوابه في مكانه.
 *
 * نوقف «تثبيت التمرير» التلقائي في المتصفّح (overflow-anchor) أثناء ذلك،
 * وإلا عوّض هو أيضًا فتضاعفت الإزاحة.
 */
export function useAnchoredToggle() {
  return useCallback((anchor: HTMLElement | null, change: () => void) => {
    if (!anchor) {
      change();
      return;
    }
    const startTop = anchor.getBoundingClientRect().top;
    const root = document.documentElement;
    const previous = root.style.overflowAnchor;
    root.style.overflowAnchor = "none";

    change();

    const began = performance.now();
    const follow = () => {
      const drift = anchor.getBoundingClientRect().top - startTop;
      if (Math.abs(drift) > 0.5) window.scrollBy({ top: drift, behavior: "instant" });
      if (performance.now() - began < FOLLOW_MS) requestAnimationFrame(follow);
      else root.style.overflowAnchor = previous;
    };
    requestAnimationFrame(follow);
  }, []);
}
