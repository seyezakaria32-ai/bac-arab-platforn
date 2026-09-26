import Link from "next/link";
import type { SliderCta } from "@/lib/sliders";
import { IconArrowNext } from "@/components/ui/icons";

/** نجمة رباعية صغيرة تتلألأ حول الزرّ */
function Spark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`cta-spark ${className}`}>
      <path d="M12 0c.6 5.6 3.4 9.2 12 12-8.6 2.8-11.4 6.4-12 12-.6-5.6-3.4-9.2-12-12C8.6 9.2 11.4 5.6 12 0Z" fill="currentColor" />
    </svg>
  );
}

/**
 * زرّ دعوة لافت تحت العارض. التأثيرات كلّها CSS (انظر .cta في globals.css):
 * إطار متلألئ يدور، لمعة تعبر الزرّ، هالتان تتّسعان حوله بالتناوب، نجوم
 * صغيرة تتلألأ، وسهم ينبض نحو اتجاه القراءة. بلا JavaScript — لا عبء على
 * الهواتف — وكلّها تتوقّف لمن فعّل «تقليل الحركة».
 */
export function CtaButton({
  cta,
  className = "mt-8",
  align = "center",
  dark = false,
}: {
  cta: SliderCta;
  /** المسافة حول الزرّ — تختلف تحت عارض عنها في موضع مستقلّ */
  className?: string;
  /** start: بمحاذاة بداية السطر (يمين الصفحة العربية)، كما في الواجهة الأولى */
  align?: "center" | "start";
  /** خلفية الموضع داكنة: السطر تحت الزرّ يُلوَّن بما يُقرأ عليها */
  dark?: boolean;
}) {
  const external = /^https?:\/\//i.test(cta.href);
  const content = (
    <>
      <span className="cta-shine" aria-hidden />
      <span className="relative">{cta.label}</span>
      <IconArrowNext className="cta-arrow relative shrink-0 text-xl" />
    </>
  );

  return (
    <div
      className={`flex flex-col gap-3 ${
        align === "start" ? "items-start text-start" : "items-center text-center"
      } ${className}`}
    >
      <div className="cta" data-tone={cta.tone}>
        <Spark className="-top-3 -left-3 size-4" />
        <Spark className="-right-4 -bottom-2.5 size-3 [animation-delay:1.1s]" />
        <Spark className="top-1/3 -right-6 size-2.5 [animation-delay:.55s]" />
        {external ? (
          <a href={cta.href} target="_blank" rel="noopener noreferrer" className="cta-btn">
            {content}
          </a>
        ) : (
          <Link href={cta.href} className="cta-btn">
            {content}
          </Link>
        )}
      </div>
      {cta.note && (
        <p
          className={`flex items-center gap-2 text-[13px] font-bold ${
            dark ? "text-brand-100/85" : "text-ink-500"
          }`}
        >
          <span
            className={`size-1.5 shrink-0 animate-pulse rounded-full ${dark ? "bg-brand-300" : "bg-brand-500"}`}
            aria-hidden
          />
          {cta.note}
        </p>
      )}
    </div>
  );
}
