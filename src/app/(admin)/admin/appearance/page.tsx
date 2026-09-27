import { redirect } from "next/navigation";

/**
 * صفحة «الواجهة» القديمة: صورة الأستاذ صارت في قسم «الواجهة الأولى»، وفيديو
 * التعريف في قسمه — كلاهما في «تصميم الموقع». تبقى الصفحة تحويلًا لمن حفظ رابطها.
 */
export default function AppearancePage() {
  redirect("/admin/design");
}
