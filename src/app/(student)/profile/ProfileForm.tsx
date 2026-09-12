"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  updateProfileAction,
  changePasswordAction,
  type ProfileState,
} from "./actions";
import { Alert } from "@/components/ui";

function Input({
  label,
  name,
  type = "text",
  defaultValue,
  dir,
  disabled,
  hint,
  required = true,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  dir?: "ltr" | "rtl";
  disabled?: boolean;
  hint?: string;
  required?: boolean;
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
        required={required}
        disabled={disabled}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-cream-300 bg-white px-4 py-2.5 text-[14.5px] text-ink-900 outline-none transition-colors focus:border-brand-500 focus:ring-2 focus:ring-brand-100 disabled:bg-cream-100 disabled:text-ink-300"
      />
      {hint && <span className="mt-1 block text-[12px] text-ink-500">{hint}</span>}
    </label>
  );
}

function Save({ label = "حفظ التغييرات" }: { label?: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-11 items-center justify-center rounded-xl bg-ink-900 px-5 text-[14px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-60"
    >
      {pending ? "جارٍ الحفظ…" : label}
    </button>
  );
}

export function ProfileForm({
  defaults,
}: {
  defaults: { name: string; email: string; phone: string };
}) {
  const [profileState, profileAction] = useActionState<ProfileState, FormData>(
    updateProfileAction,
    null,
  );
  const [pwState, pwAction] = useActionState<ProfileState, FormData>(
    changePasswordAction,
    null,
  );
  const [showPw, setShowPw] = useState(false);

  return (
    <div className="space-y-6">
      <form action={profileAction} className="space-y-4">
        {profileState && (
          <Alert tone={profileState.ok ? "success" : "error"}>
            {profileState.message}
          </Alert>
        )}
        <Input label="الاسم الكامل" name="name" defaultValue={defaults.name} />
        <Input
          label="البريد الإلكتروني"
          name="email"
          type="email"
          dir="ltr"
          defaultValue={defaults.email}
          disabled
          hint="لتغيير البريد تواصل مع الإدارة."
        />
        <Input
          label="رقم الهاتف / واتساب"
          name="phone"
          type="tel"
          dir="ltr"
          required={false}
          defaultValue={defaults.phone}
        />
        <Save />
      </form>

      <div className="border-t border-cream-200 pt-5">
        {!showPw ? (
          <button
            type="button"
            onClick={() => setShowPw(true)}
            className="text-[13.5px] font-bold text-brand-700 hover:underline"
          >
            تغيير كلمة المرور
          </button>
        ) : (
          <form action={pwAction} className="space-y-4">
            <h3 className="font-display text-[14.5px] font-black text-ink-900">
              تغيير كلمة المرور
            </h3>
            {pwState && (
              <Alert tone={pwState.ok ? "success" : "error"}>
                {pwState.message}
              </Alert>
            )}
            <Input label="كلمة المرور الحالية" name="current" type="password" />
            <Input label="كلمة المرور الجديدة" name="next" type="password" />
            <Input label="تأكيد كلمة المرور" name="confirm" type="password" />
            <div className="flex gap-2">
              <Save label="تحديث كلمة المرور" />
              <button
                type="button"
                onClick={() => setShowPw(false)}
                className="h-11 rounded-xl px-4 text-[14px] font-bold text-ink-500 hover:bg-cream-100"
              >
                إلغاء
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
