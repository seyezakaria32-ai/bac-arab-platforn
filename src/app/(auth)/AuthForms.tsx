"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { loginAction, registerAction, type AuthState } from "./actions";
import { Alert } from "@/components/ui";

/* ───────────────────────── حقول مشتركة ───────────────────────── */

function Field({
  label,
  name,
  type = "text",
  placeholder,
  required = true,
  autoComplete,
  hint,
  dir,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
        {label}
        {!required && (
          <span className="mr-1 font-normal text-ink-300">(اختياري)</span>
        )}
      </span>
      <input
        name={name}
        type={type}
        dir={dir}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-cream-300 bg-white px-4 py-3 text-[15px] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
      />
      {hint && <span className="mt-1 block text-[12px] text-ink-500">{hint}</span>}
    </label>
  );
}

function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 text-[15px] font-bold text-ink-900 shadow-sm transition-all hover:bg-brand-400 disabled:opacity-60"
    >
      {pending ? "جارٍ المعالجة…" : children}
    </button>
  );
}

/* ───────────────────────── تسجيل الدخول ───────────────────────── */

export function LoginForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(loginAction, null);

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && <Alert tone="error">{state.error}</Alert>}

      <Field
        label="البريد الإلكتروني"
        name="email"
        type="email"
        dir="ltr"
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="كلمة المرور"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="current-password"
      />

      <SubmitButton>تسجيل الدخول</SubmitButton>

      <p className="pt-1 text-center text-[13.5px] text-ink-500">
        ليس لديك حساب؟{" "}
        <Link
          href={next ? `/register?next=${encodeURIComponent(next)}` : "/register"}
          className="font-bold text-brand-700 hover:underline"
        >
          أنشئ حسابًا جديدًا
        </Link>
      </p>
    </form>
  );
}

/* ───────────────────────── إنشاء حساب ───────────────────────── */

export function RegisterForm({ next }: { next?: string }) {
  const [state, action] = useActionState<AuthState, FormData>(
    registerAction,
    null,
  );

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state?.error && <Alert tone="error">{state.error}</Alert>}

      <Field
        label="الاسم الكامل"
        name="name"
        placeholder="مثال: أمينة ديوب"
        autoComplete="name"
      />
      <Field
        label="البريد الإلكتروني"
        name="email"
        type="email"
        dir="ltr"
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="رقم الهاتف / واتساب"
        name="phone"
        type="tel"
        dir="ltr"
        required={false}
        placeholder="+221 77 000 00 00"
        autoComplete="tel"
      />
      <Field
        label="كلمة المرور"
        name="password"
        type="password"
        placeholder="••••••••"
        autoComplete="new-password"
        hint="٨ أحرف على الأقل."
      />

      <SubmitButton>إنشاء الحساب</SubmitButton>

      <p className="pt-1 text-center text-[13.5px] text-ink-500">
        لديك حساب بالفعل؟{" "}
        <Link
          href={next ? `/login?next=${encodeURIComponent(next)}` : "/login"}
          className="font-bold text-brand-700 hover:underline"
        >
          سجّل الدخول
        </Link>
      </p>
    </form>
  );
}
