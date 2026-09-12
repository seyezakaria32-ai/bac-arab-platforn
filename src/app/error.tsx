"use client";

import Link from "next/link";
import { useEffect } from "react";
import { buttonClass } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-5 text-center">
      <span className="grid size-14 place-items-center rounded-2xl bg-red-50 text-2xl text-red-600">
        !
      </span>
      <h1 className="mt-5 font-display text-xl font-black text-ink-900">
        حدث خطأ غير متوقّع
      </h1>
      <p className="mt-2 max-w-sm text-[14px] leading-loose text-ink-500">
        اعتذارًا عن الإزعاج. جرّب إعادة المحاولة، وإن تكرّر الخطأ تواصل مع
        الإدارة.
      </p>
      {error.digest && (
        <p className="num mt-2 text-[12px] text-ink-300">
          رمز الخطأ: {error.digest}
        </p>
      )}
      <div className="mt-7 flex flex-col gap-2 sm:flex-row">
        <button onClick={reset} className={buttonClass("primary")}>
          إعادة المحاولة
        </button>
        <Link href="/" className={buttonClass("outline")}>
          الصفحة الرئيسية
        </Link>
      </div>
    </div>
  );
}
