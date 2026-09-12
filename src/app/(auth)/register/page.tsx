import type { Metadata } from "next";
import { RegisterForm } from "../AuthForms";

export const metadata: Metadata = { title: "إنشاء حساب" };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink-900">
        أنشئ حسابك
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-500">
        خطوة واحدة تفصلك عن بداية البرنامج.
      </p>

      <div className="mt-7">
        <RegisterForm next={next} />
      </div>
    </div>
  );
}
