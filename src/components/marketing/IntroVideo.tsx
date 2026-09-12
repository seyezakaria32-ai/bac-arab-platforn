"use client";

import Image from "next/image";
import { useState } from "react";
import type { EmbedInfo } from "@/lib/video";
import { IconPlay } from "@/components/ui/icons";

/**
 * فيديو التعريف في الصفحة الرئيسية.
 * لا يُحمَّل مشغّل يوتيوب إلا عند الضغط (واجهة خفيفة: غلاف + زرّ تشغيل)،
 * فلا تتأثّر سرعة الصفحة الرئيسية بثقل المشغّل.
 */
export function IntroVideo({
  embed,
  poster,
  title,
}: {
  embed: EmbedInfo;
  poster: string;
  title: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (embed.kind === "none" || !embed.src) return null;

  if (playing) {
    if (embed.kind === "file") {
      return (
        <video
          src={embed.src}
          poster={poster}
          controls
          autoPlay
          playsInline
          controlsList="nodownload"
          className="aspect-video w-full bg-ink-900"
        />
      );
    }
    const autoplaySrc = `${embed.src}${embed.src.includes("?") ? "&" : "?"}autoplay=1`;
    return (
      <iframe
        src={autoplaySrc}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full border-0 bg-ink-900"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`تشغيل الفيديو: ${title}`}
      className="group relative block aspect-video w-full overflow-hidden bg-ink-900"
    >
      <Image
        src={poster}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 900px"
        className="object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.03]"
      />
      <span className="absolute inset-0 bg-gradient-to-t from-ink-900/80 via-ink-900/20 to-transparent" />

      <span className="absolute inset-0 grid place-items-center">
        <span className="relative grid size-20 place-items-center rounded-full bg-brand-500 text-3xl text-ink-900 shadow-2xl transition-transform duration-300 group-hover:scale-110 sm:size-24">
          <span className="absolute inset-0 animate-ping rounded-full bg-brand-400/40" />
          <IconPlay className="relative translate-x-[-2px]" />
        </span>
      </span>

      <span className="absolute inset-x-0 bottom-0 p-5 text-right sm:p-7">
        <span className="block font-display text-lg font-black text-white sm:text-2xl">
          {title}
        </span>
        <span className="mt-1 block text-[13px] text-white/75">
          اضغط للمشاهدة
        </span>
      </span>
    </button>
  );
}
