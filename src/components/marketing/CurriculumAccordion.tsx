"use client";

import { useState } from "react";
import { Badge } from "@/components/ui";
import { Collapse } from "@/components/ui/Collapse";
import {
  IconChevronDown,
  IconPlayCircle,
  IconLock,
  IconClock,
  IconSparkle,
} from "@/components/ui/icons";

export type PublicLesson = {
  id: string;
  title: string;
  durationMinutes: number;
  isFreePreview: boolean;
  requiredPlan: string;
};

export type PublicModule = {
  id: string;
  title: string;
  description: string | null;
  lessons: PublicLesson[];
};

export type PublicTrack = {
  id: string;
  title: string;
  description: string | null;
  color: string | null;
  modules: PublicModule[];
};

/** رسم العلامة المائية المناسب لكل مادة */
function watermarkFor(trackTitle: string) {
  return /جغراف/.test(trackTitle)
    ? "/brand/watermark-geography.svg"
    : "/brand/watermark-history.svg";
}

export function CurriculumAccordion({ tracks }: { tracks: PublicTrack[] }) {
  // الوحدة الأولى من المسار الأول مفتوحة افتراضيًا.
  // عدّة وحدات يمكن فتحها معًا: إغلاق وحدة تلقائيًا عند فتح أخرى كان يطوي
  // محتوى فوق موضع النقر، فتقفز الصفحة كلّها إلى الأعلى تحت إصبع الزائر.
  const [open, setOpen] = useState<Set<string>>(
    () => new Set(tracks[0]?.modules[0] ? [tracks[0].modules[0].id] : []),
  );
  const toggle = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-10">
      {tracks.map((track) => {
        const lessonCount = track.modules.reduce(
          (n, m) => n + m.lessons.length,
          0,
        );
        const minutes = track.modules.reduce(
          (n, m) => n + m.lessons.reduce((s, l) => s + l.durationMinutes, 0),
          0,
        );

        return (
          <section key={track.id}>
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span
                className="size-3 rounded-full"
                style={{ background: track.color ?? "#00B7B5" }}
                aria-hidden
              />
              <h3 className="font-display text-xl font-black text-ink-900 sm:text-2xl">
                {track.title}
              </h3>
              <span className="text-sm text-ink-500">
                <span className="num">{track.modules.length}</span> وحدات ·{" "}
                <span className="num">{lessonCount}</span> درسًا ·{" "}
                <span className="num">
                  {Math.round(minutes / 60)}
                </span>{" "}
                ساعة تقريبًا
              </span>
            </div>

            <div className="space-y-3">
              {track.modules.map((mod) => {
                const isOpen = open.has(mod.id);
                const modMinutes = mod.lessons.reduce(
                  (s, l) => s + l.durationMinutes,
                  0,
                );

                return (
                  <div
                    key={mod.id}
                    className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
                      isOpen ? "border-brand-300" : "border-cream-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggle(mod.id)}
                      aria-expanded={isOpen}
                      className="flex w-full items-center gap-3 px-4 py-4 text-right transition-colors hover:bg-cream-50 sm:px-5"
                    >
                      <IconChevronDown
                        className={`shrink-0 text-lg text-ink-500 transition-transform duration-300 ${
                          isOpen ? "rotate-180" : ""
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block font-display text-[15px] font-bold text-ink-900 sm:text-base">
                          {mod.title}
                        </span>
                        {mod.description && (
                          <span className="mt-1 block text-[13px] leading-relaxed text-ink-500">
                            {mod.description}
                          </span>
                        )}
                      </span>
                      <span className="hidden shrink-0 text-xs font-bold text-ink-500 sm:block">
                        <span className="num">{mod.lessons.length}</span> دروس ·{" "}
                        <span className="num">{modMinutes}</span> د
                      </span>
                    </button>

                    <Collapse open={isOpen}>
                      <ol
                        className="lesson-watermark border-t border-cream-200 bg-cream-50/50"
                        style={{ ["--wm" as string]: `url(${watermarkFor(track.title)})` }}
                      >
                        {mod.lessons.map((lesson, i) => (
                          <li
                            key={lesson.id}
                            className="flex items-center gap-3 border-b border-cream-200 px-4 py-3 last:border-0 sm:px-5"
                          >
                            <span className="num grid size-7 shrink-0 place-items-center rounded-lg bg-white text-[11px] font-bold text-ink-500 ring-1 ring-cream-300">
                              {i + 1}
                            </span>
                            {lesson.isFreePreview ? (
                              <IconPlayCircle className="shrink-0 text-lg text-brand-500" />
                            ) : (
                              <IconLock className="shrink-0 text-base text-ink-300" />
                            )}
                            <span className="min-w-0 flex-1 text-[14px] leading-snug text-ink-800">
                              {lesson.title}
                            </span>
                            {lesson.requiredPlan === "premium" && (
                              <Badge tone="gold" className="shrink-0">
                                <IconSparkle className="text-[10px]" />
                                PREMIUM
                              </Badge>
                            )}
                            {lesson.isFreePreview && (
                              <Badge tone="green" className="shrink-0">
                                معاينة مجانية
                              </Badge>
                            )}
                            <span className="hidden shrink-0 items-center gap-1 text-xs text-ink-500 sm:flex">
                              <IconClock />
                              <span className="num">{lesson.durationMinutes}</span> د
                            </span>
                          </li>
                        ))}
                      </ol>
                    </Collapse>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
