import type { Metadata } from "next";
import { db } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { planFeatures } from "@/lib/payments/service";
import { savePlanAction } from "../actions";
import {
  AdminForm,
  Field,
  TextArea,
  Toggle,
  SubmitButton,
} from "@/components/admin/Form";
import { Badge, LinkButton } from "@/components/ui";
import { IconSparkle } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "الباقات" };

const ZERO_DECIMAL = ["XOF", "XAF", "JPY", "KRW"];

export default async function AdminPlansPage() {
  await requireAdmin();

  const plans = await db.plan.findMany({
    orderBy: { order: "asc" },
    include: { _count: { select: { subscriptions: true } } },
  });

  return (
    <div className="container-page max-w-5xl space-y-6 py-8">
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900">
          الباقات والأسعار
        </h1>
        <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
          عدّل السعر والمزايا من هنا — تنعكس التغييرات فورًا على الصفحة الرئيسية
          وصفحة الدفع دون أي تعديل في الكود. لتقييد درس أو ملف على PREMIUM ELITE،
          اضبط «الباقة المطلوبة» في محرّر الدرس أو المورد.
        </p>
        <LinkButton href="/admin/coupons" variant="outline" size="sm" className="mt-4">
          <IconSparkle />
          أكواد الخصم والإحالة
        </LinkButton>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {plans.map((plan) => {
          const features = planFeatures(plan);
          const zero = ZERO_DECIMAL.includes(plan.currency);
          const toMajor = (cents: number) =>
            zero ? Math.round(cents / 100) : cents / 100;
          const isPremium = plan.code === "PREMIUM_ELITE";

          return (
            <section
              key={plan.id}
              className={`card overflow-hidden ${isPremium ? "border-gold-400" : ""}`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-cream-200 bg-cream-50 px-5 py-4">
                <h2
                  className={`flex items-center gap-2 font-display text-[16px] font-black ${
                    isPremium ? "text-gold-600" : "text-ink-900"
                  }`}
                >
                  {isPremium && <IconSparkle />}
                  {plan.name}
                </h2>
                <div className="flex gap-1.5">
                  <Badge tone={plan.isActive ? "green" : "slate"}>
                    {plan.isActive ? "مفعّلة" : "معطّلة"}
                  </Badge>
                  <Badge tone="ink">
                    <span className="num">{plan._count.subscriptions}</span> مشترك
                  </Badge>
                </div>
              </div>

              <div className="p-5">
                <AdminForm action={savePlanAction}>
                  <input type="hidden" name="id" value={plan.id} />

                  <Field label="اسم الباقة" name="name" required defaultValue={plan.name} />
                  <Field
                    label="الشعار المختصر"
                    name="tagline"
                    defaultValue={plan.tagline}
                    placeholder="الانطلاقة الصحيحة"
                  />
                  <TextArea
                    label="وصف الباقة"
                    name="description"
                    rows={2}
                    defaultValue={plan.description}
                  />

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field
                      label="السعر"
                      name="price"
                      type="number"
                      min={0}
                      defaultValue={toMajor(plan.priceCents)}
                    />
                    <Field
                      label="السعر قبل التخفيض"
                      name="comparePrice"
                      type="number"
                      min={0}
                      defaultValue={
                        plan.comparePriceCents ? toMajor(plan.comparePriceCents) : 0
                      }
                      hint="0 = بلا تخفيض"
                    />
                    <Field
                      label="العملة"
                      name="currency"
                      dir="ltr"
                      defaultValue={plan.currency}
                      hint="XOF · MAD · EUR"
                    />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field
                      label="مدّة الوصول (أيام)"
                      name="durationDays"
                      type="number"
                      min={0}
                      defaultValue={plan.durationDays}
                      hint="0 = وصول دائم"
                    />
                    <Field
                      label="شارة الباقة"
                      name="badge"
                      defaultValue={plan.badge}
                      placeholder="الأكثر اختيارًا"
                    />
                  </div>

                  <TextArea
                    label="مزايا الباقة"
                    name="features"
                    rows={10}
                    mono
                    defaultValue={features
                      .map((f) => (f.included ? f.label : `-${f.label}`))
                      .join("\n")}
                    hint="ميزة في كل سطر — ابدأ السطر بـ - لعرض الميزة مشطوبة (غير مشمولة)."
                  />

                  <div className="grid gap-3 sm:grid-cols-2">
                    <Toggle
                      label="مفعّلة"
                      name="isActive"
                      defaultChecked={plan.isActive}
                      hint="الباقات المعطّلة لا تظهر للطلاب."
                    />
                    <Toggle
                      label="إبراز الباقة"
                      name="isHighlighted"
                      defaultChecked={plan.isHighlighted}
                      hint="إطار ذهبي في صفحة الأسعار."
                    />
                  </div>

                  <SubmitButton>حفظ الباقة</SubmitButton>
                </AdminForm>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
