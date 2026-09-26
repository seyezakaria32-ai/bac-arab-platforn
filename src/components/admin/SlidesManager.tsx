"use client";

import Image from "next/image";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addSlideAction,
  deleteSlideAction,
  reorderSlidesAction,
  updateSlideAction,
} from "@/app/(admin)/admin/sliders/actions";
import type { AdminResult } from "@/app/(admin)/admin/actions";
import type { SiteImage } from "@/lib/settings";
import { Alert } from "@/components/ui";
import { IconTrash, IconUpload, IconPlus, IconCheck } from "@/components/ui/icons";

type SlideRow = { id: string; imageUrl: string; alt: string; linkUrl: string | null };

/**
 * إدارة صور عارض: رفع عدّة صور دفعة واحدة، اختيار من مكتبة الهوية، إعادة
 * الترتيب بالسحب والإفلات (حاسوب) أو بالسهمين (هاتف)، حذف، ووصف ورابط لكل صورة.
 */
export function SlidesManager({
  sliderId,
  slides: initial,
  aspect,
  library,
}: {
  sliderId: string;
  slides: SlideRow[];
  /** نسبة الإطار بصيغة CSS ليطابق العرضُ هنا العرضَ في الموقع */
  aspect: string;
  library: SiteImage[];
}) {
  const router = useRouter();
  const [slides, setSlides] = useState(initial);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [notice, setNotice] = useState<AdminResult | null>(null);
  const [pending, start] = useTransition();

  // بعد كل تحديث من الخادم (إضافة، حذف) نأخذ القائمة الجديدة
  useEffect(() => setSlides(initial), [initial]);

  /** ترتيب متفائل: يظهر فورًا، ويُعاد إن رفضه الخادم */
  const commitOrder = (nextOrder: SlideRow[]) => {
    const before = slides;
    setSlides(nextOrder);
    start(async () => {
      const res = await reorderSlidesAction(sliderId, nextOrder.map((s) => s.id));
      if (!res.ok) {
        setSlides(before);
        setNotice(res);
      }
      router.refresh();
    });
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= slides.length || from === to) return;
    const next = [...slides];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    commitOrder(next);
  };

  const remove = (s: SlideRow, i: number) => {
    if (!window.confirm(`حذف الصورة رقم ${i + 1} من هذا العارض؟`)) return;
    setSlides((list) => list.filter((x) => x.id !== s.id));
    start(async () => {
      const res = await deleteSlideAction(s.id);
      if (!res.ok) setNotice(res);
      router.refresh();
    });
  };

  return (
    <div className="space-y-5">
      {notice && (
        <Alert tone={notice.ok ? "success" : "error"}>{notice.message}</Alert>
      )}

      <Uploader sliderId={sliderId} library={library} onDone={() => router.refresh()} />

      {slides.length === 0 ? (
        <p className="rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50/60 px-5 py-10 text-center text-[13.5px] text-ink-500">
          لا صور في هذا العارض بعد — لن يظهر في الموقع حتى تضيف صورة واحدة على الأقل.
        </p>
      ) : (
        <>
          <p className="text-[12.5px] text-ink-500">
            اسحب البطاقات لتغيير الترتيب (على الحاسوب)، أو استعمل السهمين. الترتيب
            هنا هو ترتيب الظهور في الموقع.
            {pending && <span className="mr-2 font-bold text-brand-700">جارٍ الحفظ…</span>}
          </p>
          <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {slides.map((s, i) => (
              <li
                key={s.id}
                draggable
                onDragStart={(e) => {
                  setDragId(s.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  if (overId !== s.id) setOverId(s.id);
                }}
                onDragLeave={() => overId === s.id && setOverId(null)}
                onDrop={(e) => {
                  e.preventDefault();
                  const from = slides.findIndex((x) => x.id === dragId);
                  setDragId(null);
                  setOverId(null);
                  if (from >= 0) move(from, i);
                }}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={`card overflow-hidden transition-all ${
                  dragId === s.id ? "scale-[0.98] opacity-40" : ""
                } ${overId === s.id && dragId !== s.id ? "ring-2 ring-brand-500" : ""}`}
              >
                <div className="flex items-center justify-between gap-2 border-b border-cream-200 px-3 py-2">
                  <span className="flex cursor-grab items-center gap-2 text-[12px] font-bold text-ink-500 active:cursor-grabbing">
                    <span aria-hidden className="text-ink-300">⋮⋮</span>
                    <span className="num">الصورة {i + 1}</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => move(i, i - 1)}
                      disabled={i === 0 || pending}
                      title="تقديم"
                      aria-label={`تقديم الصورة ${i + 1}`}
                      className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-ink-900 disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, i + 1)}
                      disabled={i === slides.length - 1 || pending}
                      title="تأخير"
                      aria-label={`تأخير الصورة ${i + 1}`}
                      className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 hover:text-ink-900 disabled:opacity-30"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(s, i)}
                      disabled={pending}
                      title="حذف"
                      aria-label={`حذف الصورة ${i + 1}`}
                      className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
                    >
                      <IconTrash />
                    </button>
                  </span>
                </div>
                <div className="relative bg-cream-100" style={{ aspectRatio: aspect }}>
                  <Image
                    src={s.imageUrl}
                    alt={s.alt}
                    fill
                    draggable={false}
                    sizes="(min-width: 1024px) 300px, (min-width: 640px) 45vw, 90vw"
                    className="pointer-events-none object-cover"
                  />
                </div>
                <SlideDetails slide={s} />
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  );
}

/* ─────────────── وصف الصورة ورابطها ─────────────── */

function SlideDetails({ slide }: { slide: SlideRow }) {
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(
    updateSlideAction,
    null,
  );
  const input =
    "w-full rounded-lg border border-cream-300 bg-white px-3 py-2 text-[13px] text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

  return (
    <form action={action} className="space-y-2.5 p-3">
      <input type="hidden" name="id" value={slide.id} />
      <label className="block">
        <span className="mb-1 block text-[11.5px] font-bold text-ink-700">وصف الصورة</span>
        <input
          name="alt"
          defaultValue={slide.alt}
          placeholder="مثال: ملصق الوحدة الأولى"
          className={input}
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11.5px] font-bold text-ink-700">
          رابط عند النقر <span className="font-normal text-ink-300">(اختياري)</span>
        </span>
        <input
          name="linkUrl"
          dir="ltr"
          defaultValue={slide.linkUrl ?? ""}
          placeholder="/checkout/START  أو  https://…"
          className={`${input} text-left`}
        />
      </label>
      <div className="flex items-center justify-between gap-2">
        <span
          className={`text-[12px] font-bold ${state?.ok ? "text-emerald-700" : "text-red-600"}`}
          role="status"
        >
          {state && (state.ok ? <><IconCheck className="inline" /> {state.message}</> : state.message)}
        </span>
        <button
          type="submit"
          disabled={pending}
          className="font-ui h-8 rounded-lg bg-ink-900 px-3 text-[12.5px] font-bold text-white hover:bg-ink-800 disabled:opacity-60"
        >
          {pending ? "…" : "حفظ"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────── الرفع والمكتبة ─────────────── */

function Uploader({
  sliderId,
  library,
  onDone,
}: {
  sliderId: string;
  library: SiteImage[];
  onDone: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [over, setOver] = useState(false);

  /** ملف بعد ملف — انظر addSlideAction لسبب عدم إرسالها معًا */
  const upload = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith("image/"));
    if (!images.length) return;
    setErrors([]);
    setProgress({ done: 0, total: images.length });
    const failed: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const fd = new FormData();
      fd.append("file", images[i]);
      try {
        const res = await addSlideAction(sliderId, fd);
        if (!res.ok) failed.push(res.message);
      } catch {
        failed.push(`${images[i].name}: تعذّر الرفع — تحقّق من الاتصال`);
      }
      setProgress({ done: i + 1, total: images.length });
    }
    setErrors(failed);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    onDone();
  };

  const addFromLibrary = async (src: string, alt: string) => {
    const fd = new FormData();
    fd.append("pick", src);
    fd.append("alt", alt);
    setProgress({ done: 0, total: 1 });
    const res = await addSlideAction(sliderId, fd);
    setProgress(null);
    setErrors(res.ok ? [] : [res.message]);
    onDone();
  };

  const busy = progress !== null;

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          // سحب ملفات من الجهاز فقط، لا بطاقات الترتيب
          if (!e.dataTransfer.types.includes("Files")) return;
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setOver(false);
          void upload(Array.from(e.dataTransfer.files));
        }}
        className={`flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-5 py-7 text-center transition-colors ${
          over ? "border-brand-500 bg-brand-50" : "border-cream-300 bg-cream-50/60"
        }`}
      >
        <span className="grid size-11 place-items-center rounded-xl bg-white text-xl text-brand-600 ring-1 ring-cream-300">
          <IconUpload />
        </span>
        {busy ? (
          <p className="num text-[13.5px] font-bold text-brand-700">
            جارٍ الرفع… {progress.done} / {progress.total}
          </p>
        ) : (
          <p className="text-[13.5px] text-ink-700">
            اسحب الصور إلى هنا، أو
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="font-ui inline-flex h-10 items-center gap-2 rounded-xl bg-brand-500 px-4 text-[13.5px] font-bold text-ink-900 hover:bg-brand-400 disabled:opacity-60"
          >
            <IconPlus />
            اختر صورًا من جهازك
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowLibrary((v) => !v)}
            className="font-ui inline-flex h-10 items-center gap-2 rounded-xl border border-cream-300 bg-white px-4 text-[13.5px] font-bold text-ink-700 hover:border-brand-300 disabled:opacity-60"
          >
            {showLibrary ? "إخفاء صور الهوية" : "من صور الهوية الجاهزة"}
          </button>
        </div>
        <p className="text-[12px] text-ink-500">
          يمكنك اختيار عدّة صور معًا · JPG، PNG، WEBP · حتى ٨ ميغابايت للصورة
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          hidden
          onChange={(e) => void upload(Array.from(e.target.files ?? []))}
        />
      </div>

      {errors.length > 0 && (
        <Alert tone="error" title="لم تُرفع بعض الصور">
          <ul className="list-disc pr-5">
            {errors.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </Alert>
      )}

      {showLibrary && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {library.map((img) => (
            <button
              key={img.src}
              type="button"
              disabled={busy}
              onClick={() => void addFromLibrary(img.src, img.alt)}
              title={`إضافة: ${img.alt}`}
              className="group relative aspect-square overflow-hidden rounded-xl ring-1 ring-cream-300 hover:ring-2 hover:ring-brand-500 disabled:opacity-50"
            >
              <Image src={img.src} alt={img.alt} fill sizes="120px" className="object-cover" />
              <span className="absolute inset-x-0 bottom-0 bg-ink-900/70 px-1 py-0.5 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                + {img.alt}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
