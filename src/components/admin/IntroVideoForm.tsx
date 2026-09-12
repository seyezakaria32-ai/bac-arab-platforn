"use client";

import Image from "next/image";
import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveIntroVideoAction } from "@/app/(admin)/admin/actions";
import type { AdminResult } from "@/app/(admin)/admin/actions";
import type { IntroVideo as IntroVideoSettings } from "@/lib/settings";
import { toEmbed } from "@/lib/video";
import { Alert, Badge } from "@/components/ui";
import { IconUpload, IconCheck, IconTrash } from "@/components/ui/icons";
import { IntroVideo } from "@/components/marketing/IntroVideo";

/**
 * إعداد فيديو التعريف: رابط يوتيوب/فيميو، أو رفع ملف MP4 مع شريط تقدّم،
 * ومعاينة حيّة مطابقة لما يراه الزائر.
 */
export function IntroVideoForm({
  current,
  fallbackPoster,
}: {
  current: IntroVideoSettings;
  fallbackPoster: string;
}) {
  const [state, action] = useActionState<AdminResult | null, FormData>(
    saveIntroVideoAction,
    null,
  );
  const [url, setUrl] = useState(current.url);
  const [title, setTitle] = useState(current.title);
  const [progress, setProgress] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [keepPoster, setKeepPoster] = useState(Boolean(current.poster));
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const embed = toEmbed(url);
  const poster =
    posterPreview ?? (keepPoster && current.poster ? current.poster : fallbackPoster);
  const uploading = progress !== null;

  function uploadVideo(file: File) {
    setUploadError(null);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhrRef.current = xhr;
    xhr.open("POST", "/api/admin/upload-video");
    xhr.setRequestHeader("content-type", file.type);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      setProgress(null);
      try {
        const res = JSON.parse(xhr.responseText) as { url?: string; error?: string };
        if (xhr.status === 200 && res.url) setUrl(res.url);
        else setUploadError(res.error ?? "تعذّر رفع الفيديو");
      } catch {
        setUploadError("تعذّر رفع الفيديو");
      }
    };
    xhr.onerror = () => {
      setProgress(null);
      setUploadError("انقطع الاتصال أثناء الرفع");
    };
    xhr.send(file);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
      {/* ── الإعدادات ── */}
      <form action={action} className="space-y-4">
        <input type="hidden" name="keepPoster" value={keepPoster ? "1" : "0"} />

        {state && (
          <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
        )}

        <label className="block">
          <span className="mb-1 block text-[13px] font-bold text-ink-800">
            رابط الفيديو
          </span>
          <input
            name="url"
            dir="ltr"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=…"
            className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-left text-[13px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
          <span className="mt-1 block text-[11.5px] leading-relaxed text-ink-500">
            يوتيوب أو فيميو (مُستحسَن: أسرع للزوّار ولا يستهلك خادمك) — أو ارفع ملفًا
            أدناه. اترك الحقل فارغًا لإخفاء القسم.
          </span>
        </label>

        {/* رفع ملف */}
        <div>
          <label
            className={`flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-dashed px-3.5 py-3 transition-colors ${
              uploading
                ? "pointer-events-none border-brand-300 bg-brand-50/50"
                : "border-cream-300 bg-cream-50 hover:border-brand-400 hover:bg-brand-50/40"
            }`}
          >
            <IconUpload className="shrink-0 text-lg text-brand-600" />
            <span className="min-w-0 flex-1">
              <span className="block text-[13px] font-bold text-ink-800">
                {uploading ? "جارٍ رفع الفيديو…" : "أو ارفع فيديو من جهازك"}
              </span>
              <span className="text-[11.5px] text-ink-500">
                MP4 أو WEBM — حتى ٣٠٠ ميغابايت
              </span>
            </span>
            <input
              type="file"
              accept="video/mp4,video/webm"
              className="sr-only"
              disabled={uploading}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadVideo(f);
                e.target.value = "";
              }}
            />
          </label>

          {uploading && (
            <div className="mt-2 flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream-200">
                <div
                  className="h-full rounded-full bg-brand-500 transition-[width]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="num w-10 text-left text-[12px] font-bold text-ink-700">
                {progress}%
              </span>
              <button
                type="button"
                onClick={() => {
                  xhrRef.current?.abort();
                  setProgress(null);
                }}
                className="text-[12px] font-bold text-red-600 hover:underline"
              >
                إلغاء
              </button>
            </div>
          )}
          {uploadError && (
            <p className="mt-2 text-[12.5px] font-bold text-red-600">{uploadError}</p>
          )}
        </div>

        <label className="block">
          <span className="mb-1 block text-[13px] font-bold text-ink-800">
            عنوان القسم
          </span>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-[13.5px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-[13px] font-bold text-ink-800">
            وصف قصير
          </span>
          <textarea
            name="description"
            rows={2}
            defaultValue={current.description}
            className="w-full rounded-xl border border-cream-300 bg-white px-3 py-2.5 text-[13.5px] leading-relaxed outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        {/* صورة الغلاف */}
        <div>
          <span className="mb-1 block text-[13px] font-bold text-ink-800">
            صورة الغلاف قبل التشغيل
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-cream-300 bg-white px-3 py-2 text-[12.5px] font-bold text-ink-700 hover:border-brand-400">
              <IconUpload />
              اختيار صورة
              <input
                type="file"
                name="posterFile"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  setPosterPreview(f ? URL.createObjectURL(f) : null);
                }}
              />
            </label>
            {(keepPoster && current.poster) || posterPreview ? (
              <button
                type="button"
                onClick={() => {
                  setKeepPoster(false);
                  setPosterPreview(null);
                }}
                className="inline-flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12px] font-bold text-red-600 hover:bg-red-50"
              >
                <IconTrash />
                الرجوع إلى صورة الأستاذ
              </button>
            ) : (
              <span className="text-[11.5px] text-ink-500">
                حاليًا: صورة الأستاذ
              </span>
            )}
          </div>
        </div>

        <SaveButton disabled={uploading} />
      </form>

      {/* ── المعاينة ── */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="text-[13px] font-bold text-ink-800">
            معاينة كما يراها الزائر
          </span>
          {embed.kind === "none" ? (
            <Badge tone="slate">القسم مخفي</Badge>
          ) : (
            <Badge tone="green">
              {embed.provider === "direct" ? "ملف مرفوع" : embed.provider}
            </Badge>
          )}
        </div>
        <div className="overflow-hidden rounded-2xl ring-1 ring-cream-300">
          {embed.kind === "none" ? (
            <div className="relative aspect-video bg-cream-100">
              <Image
                src={poster}
                alt=""
                fill
                sizes="500px"
                className="object-cover opacity-30 grayscale"
                unoptimized={poster.startsWith("blob:")}
              />
              <span className="absolute inset-0 grid place-items-center px-6 text-center text-[13px] font-bold text-ink-500">
                أضف رابطًا أو ارفع فيديو ليظهر القسم في الصفحة الرئيسية
              </span>
            </div>
          ) : (
            <IntroVideo
              key={`${url}|${poster}`}
              embed={embed}
              poster={poster}
              title={title}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SaveButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-ink-900 text-[14px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? (
        "جارٍ الحفظ…"
      ) : (
        <>
          <IconCheck />
          حفظ فيديو التعريف
        </>
      )}
    </button>
  );
}
