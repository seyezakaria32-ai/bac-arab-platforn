"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  completeLessonAction,
  reopenLessonAction,
  saveNoteAction,
  saveVideoPositionAction,
  trackLessonViewAction,
} from "@/app/(student)/actions";
import { Button, LinkButton, Alert, buttonClass } from "@/components/ui";
import {
  IconCheck,
  IconCheckCircle,
  IconArrowNext,
  IconArrowPrev,
  IconLock,
  IconPlayCircle,
  IconTarget,
} from "@/components/ui/icons";
import type { EmbedInfo } from "@/lib/video";

/* ═════════════════════════ مشغّل الفيديو ═════════════════════════ */

export function LessonPlayer({
  lessonId,
  embed,
  title,
  startSeconds = 0,
}: {
  lessonId: string;
  embed: EmbedInfo;
  title: string;
  /** آخر موضع توقّف عنده الطالب — يستأنف منه المشاهدة */
  startSeconds?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSaved = useRef(0);

  // تسجيل المشاهدة مرّة واحدة عند فتح الدرس
  useEffect(() => {
    void trackLessonViewAction(lessonId);
  }, [lessonId]);

  if (embed.kind === "iframe" && embed.src) {
    // يوتيوب وفيميو يقبلان الاستئناف عبر معامل في الرابط
    const src =
      startSeconds > 5 && embed.provider === "youtube"
        ? `${embed.src}&start=${Math.floor(startSeconds)}`
        : startSeconds > 5 && embed.provider === "vimeo"
          ? `${embed.src}#t=${Math.floor(startSeconds)}s`
          : embed.src;

    return (
      <div className="aspect-video w-full overflow-hidden rounded-2xl bg-ink-900">
        <iframe
          src={src}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
          allowFullScreen
          className="size-full border-0"
        />
      </div>
    );
  }

  if (embed.kind === "file" && embed.src) {
    return (
      <video
        ref={videoRef}
        controls
        controlsList="nodownload"
        className="aspect-video w-full rounded-2xl bg-ink-900"
        src={embed.src}
        onLoadedMetadata={() => {
          const el = videoRef.current;
          if (el && startSeconds > 5 && startSeconds < el.duration - 10) {
            el.currentTime = startSeconds;
          }
        }}
        onTimeUpdate={(e) => {
          // حفظ الموضع كل ١٥ ثانية فقط، تفاديًا لإغراق الخادم
          const t = e.currentTarget.currentTime;
          if (Math.abs(t - lastSaved.current) < 15) return;
          lastSaved.current = t;
          void saveVideoPositionAction(lessonId, t);
        }}
      />
    );
  }

  return (
    <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-ink-300/40 bg-ink-900 text-center text-brand-100">
      <IconPlayCircle className="text-4xl opacity-60" />
      <p className="font-display text-[15px] font-bold text-white">
        فيديو هذا الدرس لم يُرفع بعد
      </p>
      <p className="max-w-xs text-[12.5px] leading-relaxed text-brand-100/60">
        يمكنك الاطّلاع على المحتوى المكتوب والملفات المرفقة أدناه، وسيُضاف الفيديو
        من لوحة الإدارة.
      </p>
    </div>
  );
}

/* ═════════════════════════ أزرار التنقّل والإتمام ═════════════════════════ */

type NeighbourLesson = { id: string; title: string; accessible: boolean } | null;

export function LessonFooter({
  lessonId,
  isCompleted,
  prev,
  next,
}: {
  lessonId: string;
  isCompleted: boolean;
  prev: NeighbourLesson;
  next: NeighbourLesson;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [justDone, setJustDone] = useState<{
    quizModuleId: string | null;
    nextLessonId: string | null;
    courseComplete: boolean;
  } | null>(null);

  const complete = () => {
    setError(null);
    startTransition(async () => {
      const res = await completeLessonAction(lessonId);
      if (!res.ok) {
        setError(res.message ?? "تعذّر إتمام الدرس");
        return;
      }
      const data = res.data as {
        quizId: string | null;
        moduleId: string | null;
        nextLessonId: string | null;
        courseComplete: boolean;
      };
      setJustDone({
        quizModuleId: data.moduleId,
        nextLessonId: data.nextLessonId,
        courseComplete: data.courseComplete,
      });
      router.refresh();
    });
  };

  const reopen = () => {
    startTransition(async () => {
      await reopenLessonAction(lessonId);
      setJustDone(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}

      {justDone && (
        <Alert tone="success" title="أحسنت! أتممت هذا الدرس ✅">
          {justDone.courseComplete ? (
            <>
              لقد أتممت البرنامج كاملًا — يمكنك الآن استخراج إثبات الإتمام من
              صفحة حسابك.
              <div className="mt-3">
                <LinkButton href="/certificate" size="sm" variant="gold">
                  استخراج الشهادة
                </LinkButton>
              </div>
            </>
          ) : justDone.quizModuleId ? (
            <>
              أتممت جميع دروس هذه الوحدة. اجتز اختبار الوحدة لفتح الوحدة التالية.
              <div className="mt-3">
                <LinkButton href={`/quiz/${justDone.quizModuleId}`} size="sm">
                  <IconTarget />
                  ابدأ اختبار الوحدة
                </LinkButton>
              </div>
            </>
          ) : justDone.nextLessonId ? (
            <>
              فُتح لك الدرس التالي.
              <div className="mt-3">
                <LinkButton href={`/learn/${justDone.nextLessonId}`} size="sm">
                  الانتقال إلى الدرس التالي
                  <IconArrowNext />
                </LinkButton>
              </div>
            </>
          ) : (
            "تقدّمك محفوظ."
          )}
        </Alert>
      )}

      <div className="flex flex-col gap-3 border-t border-cream-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
        {/* الدرس السابق */}
        {prev?.accessible ? (
          <Link
            href={`/learn/${prev.id}`}
            className={buttonClass("outline", "md", "min-w-0")}
          >
            <IconArrowPrev className="shrink-0" />
            <span className="truncate">الدرس السابق</span>
          </Link>
        ) : (
          <span className="hidden sm:block sm:w-32" />
        )}

        {/* إتمام الدرس */}
        {isCompleted ? (
          <div className="flex flex-col items-center gap-1.5">
            <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-5 py-3 text-sm font-bold text-emerald-700 ring-1 ring-emerald-200">
              <IconCheckCircle className="text-lg" />
              درس مكتمل
            </span>
            <button
              type="button"
              onClick={reopen}
              disabled={pending}
              className="text-[11.5px] text-ink-300 underline-offset-2 hover:text-ink-500 hover:underline"
            >
              إلغاء الإتمام
            </button>
          </div>
        ) : (
          <Button onClick={complete} disabled={pending} size="lg">
            <IconCheck className="text-lg" />
            {pending ? "جارٍ الحفظ…" : "إتمام الدرس"}
          </Button>
        )}

        {/* الدرس التالي */}
        {next ? (
          next.accessible ? (
            <Link
              href={`/learn/${next.id}`}
              className={buttonClass("outline", "md", "min-w-0")}
            >
              <span className="truncate">الدرس التالي</span>
              <IconArrowNext className="shrink-0" />
            </Link>
          ) : (
            <span
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-cream-300 px-5 py-2.5 text-sm font-bold text-ink-300"
              title="أتمّ الدرس الحالي لفتح التالي"
            >
              <IconLock />
              الدرس التالي مقفل
            </span>
          )
        ) : (
          <span className="hidden sm:block sm:w-32" />
        )}
      </div>
    </div>
  );
}

/* ═════════════════════════ ملاحظات الطالب ═════════════════════════ */

export function LessonNotes({
  lessonId,
  initial,
}: {
  lessonId: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");

  // حفظ تلقائي بعد توقّف الكتابة
  useEffect(() => {
    if (value === initial) return;
    setStatus("saving");
    const t = setTimeout(async () => {
      await saveNoteAction(lessonId, value);
      setStatus("saved");
    }, 900);
    return () => clearTimeout(t);
  }, [value, initial, lessonId]);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-display text-[15px] font-bold text-ink-900">
          ملاحظاتي
        </h3>
        <span className="text-[11.5px] text-ink-300">
          {status === "saving"
            ? "جارٍ الحفظ…"
            : status === "saved"
              ? "حُفظت ✓"
              : "تُحفظ تلقائيًا"}
        </span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={5}
        placeholder="اكتب هنا خلاصتك من الدرس، أو النقاط التي تريد مراجعتها قبل الامتحان…"
        className="w-full resize-y rounded-xl border border-cream-300 bg-white px-4 py-3 text-[14px] leading-loose text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
    </div>
  );
}
