"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import {
  startCheckoutAction,
  previewCouponAction,
  uploadReceiptAction,
  type CheckoutResponse,
  type CouponPreview,
} from "@/app/(student)/checkout/actions";
import { Button, Alert, LinkButton } from "@/components/ui";
import {
  IconWallet,
  IconShield,
  IconUpload,
  IconCheckCircle,
  IconArrowNext,
} from "@/components/ui/icons";

type Provider = {
  id: string;
  label: string;
  description: string;
  icon: string;
};

const PROVIDER_STYLES: Record<string, string> = {
  wave: "bg-sky-100 text-sky-700",
  orange_money: "bg-orange-100 text-orange-700",
  cmi: "bg-indigo-100 text-indigo-700",
  manual: "bg-cream-200 text-ink-700",
};

type AppliedCoupon = Extract<CouponPreview, { ok: true }>["coupon"];

export function CheckoutClient({
  planCode,
  planName,
  price,
  providers,
  initialCode,
}: {
  planCode: string;
  planName: string;
  price: string;
  providers: Provider[];
  /** من رابط الإحالة ?code=… */
  initialCode?: string;
}) {
  const [selected, setSelected] = useState(providers[0]?.id ?? "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState<{
    instructions: string;
    reference: string;
    paymentId: string;
  } | null>(null);

  const [couponInput, setCouponInput] = useState(initialCode ?? "");
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [couponPending, startCoupon] = useTransition();

  const applyCoupon = (code: string) => {
    setCouponMsg(null);
    if (!code.trim()) return;
    startCoupon(async () => {
      const res = await previewCouponAction(planCode, code);
      if (!res.ok) {
        setCouponMsg(res.message);
        return;
      }
      setCoupon(res.coupon);
    });
  };

  // رابط إحالة: يُطبَّق الكود تلقائيًا عند فتح الصفحة
  useEffect(() => {
    if (initialCode) applyCoupon(initialCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const effectivePrice = coupon?.finalPrice ?? price;
  const free = coupon?.free ?? false;

  const proceed = () => {
    setError(null);
    startTransition(async () => {
      const res: CheckoutResponse = await startCheckoutAction(
        planCode,
        selected,
        coupon?.code ?? null,
      );

      if (!res.ok) {
        setError(res.message);
        return;
      }

      if (res.mode === "redirect") {
        window.location.href = res.url;
        return;
      }

      if (res.mode === "form") {
        // إرسال نموذج POST موقّع إلى بوابة البنك
        const form = document.createElement("form");
        form.method = "POST";
        form.action = res.url;
        for (const [k, v] of Object.entries(res.fields)) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = k;
          input.value = v;
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        return;
      }

      setManual({
        instructions: res.instructions,
        reference: res.reference,
        paymentId: res.paymentId,
      });
    });
  };

  if (manual) {
    return (
      <ManualPayment
        instructions={manual.instructions}
        reference={manual.reference}
        paymentId={manual.paymentId}
        planName={planName}
        price={effectivePrice}
      />
    );
  }

  if (providers.length === 0) {
    return (
      <Alert tone="warning" title="لا توجد بوابة دفع مفعّلة">
        تواصل مع الإدارة عبر واتساب لإتمام التسجيل.
      </Alert>
    );
  }

  return (
    <div className="space-y-5">
      {error && <Alert tone="error">{error}</Alert>}

      {/* ── كود الخصم ── */}
      <div className="rounded-2xl border border-cream-300 bg-white p-4">
        {coupon ? (
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-1.5 text-[13.5px] font-bold text-emerald-700">
                <IconCheckCircle />
                الكود <span dir="ltr">{coupon.code}</span> مطبَّق — {coupon.label}
              </p>
              <p className="mt-1 text-[13px] text-ink-500">
                السعر بعد الخصم:{" "}
                <span className="num text-[15px] font-black text-ink-900">
                  {coupon.finalPrice}
                </span>{" "}
                <span className="num text-ink-300 line-through">{price}</span>
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCoupon(null);
                setCouponInput("");
              }}
              className="shrink-0 text-[12.5px] font-bold text-red-600 hover:underline"
            >
              إزالة
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyCoupon(couponInput);
            }}
            className="flex gap-2"
          >
            <input
              dir="ltr"
              value={couponInput}
              onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
              placeholder="كود الخصم (اختياري)"
              aria-label="كود الخصم"
              className="min-w-0 flex-1 rounded-xl border border-cream-300 px-3.5 py-2.5 text-left text-[14px] font-bold tracking-wide uppercase outline-none placeholder:font-normal placeholder:tracking-normal placeholder:normal-case focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
            <Button
              type="submit"
              variant="outline"
              disabled={couponPending || !couponInput.trim()}
            >
              {couponPending ? "…" : "تطبيق"}
            </Button>
          </form>
        )}
        {couponMsg && (
          <p className="mt-2 text-[12.5px] font-bold text-red-600">{couponMsg}</p>
        )}
      </div>

      <div hidden={free}>
        <h2 className="font-display text-[15px] font-black text-ink-900">
          اختر طريقة الدفع
        </h2>
        <div className="mt-3 space-y-2.5">
          {providers.map((p) => {
            const active = selected === p.id;
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-center gap-3.5 rounded-2xl border-2 px-4 py-3.5 transition-colors ${
                  active
                    ? "border-brand-500 bg-brand-50"
                    : "border-cream-300 bg-white hover:border-brand-200"
                }`}
              >
                <input
                  type="radio"
                  name="provider"
                  className="sr-only"
                  checked={active}
                  onChange={() => setSelected(p.id)}
                />
                <span
                  className={`grid size-11 shrink-0 place-items-center rounded-xl text-lg ${
                    PROVIDER_STYLES[p.id] ?? "bg-cream-200 text-ink-700"
                  }`}
                >
                  <IconWallet />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[14.5px] font-bold text-ink-900">
                    {p.label}
                  </span>
                  <span className="mt-0.5 block text-[12.5px] leading-relaxed text-ink-500">
                    {p.description}
                  </span>
                </span>
                <span
                  className={`size-5 shrink-0 rounded-full border-2 ${
                    active ? "border-8 border-brand-500" : "border-ink-300"
                  }`}
                />
              </label>
            );
          })}
        </div>
      </div>

      <Button
        onClick={proceed}
        disabled={pending || couponPending || (!selected && !free)}
        size="lg"
        className="w-full"
      >
        {pending
          ? "جارٍ التحويل…"
          : free
            ? "فعّل اشتراكك مجانًا بالكود"
            : `ادفع ${effectivePrice} واشترك الآن`}
        {!pending && <IconArrowNext className="text-lg" />}
      </Button>

      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-ink-500">
        <IconShield className="mt-0.5 shrink-0 text-base text-brand-600" />
        لا تُفتح دروس البرنامج قبل تأكيد الدفع. بياناتك البنكية تُعالَج لدى بوابة
        الدفع مباشرة ولا تُخزَّن على المنصّة.
      </p>
    </div>
  );
}

/* ═══════════════ الدفع اليدوي: تعليمات + رفع الإيصال ═══════════════ */

function ManualPayment({
  instructions,
  reference,
  paymentId,
  planName,
  price,
}: {
  instructions: string;
  reference: string;
  paymentId: string;
  planName: string;
  price: string;
}) {
  const [state, action] = useActionState(uploadReceiptAction, null);
  const [fileName, setFileName] = useState<string | null>(null);

  if (state?.ok) {
    return (
      <div className="card p-7 text-center">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-emerald-50 text-2xl text-emerald-600">
          <IconCheckCircle />
        </span>
        <h2 className="mt-4 font-display text-lg font-black text-ink-900">
          تمّ استلام إيصالك
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[14px] leading-loose text-ink-500">
          {state.message}
        </p>
        <p className="num mt-3 text-[12.5px] text-ink-500">
          مرجع العملية: <strong>{reference}</strong>
        </p>
        <LinkButton href="/dashboard" className="mt-5">
          العودة إلى لوحتي
        </LinkButton>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Alert tone="info" title={`تعليمات الدفع — باقة ${planName}`}>
        <p className="leading-loose">{instructions}</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="rounded-xl bg-white/70 px-3 py-2">
            <p className="text-[11.5px] text-ink-500">المبلغ</p>
            <p className="num text-[15px] font-black text-ink-900">{price}</p>
          </div>
          <div className="rounded-xl bg-white/70 px-3 py-2">
            <p className="text-[11.5px] text-ink-500">مرجع العملية</p>
            <p className="num text-[15px] font-black text-ink-900">{reference}</p>
          </div>
        </div>
      </Alert>

      <form action={action} className="card space-y-4 p-5">
        <input type="hidden" name="paymentId" value={paymentId} />

        <div>
          <h3 className="font-display text-[15px] font-black text-ink-900">
            ارفع صورة الإيصال
          </h3>
          <p className="mt-1 text-[12.5px] text-ink-500">
            صورة أو ملف PDF بحجم أقصاه ٨ ميغابايت.
          </p>
        </div>

        {state && !state.ok && <Alert tone="error">{state.message}</Alert>}

        <label className="flex cursor-pointer flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50 px-4 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-50/40">
          <IconUpload className="text-2xl text-brand-600" />
          <span className="text-[13.5px] font-bold text-ink-800">
            {fileName ?? "اضغط لاختيار الملف"}
          </span>
          <span className="text-[12px] text-ink-500">JPG · PNG · PDF</span>
          <input
            type="file"
            name="receipt"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            required
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-[13px] font-bold text-ink-800">
            ملاحظة (اختياري)
          </span>
          <textarea
            name="note"
            rows={3}
            placeholder="مثال: تمّ التحويل من رقم 77xxxxxxx باسم…"
            className="w-full resize-y rounded-xl border border-cream-300 px-4 py-3 text-[14px] outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </label>

        <SubmitReceipt />
      </form>
    </div>
  );
}

function SubmitReceipt() {
  return (
    <Button type="submit" size="lg" className="w-full">
      <IconUpload />
      إرسال الإيصال للتحقّق
    </Button>
  );
}
