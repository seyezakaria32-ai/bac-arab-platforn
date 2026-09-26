import type { CSSProperties } from "react";

/*
 * في ملف مستقلّ لا في ScrollReveal.tsx: الدوالّ المصدَّرة من ملف "use client"
 * تصير مراجع للمتصفّح، فلا يمكن استدعاؤها من صفحة تُرسَم على الخادم.
 */

/** خصائص عنصر يظهر عند التمرير؛ index يؤخّر عناصر الشبكة واحدًا تلو الآخر */
export function reveal(
  variant: "up" | "zoom" | "start" | "end" = "up",
  index = 0,
): { "data-reveal": string; style?: CSSProperties } {
  return index
    ? {
        "data-reveal": variant,
        style: { "--reveal-delay": `${Math.min(index, 6) * 90}ms` } as CSSProperties,
      }
    : { "data-reveal": variant };
}
