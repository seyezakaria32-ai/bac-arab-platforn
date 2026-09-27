import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { getHomeSections } from "@/lib/sections/server";

export type NavItem = { href: string; label: string };

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, settings, sections] = await Promise.all([getCurrentUser(), getSettings(), getHomeSections()]);

  // القائمة العلوية وروابط أسفل الصفحة: كل قسم ظاهر له اسم في القائمة، بترتيب الصفحة
  const nav: NavItem[] = sections
    .filter((s) => s.isVisible && typeof s.values.menuLabel === "string" && s.values.menuLabel.trim())
    .map((s) => ({ href: `#${s.anchor}`, label: (s.values.menuLabel as string).trim() }));

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader
        user={user ? { name: user.name, role: user.role } : null}
        nav={nav}
      />
      {/* overflow-x-clip: العناصر القادمة من الجانب تبدأ خارج حدود الصفحة
          بـ 40px، فلولاه لظهر شريط تمرير أفقي على الهاتف لحظة حركتها.
          clip لا hidden، حتى لا يتعطّل الترويسة الثابتة (sticky). */}
      <main className="flex-1 overflow-x-clip">{children}</main>
      <ScrollReveal />
      <SiteFooter whatsapp={settings["site.whatsapp"]} text={settings["site.footerText"]} nav={nav} />
    </div>
  );
}
