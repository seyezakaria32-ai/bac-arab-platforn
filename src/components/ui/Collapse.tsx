/**
 * محتوى يُطوى ويُفتح بحركة ارتفاع سلسة.
 *
 * لماذا لا `{open && …}`: المحتوى الذي يُضاف فجأة يقفز إلى ارتفاعه الكامل في
 * إطار واحد. هنا يبقى مرسومًا دائمًا، ويتحرّك ارتفاعه بين 0 وحجمه الطبيعي عبر
 * grid-template-rows (0fr ↔ 1fr) — الطريقة الوحيدة في CSS لتحريك ارتفاع
 * «تلقائي» دون قياسه بـ JavaScript، فتبقى سلسة على الهواتف الضعيفة.
 *
 * inert حين يُطوى: لا يصل إليه التنقّل بلوحة المفاتيح ولا قارئ الشاشة.
 */
export function Collapse({
  open,
  children,
  className = "",
}: {
  open: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows,opacity] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
      }`}
      inert={!open}
    >
      <div className={`min-h-0 overflow-hidden ${className}`}>{children}</div>
    </div>
  );
}
