"use client";

import Link from "next/link";
import { useState } from "react";
import type { Curriculum } from "@/lib/curriculum";
import { ProgressBar, Badge } from "@/components/ui";
import { Collapse } from "@/components/ui/Collapse";
import {
  IconCheckCircle,
  IconPlayCircle,
  IconCircle,
  IconLock,
  IconChevronDown,
  IconTarget,
} from "@/components/ui/icons";

/**
 * قائمة المنهج الجانبية داخل صفحة الدرس.
 * كل الحالات (مكتمل / حالي / مقفل) تأتي محسوبة من الخادم.
 */
export function LessonSidebar({
  curriculum,
  activeLessonId,
  activeModuleId,
}: {
  curriculum: Pick<Curriculum, "tracks" | "percent" | "completedLessons" | "totalLessons">;
  activeLessonId?: string;
  activeModuleId?: string;
}) {
  const [open, setOpen] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const t of curriculum.tracks)
      for (const m of t.modules) initial[m.id] = m.id === activeModuleId;
    return initial;
  });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-cream-200 px-4 py-4">
        <div className="flex items-center justify-between text-[13px]">
          <span className="font-bold text-ink-900">تقدّمك في البرنامج</span>
          <span className="num font-black text-brand-700">
            {curriculum.percent}%
          </span>
        </div>
        <ProgressBar value={curriculum.percent} size="sm" className="mt-2" />
        <p className="num mt-1.5 text-[11.5px] text-ink-500">
          {curriculum.completedLessons} من {curriculum.totalLessons} درسًا
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto">
        {curriculum.tracks.map((track) => (
          <div key={track.id}>
            <p className="flex items-center gap-2 bg-cream-100 px-4 py-2.5 text-[12.5px] font-black text-ink-800">
              <span
                className="size-2.5 rounded-full"
                style={{ background: track.color ?? "#00B7B5" }}
              />
              {track.title}
            </p>

            {track.modules.map((mod) => {
              const isOpen = open[mod.id];
              return (
                <div key={mod.id} className="border-b border-cream-200">
                  <button
                    type="button"
                    onClick={() =>
                      setOpen((s) => ({ ...s, [mod.id]: !s[mod.id] }))
                    }
                    aria-expanded={isOpen}
                    className="flex w-full items-start gap-2 px-4 py-3 text-right transition-colors hover:bg-cream-50"
                  >
                    <IconChevronDown
                      className={`mt-0.5 shrink-0 text-ink-300 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block text-[13px] leading-snug font-bold ${
                          mod.accessible ? "text-ink-900" : "text-ink-300"
                        }`}
                      >
                        {mod.title}
                      </span>
                      <span className="num mt-1 block text-[11px] text-ink-500">
                        {mod.completedLessons}/{mod.totalLessons}
                      </span>
                    </span>
                    {!mod.accessible && (
                      <IconLock className="mt-0.5 shrink-0 text-ink-300" />
                    )}
                    {mod.cleared && (
                      <IconCheckCircle className="mt-0.5 shrink-0 text-emerald-600" />
                    )}
                  </button>

                  <Collapse open={Boolean(isOpen)}>
                    <ul className="bg-cream-50/60 pb-1">
                      {mod.lessons.map((lesson, i) => {
                        const active = lesson.id === activeLessonId;
                        const icon =
                          lesson.state === "completed" ? (
                            <IconCheckCircle className="text-emerald-600" />
                          ) : lesson.accessible ? (
                            <IconPlayCircle className="text-brand-600" />
                          ) : (
                            <IconLock className="text-ink-300" />
                          );

                        const body = (
                          <>
                            <span className="num w-4 shrink-0 text-[11px] text-ink-300">
                              {i + 1}
                            </span>
                            <span className="shrink-0 text-[15px]">{icon}</span>
                            <span
                              className={`min-w-0 flex-1 text-[12.5px] leading-snug ${
                                active
                                  ? "font-black text-brand-800"
                                  : lesson.accessible
                                    ? "text-ink-700"
                                    : "text-ink-300"
                              }`}
                            >
                              {lesson.title}
                            </span>
                          </>
                        );

                        return (
                          <li key={lesson.id}>
                            {lesson.accessible ? (
                              <Link
                                href={`/learn/${lesson.id}`}
                                className={`flex items-start gap-2 py-2 pr-6 pl-3 transition-colors ${
                                  active
                                    ? "border-r-[3px] border-brand-500 bg-brand-50"
                                    : "hover:bg-white"
                                }`}
                              >
                                {body}
                              </Link>
                            ) : (
                              <span
                                className="flex cursor-not-allowed items-start gap-2 py-2 pr-6 pl-3"
                                title="أتمّ الدرس السابق لفتح هذا الدرس"
                              >
                                {body}
                              </span>
                            )}
                          </li>
                        );
                      })}

                      {mod.quiz && (
                        <li className="px-3 pt-1 pb-2">
                          {mod.quiz.accessible ? (
                            <Link
                              href={`/quiz/${mod.id}`}
                              className="flex items-center gap-2 rounded-lg bg-brand-500/10 px-3 py-2 text-[12.5px] font-bold text-brand-800 transition-colors hover:bg-brand-500/20"
                            >
                              <IconTarget />
                              اختبار الوحدة
                              {mod.quiz.passed && (
                                <Badge tone="green" className="mr-auto">
                                  <span className="num">{mod.quiz.bestScore}</span>%
                                </Badge>
                              )}
                            </Link>
                          ) : (
                            <span className="flex items-center gap-2 rounded-lg bg-cream-200/60 px-3 py-2 text-[12.5px] font-bold text-ink-300">
                              <IconLock />
                              اختبار الوحدة
                            </span>
                          )}
                        </li>
                      )}
                    </ul>
                  </Collapse>
                </div>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}
