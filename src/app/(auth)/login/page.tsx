import type { Metadata } from "next";
import { LoginForm } from "../AuthForms";

export const metadata: Metadata = { title: "تسجيل الدخول" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div>
      <h1 className="font-display text-2xl font-black text-ink-900">
        أهلًا بعودتك
      </h1>
      <p className="mt-1.5 text-[14px] text-ink-500">
        سجّل الدخول لمتابعة التعلّم من حيث توقّفت.
      </p>

      <div className="mt-7">
        <LoginForm next={next} />
      </div>
    </div>
  );
}
