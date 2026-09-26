"use client";

import { useActionState, useEffect, useRef, useTransition, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Alert } from "@/components/ui";
import type { AdminResult } from "@/app/(admin)/admin/actions";

/* ═════════════════════ حقول النماذج ═════════════════════ */

const inputClass =
  "w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-[14px] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  hint,
  required,
  dir,
  min,
  max,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string | number | null;
  placeholder?: string;
  hint?: string;
  required?: boolean;
  dir?: "ltr" | "rtl";
  min?: number;
  max?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
        {label}
      </span>
      <input
        name={name}
        type={type}
        dir={dir}
        min={min}
        max={max}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className={inputClass}
      />
      {hint && <span className="mt-1 block text-[12px] text-ink-500">{hint}</span>}
    </label>
  );
}

export function TextArea({
  label,
  name,
  defaultValue,
  placeholder,
  hint,
  rows = 4,
  mono,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  hint?: string;
  rows?: number;
  mono?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
        {label}
      </span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue ?? undefined}
        className={`${inputClass} resize-y leading-loose ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      />
      {hint && <span className="mt-1 block text-[12px] text-ink-500">{hint}</span>}
    </label>
  );
}

export function Select({
  label,
  name,
  defaultValue,
  options,
  hint,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  options: { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
        {label}
      </span>
      <select name={name} defaultValue={defaultValue} className={inputClass}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="mt-1 block text-[12px] text-ink-500">{hint}</span>}
    </label>
  );
}

export function Toggle({
  label,
  name,
  defaultChecked,
  hint,
}: {
  label: string;
  name: string;
  defaultChecked?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-cream-300 bg-white px-4 py-3 transition-colors hover:border-brand-200">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-0.5 size-4 shrink-0 accent-[#00b7b5]"
      />
      <span>
        <span className="block text-[13.5px] font-bold text-ink-900">{label}</span>
        {hint && (
          <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500">
            {hint}
          </span>
        )}
      </span>
    </label>
  );
}

export function SubmitButton({
  children = "حفظ",
  variant = "dark",
}: {
  children?: ReactNode;
  variant?: "dark" | "brand";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`font-ui inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[14px] font-bold transition-colors disabled:opacity-60 ${
        variant === "dark"
          ? "bg-ink-900 text-white hover:bg-ink-800"
          : "bg-brand-500 text-ink-900 hover:bg-brand-400"
      }`}
    >
      {pending ? "جارٍ الحفظ…" : children}
    </button>
  );
}

/* ═════════════════════ نموذج بحالة ═════════════════════ */

export function AdminForm({
  action,
  children,
  className = "space-y-4",
}: {
  action: (prev: AdminResult | null, fd: FormData) => Promise<AdminResult>;
  children: ReactNode;
  className?: string;
}) {
  const [state, formAction] = useActionState<AdminResult | null, FormData>(
    action,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const submitted = useRef<FormData | null>(null);

  /**
   * React 19 يعيد النموذج إلى قيمه الأصلية بعد كل إرسال. بعد الحفظ هذا
   * مقبول (القيم الأصلية صارت المحفوظة)، أمّا بعد خطأ فكان يمحو ما كتبه
   * المدير للتوّ ويُرجع القيم القديمة. نعيد ما أُرسل إلى الحقول بعد الخطأ.
   */
  useEffect(() => {
    const form = formRef.current;
    const data = submitted.current;
    if (!form || !data || !state || state.ok) return;
    for (const el of Array.from(form.elements)) {
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) continue;
      if (!el.name || el.type === "file" || el.type === "hidden") continue;
      if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio")) {
        el.checked = data.getAll(el.name).includes(el.value);
      } else {
        const v = data.get(el.name);
        if (typeof v === "string") el.value = v;
      }
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        submitted.current = fd;
        formAction(fd);
      }}
      className={className}
    >
      {state && (
        <Alert tone={state.ok ? "success" : "error"}>{state.message}</Alert>
      )}
      {children}
    </form>
  );
}

/* ═════════════════════ زر إجراء مباشر ═════════════════════ */

export function ActionButton({
  action,
  children,
  confirm,
  tone = "ghost",
  title,
}: {
  action: () => Promise<AdminResult>;
  children: ReactNode;
  confirm?: string;
  tone?: "ghost" | "danger" | "brand" | "outline";
  title?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const tones = {
    ghost: "text-ink-500 hover:bg-cream-100 hover:text-ink-900",
    danger: "text-red-600 hover:bg-red-50",
    brand: "bg-brand-500 text-ink-900 hover:bg-brand-400",
    outline: "border border-cream-300 text-ink-700 hover:border-brand-300",
  };

  return (
    <button
      type="button"
      title={title}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const res = await action();
          if (!res.ok) window.alert(res.message);
          router.refresh();
        });
      }}
      className={`font-ui inline-flex h-9 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-bold transition-colors disabled:opacity-50 ${tones[tone]}`}
    >
      {pending ? "…" : children}
    </button>
  );
}
