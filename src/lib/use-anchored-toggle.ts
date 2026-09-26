"use client";

import { useCallback } from "react";

/** أطول من حركة الطيّ في Collapse (350ms) بهامش */
const FOLLOW_MS = 450;

/** أقرب عنصر يمرَّر داخله (القائمة الجانبية في صفحة الدرس)، وإلا الصفحة نفسها */
function scrollParent(el: HTMLElement): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const { overflowY } = getComputedStyle(p);
    if ((overflowY === "auto" || overflowY === "scroll") && p.scrollHeight > p.clientHeight) {
      return p;
    }
  }
  return null;
}

/**
 * يُبقي العنصر المنقور ثابتًا على الشاشة بينما يتغيّر ما فوقه.
 *
 * في القوائم التي يُغلق فيها المفتوح تلقائيًا: فتح عنصر يطوي عنصرًا فوقه،
 * فيرتفع المنقور بقدر ما انطوى — وقد يخرج من الشاشة. هنا نعوّض التمرير
 * إطارًا بإطار طوال الحركة، فيبقى العنوان تحت إصبع الزائر.
 *
 * تفاصيل تجعله يعمل في كل المتصفّحات:
 * - الصفحة معرَّفة بـ scroll-behavior: smooth، فكل تعويض كان سيبدأ تمريرًا
 *   ناعمًا يقطعه التالي (اهتزاز). نعطّله أثناء التعويض بدل الاعتماد على
 *   behavior: "instant" التي لا تعرفها كل المتصفّحات (بعضها يرمي خطأ فيتوقّف
 *   التعويض بعد أوّل إطار).
 * - نوقف «تثبيت التمرير» التلقائي (overflow-anchor) وإلا تضاعفت الإزاحة.
 * - إن لمس الزائر الشاشة أو مرّر بنفسه نتوقّف فورًا، فلا نعاند يده.
 */
export function useAnchoredToggle() {
  return useCallback((anchor: HTMLElement | null, change: () => void) => {
    if (!anchor) {
      change();
      return;
    }
    const container = scrollParent(anchor);
    const scroller = container ?? document.documentElement;
    const startTop = anchor.getBoundingClientRect().top;

    const saved = {
      behavior: scroller.style.scrollBehavior,
      anchor: scroller.style.overflowAnchor,
    };
    scroller.style.scrollBehavior = "auto";
    scroller.style.overflowAnchor = "none";

    let stopped = false;
    const stop = () => {
      if (stopped) return;
      stopped = true;
      scroller.style.scrollBehavior = saved.behavior;
      scroller.style.overflowAnchor = saved.anchor;
      window.removeEventListener("wheel", stop);
      window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    };
    window.addEventListener("wheel", stop, { passive: true });
    window.addEventListener("touchstart", stop, { passive: true });
    window.addEventListener("keydown", stop);

    change();

    const began = performance.now();
    const follow = () => {
      if (stopped) return;
      try {
        const drift = anchor.getBoundingClientRect().top - startTop;
        if (Math.abs(drift) > 0.5) {
          if (container) container.scrollTop += drift;
          else window.scrollTo(window.scrollX, window.scrollY + drift);
        }
      } catch {
        stop();
        return;
      }
      if (performance.now() - began < FOLLOW_MS) requestAnimationFrame(follow);
      else stop();
    };
    requestAnimationFrame(follow);
  }, []);
}
