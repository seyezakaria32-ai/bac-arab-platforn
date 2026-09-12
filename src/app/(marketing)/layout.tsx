import { SiteHeader } from "@/components/marketing/SiteHeader";
import { SiteFooter } from "@/components/marketing/SiteFooter";
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
      <main className="flex-1">{children}</main>
      <SiteFooter whatsapp={settings["site.whatsapp"]} />
    </div>
  );
}
