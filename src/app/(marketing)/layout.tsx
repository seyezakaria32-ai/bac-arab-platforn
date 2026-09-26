import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings] = await Promise.all([getCurrentUser(), getSettings()]);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        user={user ? { name: user.name, role: user.role } : null}
      />
      {/* overflow-x-clip: العناصر القادمة من الجانب تبدأ خارج حدود الصفحة
          بـ 40px، فلولاه لظهر شريط تمرير أفقي على الهاتف لحظة حركتها.
          clip لا hidden، حتى لا يتعطّل الترويسة الثابتة (sticky). */}
      <main className="flex-1 overflow-x-clip">{children}</main>
      <ScrollReveal />
      <SiteFooter whatsapp={settings["site.whatsapp"]} />
    </div>
  );
}
