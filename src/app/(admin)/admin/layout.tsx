import { requireAdmin } from "@/lib/auth";
import { AppHeader } from "@/components/app/AppHeader";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireAdmin();

  return (
    <div className="flex min-h-dvh flex-col bg-cream-100">
      <AppHeader
        user={user}
        nav={[
          { href: "/admin", label: "الإحصائيات" },
          { href: "/admin/content", label: "المحتوى" },
          { href: "/admin/appearance", label: "الواجهة" },
          { href: "/admin/sliders", label: "السلايدر" },
          { href: "/admin/students", label: "الطلاب" },
          { href: "/admin/reviews", label: "التصحيح" },
          { href: "/admin/payments", label: "المدفوعات" },
          { href: "/admin/plans", label: "الباقات" },
          { href: "/admin/settings", label: "الإعدادات" },
        ]}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
