import { Fragment } from "react";
import type { Plan } from "@prisma/client";
import type { PublicTrack } from "@/components/marketing/CurriculumAccordion";
import type { BlocksByPlacement } from "@/lib/blocks";
import type { IntroVideo } from "@/lib/settings";
import type { EmbedInfo } from "@/lib/video";
import type { Surface } from "@/lib/sections/registry";
import { IconSparkle } from "@/components/ui/icons";
import { reveal } from "@/lib/reveal";

/** ما تحتاجه الأقسام من خارجها: أرقام البرنامج، الدروس، الباقات، الفيديو، والعارضات والأزرار */
export type SectionContext = {
  counts: { lessons: number; modules: number; hours: number };
  tracks: PublicTrack[];
  plans: Plan[];
  intro: IntroVideo;
  introEmbed: EmbedInfo;
  blocks: BlocksByPlacement;
  /** صورة بطاقة الأستاذ — غلاف احتياطي للفيديو */
  heroImage: string;
};

/* ─────────────── قراءة القيم ─────────────── */

export const str = (v: unknown) => (typeof v === "string" ? v : "");
export const list = (v: unknown): Record<string, unknown>[] =>
  Array.isArray(v) ? v.filter((x): x is Record<string, unknown> => !!x && typeof x === "object") : [];

/* ─────────────── النصّ المنسّق ─────────────── */

const TOKEN = /(\*\*[^*\n]+\*\*|\{lessons\}|\{modules\}|\{hours\}|\n)/g;

/**
 * نصّ يكتبه المدير: **كلمة** بخطّ عريض، وسطر جديد، و{lessons} و{modules}
 * و{hours} تُستبدل بأرقام البرنامج الحالية. لا HTML — React يهرّب الباقي،
 * فلا يمكن أن يُحقن في الصفحة كود.
 */
export function RichText({
  text,
  counts,
  strongClassName,
}: {
  text: string;
  counts?: SectionContext["counts"];
  strongClassName?: string;
}) {
  const parts = text.split(TOKEN);
  return (
    <>
      {parts.map((p, i) => {
        if (!p) return null;
        if (p === "\n") return <br key={i} />;
        if (p.length > 4 && p.startsWith("**") && p.endsWith("**")) {
          return (
            <strong key={i} className={strongClassName}>
              {p.slice(2, -2)}
            </strong>
          );
        }
        if (counts && p === "{lessons}") return <span key={i} className="num">{counts.lessons}</span>;
        if (counts && p === "{modules}") return <span key={i} className="num">{counts.modules}</span>;
        if (counts && p === "{hours}") return <span key={i} className="num">{counts.hours}</span>;
        return <Fragment key={i}>{p}</Fragment>;
      })}
    </>
  );
}

/* ─────────────── عنوان القسم ─────────────── */

export function SectionTitle({
  eyebrow,
  title,
  description,
  align = "center",
  light = false,
}: {
  eyebrow?: string;
  title?: string;
  description?: string;
  align?: "center" | "start";
  /** على خلفية الهوية الداكنة */
  light?: boolean;
}) {
  if (!eyebrow && !title && !description) return null;
  return (
    <div {...reveal()} className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      {eyebrow && (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-bold ring-1 ${
            light ? "bg-white/10 text-brand-100 ring-white/20" : "bg-brand-50 text-brand-700 ring-brand-200"
          }`}
        >
          <IconSparkle className="text-[11px]" />
          {eyebrow}
        </span>
      )}
      {title && (
        <h2
          className={`${eyebrow ? "mt-3" : ""} font-display text-2xl font-black ${
            light ? "text-white" : "text-ink-900"
          } sm:text-3xl md:text-[2.1rem]`}
        >
          {title}
        </h2>
      )}
      {description && (
        <p className={`mt-3 text-[15px] leading-loose ${light ? "text-brand-50/80" : "text-ink-500"}`}>
          <RichText text={description} />
        </p>
      )}
    </div>
  );
}

/* ─────────────── خلفية الأقسام الجديدة ─────────────── */

export function Band({
  id,
  surface,
  children,
}: {
  id: string;
  surface: Surface;
  children: React.ReactNode;
}) {
  const bg =
    surface === "white" ? "bg-white" : surface === "brand" ? "brand-gradient brand-texture text-white" : "";
  return (
    <section id={id} className={`scroll-mt-24 py-20 md:py-24 ${bg}`}>
      <div className="container-page">{children}</div>
    </section>
  );
}

/* ─────────────── موجة الهوية البصرية ─────────────── */

export function Wave({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 1440 90" preserveAspectRatio="none" className={className} aria-hidden>
      <path
        d="M0 48c180 40 320 40 520 14C760 30 900 0 1120 6c130 4 240 18 320 30v54H0V48Z"
        fill="currentColor"
      />
    </svg>
  );
}
