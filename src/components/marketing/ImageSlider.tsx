"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { IconArrowNext, IconArrowPrev, IconPause, IconPlay } from "@/components/ui/icons";

export type SliderSlide = { src: string; alt: string; href?: string | null };

/** مدّة حركة الانتقال نفسها */
const SLIDE_MS = 650;

/** عرض الشريحة لكل عدد — نصوص ثابتة كي يلتقطها Tailwind عند البناء */
const BASIS: Record<number, string> = {
  1: "basis-full",
  2: "basis-full sm:basis-1/2",
  3: "basis-full sm:basis-1/2 lg:basis-1/3",
  4: "basis-full sm:basis-1/2 lg:basis-1/4",
};

/** حجم الصورة المطلوب من الخادم بحسب عدد الشرائح الظاهرة */
const SIZES: Record<number, string> = {
  1: "(min-width: 1280px) 1200px, 95vw",
  2: "(min-width: 1024px) 600px, (min-width: 640px) 48vw, 95vw",
  3: "(min-width: 1024px) 400px, (min-width: 640px) 48vw, 95vw",
  4: "(min-width: 1024px) 300px, (min-width: 640px) 48vw, 95vw",
};

/**
 * عارض صور يتقدّم تلقائيًا، على طريقة slick: عدد الصور الظاهرة معًا يحدّده
 * المدير (صورة واحدة دائمًا على الهاتف، واثنتان كحدّ أقصى على اللوحي)،
 * دوران بلا نهاية، نقاط وأسهم، وسحب بالإصبع، وروابط اختيارية على الصور.
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
export function ImageSlider({
  slides,
  perView: maxPerView = 2,
  intervalMs = 2000,
  aspect = "760 / 853",
  autoplay = true,
  mode = "loop",
  label = "عارض صور",
}: {
  slides: SliderSlide[];
  /** عدد الصور الظاهرة معًا على الحاسوب (1–4) */
  perView?: number;
  intervalMs?: number;
  /** نسبة الإطار بصيغة CSS، مثل "16 / 9" */
  aspect?: string;
  autoplay?: boolean;
  /**
   * loop: دوران مستمر في الاتجاه نفسه بلا نهاية.
   * bounce: ذهاب وإياب — عند آخر صورة يعكس اتجاهه ويعود صورةً صورة.
   */
  mode?: "loop" | "bounce";
  label?: string;
}) {
  const n = slides.length;
  const maxPV = Math.min(Math.max(Math.round(maxPerView), 1), 4);
  const [perView, setPerView] = useState(maxPV);
  const [index, setIndex] = useState(0);
  const [animate, setAnimate] = useState(true);
  const [drag, setDrag] = useState(0);
  /** يزداد مع كل انتقال يطلبه الزائر أو المؤقّت — لا مع القفزة الصامتة */
  const [moves, setMoves] = useState(0);

  const [userPaused, setUserPaused] = useState(!autoplay);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [onScreen, setOnScreen] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const rootRef = useRef<HTMLDivElement>(null);
  const busy = useRef(false);
  const busyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const dragStart = useRef<{ x: number; y: number; id: number; horizontal: boolean | null } | null>(null);
  /** سحبٌ انتهى للتوّ: النقرة التي تليه ليست نقرة على رابط الصورة */
  const justDragged = useRef(false);

  const canSlide = n > perView;
  const bounce = mode === "bounce";
  /** آخر موضع في وضع الذهاب والإياب: حين تظهر الصور الأخيرة كاملة */
  const lastIndex = Math.max(n - perView, 0);
  /** اتجاه التشغيل التلقائي في وضع الذهاب والإياب */
  const dir = useRef<1 | -1>(1);

  /* عدد الشرائح الظاهرة بحسب عرض الشاشة — مطابق لفئات BASIS */
  useEffect(() => {
    const sm = window.matchMedia("(min-width: 640px)");
    const lg = window.matchMedia("(min-width: 1024px)");
    const apply = () =>
      setPerView(lg.matches ? maxPV : sm.matches ? Math.min(2, maxPV) : 1);
    apply();
    sm.addEventListener("change", apply);
    lg.addEventListener("change", apply);
    return () => {
      sm.removeEventListener("change", apply);
      lg.removeEventListener("change", apply);
    };
  }, [maxPV]);

  /* تغيّر عدد الصور أو الظاهر منها: البداية من الأوّل بلا حركة */
  useEffect(() => {
    setAnimate(false);
    setIndex(0);
    dir.current = 1;
  }, [n, perView]);

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
    if (bounce) {
      if (index >= lastIndex) return;
      lock();
      setAnimate(true);
      setIndex(index + 1);
      return;
    }
    lock();
    // على نسخة مكرّرة (لم تصل transitionend لسبب ما): نعود للأصل ثم نتقدّم
    if (index >= n) jumpThenSlide(index - n, index - n + 1);
    else {
      setAnimate(true);
      setIndex(index + 1);
    }
  }, [canSlide, index, n, bounce, lastIndex]);

  const prev = () => {
    if (!canSlide || busy.current) return;
    if (bounce) {
      if (index <= 0) return;
      lock();
      setAnimate(true);
      setIndex(index - 1);
      return;
    }
    lock();
    // من البداية إلى الخلف: النسخة المطابقة للبداية في آخر الشريط، ثم خطوة
    if (index === 0) jumpThenSlide(n, n - 1);
    else {
      setAnimate(true);
      setIndex(index - 1);
    }
  };

  const goTo = (k: number) => {
    if (bounce) k = Math.min(k, lastIndex);
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
  /** خطوة التشغيل التلقائي: دائمًا إلى الأمام، أو ذهابًا وإيابًا */
  const autoStep = () => {
    if (!bounce) return next();
    if (index >= lastIndex) dir.current = -1;
    else if (index <= 0) dir.current = 1;
    if (dir.current === 1) next();
    else prev();
  };
  const nextRef = useRef(autoStep);
  nextRef.current = autoStep;
  const playing = canSlide && !userPaused && !hovered && !focused && onScreen && tabVisible && drag === 0;
  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => nextRef.current(), intervalMs);
    return () => clearTimeout(t);
    // moves لا index: القفزة الصامتة من النسخة إلى البداية تغيّر index، فكانت
    // تعيد تشغيل المؤقّت وتُبقي الصورة الأولى 0.65 ث أطول من غيرها
  }, [playing, moves, intervalMs]);

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
    // في وضع الذهاب والإياب لا شيء بعد الطرفين: السحب يقاوم ثم يرتدّ
    const pastEdge = bounce && ((index >= lastIndex && dx > 0) || (index <= 0 && dx < 0));
    setDrag(pastEdge ? dx * 0.3 : dx);
  };
  const endDrag = () => {
    const s = dragStart.current;
    dragStart.current = null;
    if (!s?.horizontal) return;
    justDragged.current = true;
    const dx = drag;
    setDrag(0);
    setAnimate(true);
    // في الواجهة العربية الشريحة التالية على اليسار، فسحب المحتوى يمينًا = التالي
    if (dx > 50) next();
    else if (dx < -50) prev();
  };

  if (n === 0) return null;

  const track = canSlide && !bounce ? [...slides, ...slides.slice(0, maxPV)] : slides;
  const active = index % n;
  // الذهاب والإياب: نقطة لكل موضع ممكن (4 صور، اثنتان معًا ← 3 مواضع)
  const dots = bounce ? lastIndex + 1 : n;
  const step = 100 / perView;
  const arrow =
    "absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-lg text-ink-800 shadow-md ring-1 ring-ink-900/10 backdrop-blur transition hover:bg-white hover:text-brand-700 disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white/90 disabled:hover:text-ink-800";

  return (
    <div
      ref={rootRef}
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
      className="select-none"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      {/* relative هنا لا على الجذر: السهمان يتوسّطان الصور لا الصور مع النقاط */}
      <div className="relative">
        <div className="overflow-hidden rounded-2xl">
          <div
            className="flex touch-pan-y"
            style={{
              // RTL: الشريط يمتدّ من اليمين، والتقدّم يكون بإزاحته نحو اليمين
              transform: `translate3d(calc(${index * step}% + ${drag}px), 0, 0)`,
              // transition كاملة هنا أو none صريحة — لا مدّة وحدها: كانت المدّة
              // مكتوبة دائمًا، فحين تُزال خاصيّة transform يعود المتصفّح إلى
              // القيمة الافتراضية all ويحرّك كل شيء 650ms، فتظهر «القفزة
              // الصامتة» إلى البداية ارتدادًا سريعًا مرئيًا، ويتأخّر السحب عن الإصبع.
              transition: animate
                ? `transform ${SLIDE_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`
                : "none",
            }}
            onTransitionEnd={onTransitionEnd}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            onClickCapture={(e) => {
              if (justDragged.current) {
                e.preventDefault();
                e.stopPropagation();
              }
              justDragged.current = false;
            }}
          >
            {track.map((p, i) => {
              const visible = i >= index && i < index + perView;
              const img = (
                <Image
                  src={p.src}
                  alt={p.alt}
                  fill
                  // الشرائح خارج الإطار أفقيًا لا يحمّلها loading="lazy" إلا
                  // متأخّرة، فتظهر فارغة لحظة دخولها
                  loading="eager"
                  draggable={false}
                  sizes={SIZES[maxPV]}
                  className="pointer-events-none object-cover"
                />
              );
              const frame = "relative block overflow-hidden rounded-2xl ring-1 ring-cream-300";
              return (
                <div
                  key={`${p.src}-${i}`}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${(i % n) + 1} من ${n}`}
                  aria-hidden={!visible}
                  inert={!visible}
                  className={`shrink-0 px-1.5 ${BASIS[maxPV]}`}
                >
                  {p.href ? (
                    <a
                      href={p.href}
                      draggable={false}
                      className={`${frame} transition-opacity hover:opacity-95`}
                      style={{ aspectRatio: aspect }}
                      {...(/^https?:\/\//.test(p.href)
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                    >
                      {img}
                    </a>
                  ) : (
                    <div className={frame} style={{ aspectRatio: aspect }}>
                      {img}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {canSlide && (
          <>
            {/* «السابق» يمينًا و«التالي» يسارًا بحسب اتجاه القراءة */}
            <button
              type="button"
              onClick={prev}
              disabled={bounce && index <= 0}
              aria-label="الصورة السابقة"
              className={`${arrow} right-3`}
            >
              <IconArrowPrev />
            </button>
            <button
              type="button"
              onClick={next}
              disabled={bounce && index >= lastIndex}
              aria-label="الصورة التالية"
              className={`${arrow} left-3`}
            >
              <IconArrowNext />
            </button>
          </>
        )}
      </div>

      {canSlide && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {Array.from({ length: dots }, (_, k) => (
              <button
                key={k}
                type="button"
                onClick={() => goTo(k)}
                aria-label={`عرض الصورة ${k + 1}`}
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
            className="grid size-7 shrink-0 place-items-center rounded-full text-[13px] text-ink-500 ring-1 ring-cream-300 transition-colors hover:text-brand-700"
          >
            {userPaused ? <IconPlay /> : <IconPause />}
          </button>
        </div>
      )}
    </div>
  );
}
