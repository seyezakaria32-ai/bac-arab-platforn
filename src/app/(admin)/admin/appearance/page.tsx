import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getSettings, BUNDLED_IMAGES } from "@/lib/settings";
import {
  removeSiteImageAction,
  moveSiteImageAction,
  resetSiteImagesAction,
} from "../actions";
import { SiteImageForm } from "@/components/admin/SiteImageForm";
import { IntroVideoForm } from "@/components/admin/IntroVideoForm";
import { ActionButton } from "@/components/admin/Form";
import { Badge, LinkButton, Alert } from "@/components/ui";
import { IconTrash, IconPlus, IconArrowNext } from "@/components/ui/icons";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "صور الواجهة" };

export default async function AppearancePage() {
  await requireAdmin();
  const settings = await getSettings();
  const gallery = settings["site.gallery"];

  return (
    <div className="container-page max-w-5xl space-y-7 py-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-black text-ink-900">
            صور الواجهة
          </h1>
          <p className="mt-1 max-w-2xl text-[13.5px] leading-relaxed text-ink-500">
            استبدل صور الصفحة الرئيسية من هنا — الرفع من جهازك أو الاختيار من صور
            الهوية الجاهزة. التغيير يظهر للزوّار فورًا.
          </p>
        </div>
        <div className="flex gap-2">
          <LinkButton href="/" variant="outline" size="sm">
            معاينة الصفحة الرئيسية
            <IconArrowNext />
          </LinkButton>
          <ActionButton
            action={resetSiteImagesAction}
            tone="outline"
            confirm="إعادة كل صور الواجهة إلى صور الهوية الأصلية؟"
          >
            استعادة الصور الأصلية
          </ActionButton>
        </div>
      </header>

      <Alert tone="info" title="نصيحة في المقاسات">
        حافظ على نسب متقاربة حتى لا تُقتطع أطراف الصورة: بطاقة الأستاذ{" "}
        <strong>عرضية ≈ 16:9</strong>، وملصقات الشبكة{" "}
        <strong>طولية ≈ 9:10</strong>. الإطار يستعمل قصًّا ذكيًا يحافظ على مركز
        الصورة.
      </Alert>

      {/* ── بطاقة الأستاذ ── */}
      <section className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[16px] font-black text-ink-900">
              بطاقة الأستاذ
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              الصورة الكبيرة في أعلى الصفحة الرئيسية، بجانب عنوان البرنامج.
            </p>
          </div>
          <Badge tone="ink">نسبة 16:9</Badge>
        </div>

        <div className="mt-5 max-w-md">
          <SiteImageForm
            slot="hero"
            current={{ src: settings["site.heroImage"], alt: "صورة الأستاذ" }}
            library={BUNDLED_IMAGES}
            aspect="760 / 426"
            withAlt={false}
            submitLabel="حفظ صورة الأستاذ"
          />
        </div>
      </section>

      {/* ── فيديو التعريف ── */}
      <section id="video" className="card scroll-mt-24 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-[16px] font-black text-ink-900">
              فيديو التعريف
            </h2>
            <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-ink-500">
              يظهر مباشرة بعد أعلى الصفحة الرئيسية: تقدّم فيه نفسك والبرنامج للزوّار
              قبل أن يقرّروا التسجيل.
            </p>
          </div>
          <Badge tone="ink">نسبة 16:9</Badge>
        </div>
        <div className="mt-5">
          <IntroVideoForm
            current={settings["site.introVideo"]}
            fallbackPoster={settings["site.heroImage"]}
          />
        </div>
      </section>

      {/* ── شبكة الملصقات ── */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-display text-[16px] font-black text-ink-900">
              شبكة الملصقات
            </h2>
            <p className="mt-1 text-[13px] text-ink-500">
              تظهر في قسم «عن البرنامج». الترتيب هنا هو ترتيب العرض —{" "}
              <span className="num">{gallery.length}</span> من ٨ صور.
            </p>
          </div>
          <Badge tone="ink">نسبة 9:10</Badge>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {gallery.map((img, i) => (
            <div key={`${img.src}-${i}`} className="card p-4">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="num text-[12px] font-bold text-ink-500">
                  الموضع {i + 1}
                </span>
                <div className="flex items-center gap-0.5">
                  <ActionButton
                    action={moveSiteImageAction.bind(null, i, "up")}
                    tone="ghost"
                    title="تقديم"
                  >
                    ↑
                  </ActionButton>
                  <ActionButton
                    action={moveSiteImageAction.bind(null, i, "down")}
                    tone="ghost"
                    title="تأخير"
                  >
                    ↓
                  </ActionButton>
                  <ActionButton
                    action={removeSiteImageAction.bind(null, i)}
                    tone="danger"
                    confirm={`حذف «${img.alt}» من شبكة الصفحة الرئيسية؟`}
                    title="حذف"
                  >
                    <IconTrash />
                  </ActionButton>
                </div>
              </div>

              <SiteImageForm
                slot={String(i)}
                current={img}
                library={BUNDLED_IMAGES}
                aspect="760 / 853"
              />
            </div>
          ))}

          {/* إضافة صورة */}
          {gallery.length < 8 && (
            <div className="rounded-2xl border-2 border-dashed border-cream-300 bg-cream-50/60 p-4">
              <h3 className="mb-3 flex items-center gap-2 font-display text-[13.5px] font-black text-ink-900">
                <IconPlus />
                إضافة صورة جديدة
              </h3>
              <SiteImageForm
                slot="new"
                library={BUNDLED_IMAGES}
                aspect="760 / 853"
                submitLabel="إضافة إلى الشبكة"
              />
            </div>
          )}
        </div>
      </section>

      <p className="text-center text-[12.5px] text-ink-500">
        الصور المرفوعة تُحفظ في{" "}
        <code className="rounded bg-white px-1.5 py-0.5">uploads/site</code>.
        لتغيير شعار الترويسة أو نصوص البرنامج، انتقل إلى{" "}
        <Link
          href="/admin/content/course"
          className="font-bold text-brand-700 hover:underline"
        >
          بيانات البرنامج
        </Link>
        .
      </p>
    </div>
  );
}
