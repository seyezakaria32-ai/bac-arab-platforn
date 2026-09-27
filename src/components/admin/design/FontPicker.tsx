"use client";

import { useActionState, useState } from "react";
import { saveFontsAction } from "@/app/(admin)/admin/design/actions";
import type { AdminResult } from "@/app/(admin)/admin/actions";
import { DEFAULT_FONTS, FONT_OPTIONS, FONT_ROLES, fontStack, type FontChoice, type FontKey } from "@/lib/fonts";
import { Alert } from "@/components/ui";

/** حجم نصّ المعاينة لكل دور — قريب ممّا يظهر في الموقع */
const PREVIEW_SIZE: Record<string, string> = {
  body: "text-[15px] font-normal leading-loose",
  heading: "text-2xl font-black",
  display: "text-[17px] font-bold",
  ui: "text-[15px] font-bold",
};

/**
 * خطّ لكل دور، مع معاينة حيّة بالخطّ نفسه قبل الحفظ. الخطّ لا يُحمَّل في
 * المتصفّح إلا حين يظهر في المعاينة، فتصفّح القائمة لا يُثقل الصفحة.
 */
export function FontPicker({ current }: { current: FontChoice }) {
  const [choice, setChoice] = useState<FontChoice>(current);
  const [state, action, pending] = useActionState<AdminResult | null, FormData>(saveFontsAction, null);
  const [gallery, setGallery] = useState(false);

  return (
    <form action={action} className="space-y-5">
      {state && <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>}

      <div className="grid gap-4 md:grid-cols-2">
        {FONT_ROLES.map((role) => (
          <div key={role.key} className="rounded-2xl border border-cream-300 bg-white p-4">
            <label className="block">
              <span className="block text-[13.5px] font-black text-ink-900">{role.label}</span>
              <span className="mb-2 block text-[12px] text-ink-500">{role.hint}</span>
              <select
                name={role.key}
                value={choice[role.key]}
                onChange={(e) => setChoice({ ...choice, [role.key]: e.target.value as FontKey })}
                className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-[14px] text-ink-900"
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.key} value={f.key}>
                    {f.label} — {f.note}
                  </option>
                ))}
              </select>
            </label>
            <p
              className={`mt-3 rounded-xl bg-cream-50 px-3 py-3 text-ink-900 ${PREVIEW_SIZE[role.key]}`}
              style={{ fontFamily: fontStack(choice[role.key]) }}
            >
              {role.sample}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="font-ui inline-flex h-11 items-center rounded-xl bg-ink-900 px-6 text-[14px] font-bold text-white hover:bg-ink-800 disabled:opacity-60"
        >
          {pending ? "جارٍ الحفظ…" : "حفظ الخطوط"}
        </button>
        <button
          type="button"
          onClick={() => setChoice(DEFAULT_FONTS)}
          className="font-ui h-10 rounded-xl px-4 text-[13px] font-bold text-ink-500 hover:bg-cream-100"
        >
          الخطوط الأصلية
        </button>
        <button
          type="button"
          onClick={() => setGallery((v) => !v)}
          className="font-ui h-10 rounded-xl border border-cream-300 bg-white px-4 text-[13px] font-bold text-ink-700 hover:border-brand-300"
        >
          {gallery ? "إخفاء معرض الخطوط" : "عرض كل الخطوط للمقارنة"}
        </button>
      </div>

      {gallery && (
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {FONT_OPTIONS.map((f) => (
            <li key={f.key} className="rounded-xl border border-cream-300 bg-white px-4 py-3">
              <p className="text-[18px] font-bold text-ink-900" style={{ fontFamily: fontStack(f.key) }}>
                منهجية الإجابة في التاريخ
              </p>
              <p className="text-[13.5px] text-ink-700" style={{ fontFamily: fontStack(f.key) }}>
                ابدأ البرنامج الآن · 7,500 فرنك
              </p>
              <p className="mt-1 text-[11.5px] text-ink-500" dir="ltr">
                {f.label}
              </p>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
