"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveSiteImageAction } from "@/app/(admin)/admin/actions";
import type { AdminResult } from "@/app/(admin)/admin/actions";
import type { SiteImage } from "@/lib/settings";
import { Alert, Badge } from "@/components/ui";
import { IconUpload, IconCheck, IconPlus } from "@/components/ui/icons";

/**
 * نموذج استبدال صورة في الصفحة الرئيسية.
 * مصدران للصورة: رفع ملف من الجهاز، أو اختيار من صور الهوية الجاهزة.
 */
export function SiteImageForm({
  slot,
  current,
  library,
  aspect,
  withAlt = true,
  submitLabel = "حفظ الصورة",
}: {
  /** "hero" أو رقم الموضع في الشبكة أو "new" */
  slot: string;
  current?: SiteImage;
  library: SiteImage[];
  /** نسبة الإطار كما تظهر في الموقع */
  aspect: string;
  withAlt?: boolean;
  submitLabel?: string;
}) {
  const [state, action] = useActionState<AdminResult | null, FormData>(
    saveSiteImageAction,
    null,
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [pick, setPick] = useState("");
  const [preview, setPreview] = useState<string | null>(null);

  const shown = preview ?? (pick || current?.src);

  return (
    <form action={action} className="space-y-3.5">
      <input type="hidden" name="slot" value={slot} />
      <input type="hidden" name="pick" value={pick} />

      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}

      {/* معاينة */}
      <div
        className="relative overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-300"
        style={{ aspectRatio: aspect }}
      >
        {shown ? (
          <Image
            src={shown}
            alt={current?.alt ?? "معاينة"}
            fill
            sizes="240px"
            className="object-cover"
            unoptimized={shown.startsWith("blob:")}
          />
        ) : (
          <span className="absolute inset-0 grid place-items-center text-[12px] text-ink-300">
            لا توجد صورة
          </span>
        )}
        {(preview || pick) && (
          <Badge tone="green" className="absolute top-2 right-2">
            صورة جديدة
          </Badge>
        )}
      </div>

      {/* رفع ملف */}
      <label className="flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-dashed border-cream-300 bg-cream-50 px-3.5 py-3 transition-colors hover:border-brand-400 hover:bg-brand-50/40">
        <IconUpload className="shrink-0 text-lg text-brand-600" />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-ink-800">
            {fileName ?? "رفع صورة من جهازك"}
          </span>
          <span className="text-[11.5px] text-ink-500">
            JPG · PNG · WEBP — حتى ٨ ميغابايت
          </span>
        </span>
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          onChange={(e) => {
            const f = e.target.files?.[0];
            setFileName(f?.name ?? null);
            setPick("");
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />
      </label>

      {/* اختيار من صور الهوية */}
      <details className="rounded-xl border border-cream-300">
        <summary className="cursor-pointer px-3.5 py-2.5 text-[12.5px] font-bold text-ink-700 hover:text-brand-700">
          أو اختر من صور الهوية الجاهزة
        </summary>
        <div className="grid grid-cols-4 gap-2 border-t border-cream-200 p-3">
          {library.map((img) => {
            const active = pick === img.src;
            return (
              <button
                key={img.src}
                type="button"
                title={img.alt}
                onClick={() => {
                  setPick(active ? "" : img.src);
                  setPreview(null);
                  setFileName(null);
                }}
                className={`relative aspect-square overflow-hidden rounded-lg ring-2 transition-all ${
                  active
                    ? "ring-brand-500"
                    : "ring-transparent hover:ring-brand-200"
                }`}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                {active && (
                  <span className="absolute inset-0 grid place-items-center bg-brand-500/70 text-white">
                    <IconCheck />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </details>

      {withAlt && (
        <label className="block">
          <span className="mb-1 block text-[12.5px] font-bold text-ink-800">
            وصف الصورة
          </span>
          <input
            name="alt"
            defaultValue={current?.alt ?? ""}
            placeholder="مثال: الفصل الأول — التاريخ"
            className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2 text-[13px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <span className="mt-1 block text-[11.5px] text-ink-500">
            يُقرأ على قارئات الشاشة ويظهر إن تعذّر تحميل الصورة.
          </span>
        </label>
      )}

      <Submit label={submitLabel} isNew={slot === "new"} />
    </form>
  );
}

function Submit({ label, isNew }: { label: string; isNew: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl text-[13.5px] font-bold transition-colors disabled:opacity-60 ${
        isNew
          ? "bg-brand-500 text-ink-900 hover:bg-brand-400"
          : "bg-ink-900 text-white hover:bg-ink-800"
      }`}
    >
      {pending ? "جارٍ الحفظ…" : (
        <>
          {isNew ? <IconPlus /> : <IconCheck />}
          {label}
        </>
      )}
    </button>
  );
}
