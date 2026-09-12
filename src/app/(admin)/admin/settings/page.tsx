import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { saveSettingsAction } from "../actions";
import {
  AdminForm,
  Field,
  Toggle,
  SubmitButton,
} from "@/components/admin/Form";
import { Alert } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "إعدادات المنصّة" };

export default async function AdminSettingsPage() {
  await requireAdmin();
  const s = await getSettings();

  return (
    <div className="container-page max-w-3xl space-y-6 py-8">
      <header>
        <h1 className="font-display text-2xl font-black text-ink-900">
          إعدادات المنصّة
        </h1>
        <p className="mt-1 text-[13.5px] text-ink-500">
          تتحكّم هذه الإعدادات في سلوك المنصّة دون أي تعديل في الكود.
        </p>
      </header>

      <AdminForm action={saveSettingsAction} className="space-y-6">
        {/* ── التعلّم ── */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            نظام التعلّم والتدرّج
          </h2>
          <div className="mt-4 space-y-3">
            <Toggle
              label="التدرّج الإجباري بين الدروس"
              name="learning.sequential"
              defaultChecked={s["learning.sequential"]}
              hint="لا يُفتح الدرس التالي إلا بعد إتمام الحالي. تعطيلها يفتح كل الدروس دفعة واحدة."
            />
            <Toggle
              label="التدرّج بين المادّتين"
              name="learning.sequentialAcrossTracks"
              defaultChecked={s["learning.sequentialAcrossTracks"]}
              hint="يجب إنهاء التاريخ قبل فتح الجغرافيا. تعطيلها يجعل كل مادة سلسلة مستقلّة."
            />
            <Toggle
              label="اشتراط اجتياز اختبار الوحدة"
              name="learning.requireQuizToAdvance"
              defaultChecked={s["learning.requireQuizToAdvance"]}
              hint="لا تُفتح الوحدة التالية قبل النجاح في اختبار الوحدة الحالية."
            />
            <Toggle
              label="السماح بإعادة مشاهدة الدروس المكتملة"
              name="learning.allowRewatch"
              defaultChecked={s["learning.allowRewatch"]}
            />
          </div>
        </section>

        {/* ── الاختبارات ── */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            الاختبارات
          </h2>
          <div className="mt-4 space-y-4">
            <Field
              label="درجة النجاح الافتراضية %"
              name="quiz.defaultPassScore"
              type="number"
              min={0}
              max={100}
              defaultValue={s["quiz.defaultPassScore"]}
              hint="تُستعمل للاختبارات الجديدة، ويمكن تغييرها لكل اختبار على حدة."
            />
            <Toggle
              label="إظهار شرح الإجابات بعد التصحيح"
              name="quiz.showCorrectAnswers"
              defaultChecked={s["quiz.showCorrectAnswers"]}
            />
          </div>
        </section>

        {/* ── الشهادات ── */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            الشهادات
          </h2>
          <div className="mt-4 space-y-4">
            <Toggle
              label="تفعيل إثبات إتمام البرنامج"
              name="certificate.enabled"
              defaultChecked={s["certificate.enabled"]}
            />
            <Field
              label="نسبة الإكمال المطلوبة %"
              name="certificate.minCompletion"
              type="number"
              min={0}
              max={100}
              defaultValue={s["certificate.minCompletion"]}
            />
          </div>
        </section>

        {/* ── الدفع ── */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            الدفع والتسجيل
          </h2>
          <div className="mt-4 space-y-3">
            <Toggle
              label="التفعيل التلقائي بعد تأكيد البوابة"
              name="payment.autoActivate"
              defaultChecked={s["payment.autoActivate"]}
              hint="عند التعطيل، تنتقل كل عملية مؤكّدة إلى «بانتظار التحقّق» لتراجعها يدويًا."
            />
            <Toggle
              label="التسجيل مفتوح"
              name="site.registrationOpen"
              defaultChecked={s["site.registrationOpen"]}
              hint="عند الإغلاق لا يمكن إنشاء حسابات جديدة."
            />
          </div>
        </section>

        {/* ── معلومات الموقع ── */}
        <section className="card p-5 sm:p-6">
          <h2 className="font-display text-[16px] font-black text-ink-900">
            معلومات الموقع
          </h2>
          <div className="mt-4 space-y-4">
            <Field
              label="رقم واتساب"
              name="site.whatsapp"
              dir="ltr"
              defaultValue={s["site.whatsapp"]}
            />
            <Field
              label="بريد الدعم"
              name="site.supportEmail"
              type="email"
              dir="ltr"
              defaultValue={s["site.supportEmail"]}
            />
          </div>
        </section>

        <Alert tone="info" title="ملاحظة">
          مفاتيح بوابات الدفع وروابط التخزين تُضبط في ملف{" "}
          <code className="rounded bg-white px-1">.env</code> لأسباب أمنية، ولا
          تُحفَظ في قاعدة البيانات.
        </Alert>

        <div className="sticky bottom-4">
          <div className="card flex items-center justify-between gap-3 p-4">
            <p className="text-[13px] text-ink-500">
              تُطبَّق التغييرات فورًا على كل الطلاب.
            </p>
            <SubmitButton>حفظ الإعدادات</SubmitButton>
          </div>
        </div>
      </AdminForm>
    </div>
  );
}
