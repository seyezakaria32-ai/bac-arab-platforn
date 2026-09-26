"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrowNext, IconArrowPrev, IconPause, IconPlay } from "@/components/ui/icons";

type Poster = { src: string; alt: string };

/** مدّة بقاء الشريحة قبل الانتقال، ومدّة حركة الانتقال نفسها */
const INTERVAL_MS = 2000;
const SLIDE_MS = 650;
/** أكبر عدد شرائح يظهر معًا (على الشاشات العريضة) — يحدّد عدد النسخ المكرّرة */
const MAX_PER_VIEW = 2;

/**
 * عارض ملصقات يتقدّم تلقائيًا، على طريقة slick: شريحتان معًا على الشاشات
 * العريضة وشريحة على الهاتف، دوران بلا نهاية، نقاط وأسهم، وسحب بالإصبع.
 *
 * بلا مكتبة: slick يتطلّب jQuery (~90KB) لما يكفيه هنا بضع عشرات من الأسطر.
 *
 * الدوران اللانهائي: تُلحق نسخ من أولى الشرائح بآخر الشريط. حين يبلغ العرض
 * النسخة (المطابقة للبداية بصريًا) نقفز إلى البداية الحقيقية دون حركة، فلا
 * يرى الزائر أيّ ارتداد إلى الخلف.
 *
 * يتوقّف تلقائيًا حين: يمرّ الفأرة فوقه، أو يلمسه الزائر، أو يُركَّز عليه
 * بلوحة المفاتيح، أو يخرج من الشاشة، أو تُخفى علامة التبويب — ولمن فعّل
 * «تقليل الحركة» لا يبدأ تلقائيًا أصلًا.
 */
export function PosterSlider({ posters }: { posters: Poster[] }) {
  const n = posters.length;
  const [perView, setPerView] = useState(MAX_PER_VIEW);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [drag, setDrag] = useState(0);
  /** يزداد مع كل انتقال يطلبه الزائر أو المؤقّت — لا مع القفزة الصامتة */
  const [moves, setMoves] = useState(0);

  const [userPaused, setUserPaused] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dragStart = useRef<{ x: number; y: number; id: number; horizontal: boolean | null } | null>(null);

  const canSlide = n > perView;

  /* عدد الشرائح الظاهرة بحسب عرض الشاشة */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const apply = () => setPerView(mq.matches ? 2 : 1);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  /* تقليل الحركة: العرض يبدأ متوقّفًا ويُحرَّك يدويًا فقط */
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setUserPaused(true);
  }, []);

  /* لا حركة خارج الشاشة ولا في علامة تبويب مخفيّة */
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), {
      threshold: 0.35,
    });
    io.observe(el);
    const onVis = () => setTabVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVis);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  /** يمنع نقرتين متتاليتين من إرباك القفزة اللانهائية أثناء الحركة */
  const lock = () => {
    setMoves((m) => m + 1);
    busy.current = true;
    clearTimeout(busyTimer.current);
    // احتياط: transitionend لا يصل أحيانًا (تبويب مخفيّ، حركة ملغاة)
    busyTimer.current = setTimeout(() => (busy.current = false), SLIDE_MS + 100);
  };

  /**
   * قفزة صامتة (بلا حركة) إلى موضع مطابق بصريًا، ثم حركة إلى الهدف.
   * الإطاران المتتاليان يضمنان أن المتصفّح رسم القفزة قبل إعادة تفعيل الحركة،
   * وإلا دُمجتا في حركة واحدة طويلة إلى الخلف.
   */
  const jumpThenSlide = (from: number, to: number) => {
    setAnimate(false);
    setIndex(from);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setAnimate(true);
        setIndex(to);
      }),
    );
  };

  const next = useCallback(() => {
    if (!canSlide || busy.current) return;
    lock();
    // على نسخة مكرّرة (لم تصل transitionend لسبب ما): نعود للأصل ثم نتقدّم
    if (index >= n) jumpThenSlide(index - n, index - n + 1);
    else {
      setAnimate(true);
      setIndex(index + 1);
    }
  }, [canSlide, index, n]);

  const prev = () => {
    if (!canSlide || busy.current) return;
    lock();
    // من البداية إلى الخلف: النسخة المطابقة للبداية في آخر الشريط، ثم خطوة
    if (index === 0) jumpThenSlide(n, n - 1);
    else {
      setAnimate(true);
      setIndex(index - 1);
    }
  };

  const goTo = (k: number) => {
    if (!canSlide || busy.current || k === index % n) return;
    lock();
    setAnimate(true);
    setIndex(k);
  };

  /* بلوغ النسخة المكرّرة ← عودة صامتة إلى البداية الحقيقية */
  const onTransitionEnd = (e: React.TransitionEvent) => {
    if (e.target !== e.currentTarget || e.propertyName !== "transform") return;
    busy.current = false;
    if (index >= n) {
      setAnimate(false);
      setIndex(index - n);
    }
  };

  /* التقدّم التلقائي: مؤقّت جديد بعد كل انتقال */
  const nextRef = useRef(next);
  nextRef.current = next;
  const playing = canSlide && !userPaused && !hovered && !focused && onScreen && tabVisible && drag === 0;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => nextRef.current(), INTERVAL_MS);
    return () => clearTimeout(t);
    // moves لا index: القفزة الصامتة من النسخة إلى البداية تغيّر index، فكانت
    // تعيد تشغيل المؤقّت وتُبقي الملصق الأول 0.65 ث أطول من غيره
  }, [playing, moves]);

  /* السحب بالإصبع (والفأرة). touch-action: pan-y يُبقي التمرير العمودي للصفحة */
  const onPointerDown = (e: React.PointerEvent) => {
    if (!canSlide || (e.pointerType === "mouse" && e.button !== 0)) return;
    dragStart.current = { x: e.clientX, y: e.clientY, id: e.pointerId, horizontal: null };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const s = dragStart.current;
    if (!s || s.id !== e.pointerId) return;
    const dx = e.clientX - s.x;
    const dy = e.clientY - s.y;
    if (s.horizontal === null) {
      if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
      s.horizontal = Math.abs(dx) > Math.abs(dy);
      if (!s.horizontal) {
        dragStart.current = null; // حركة عمودية: تمرير للصفحة لا سحب
        return;
      }
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* Safari يرمي خطأ إن رُفع الإصبع قبل هذه اللحظة — السحب يعمل بدونه */
      }
      setAnimate(false);
    }
    setDrag(dx);
  };
  const endDrag = () => {
    const s = dragStart.current;
    dragStart.current = null;
    if (!s?.horizontal) return;
    const dx = drag;
    setDrag(0);
    setAnimate(true);
    // في الواجهة العربية الشريحة التالية على اليسار، فسحب المحتوى يمينًا = التالي
    if (dx > 50) next();
    else if (dx < -50) prev();
  };

  if (n === 0) return null;

  const slides = canSlide ? [...posters, ...posters.slice(0, MAX_PER_VIEW)] : posters;
  const active = index % n;
  const step = 100 / perView;

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="ملصقات البرنامج"
      className="relative select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      <div className="overflow-hidden rounded-2xl">
        <div
          className={`flex touch-pan-y ${
            animate ? "transition-transform ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none" : ""
          }`}
          style={{
            // RTL: الشريط يمتدّ من اليمين، والتقدّم يكون بإزاحته نحو اليمين
            transform: `translate3d(calc(${index * step}% + ${drag}px), 0, 0)`,
            transitionDuration: `${SLIDE_MS}ms`,
          }}
          onTransitionEnd={onTransitionEnd}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {slides.map((p, i) => {
            const visible = i >= index && i < index + perView;
            return (
              <div
                key={`${p.src}-${i}`}
                role="group"
                aria-roledescription="slide"
                aria-label={`${(i % n) + 1} من ${n}`}
                aria-hidden={!visible}
                inert={!visible}
                className="shrink-0 basis-full px-1.5 sm:basis-1/2"
              >
                <div className="relative aspect-[760/853] overflow-hidden rounded-2xl ring-1 ring-cream-300">
                  <Image
                    src={p.src}
                    alt={p.alt}
                    fill
                    // الشرائح خارج الإطار أفقيًا لا يحمّلها loading="lazy" إلا
                    // متأخّرة، فتظهر فارغة لحظة دخولها — وهي أربع صور فقط
                    loading="eager"
                    draggable={false}
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                    className="pointer-events-none object-cover"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {canSlide && (
        <>
          {/* السهمان: «السابق» يمينًا و«التالي» يسارًا بحسب اتجاه القراءة */}
          <button
            type="button"
            onClick={prev}
            aria-label="الشريحة السابقة"
            className="absolute top-1/2 right-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg text-ink-800 shadow-md ring-1 ring-ink-900/10 backdrop-blur transition hover:bg-white hover:text-brand-700"
          >
            <IconArrowPrev />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="الشريحة التالية"
            className="absolute top-1/2 left-3 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg text-ink-800 shadow-md ring-1 ring-ink-900/10 backdrop-blur transition hover:bg-white hover:text-brand-700"
          >
            <IconArrowNext />
          </button>

          <div className="mt-4 flex items-center justify-center gap-3">
            <div className="flex items-center gap-2">
              {posters.map((p, k) => (
                <button
                  key={`${p.src}-dot-${k}`}
                  type="button"
                  onClick={() => goTo(k)}
                  aria-label={`عرض الملصق ${k + 1}`}
                  aria-current={k === active}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    k === active ? "w-6 bg-brand-500" : "w-2 bg-cream-300 hover:bg-ink-300"
                  }`}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => setUserPaused((v) => !v)}
              aria-label={userPaused ? "تشغيل العرض التلقائي" : "إيقاف العرض التلقائي"}
              className="grid size-7 place-items-center rounded-full text-[13px] text-ink-500 ring-1 ring-cream-300 transition-colors hover:text-brand-700"
            >
              {userPaused ? <IconPlay /> : <IconPause />}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
