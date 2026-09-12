import { requireUser } from "@/lib/auth";
import { getCurriculum } from "@/lib/curriculum";
import { AppHeader } from "@/components/app/AppHeader";

export default async function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const curriculum = await getCurriculum(user);

  return (
    <div className="flex min-h-dvh flex-col bg-cream-100">
      <AppHeader
        user={user}
        progressPercent={curriculum?.percent}
        nav={[
          { href: "/dashboard", label: "لوحتي" },
          { href: "/profile", label: "حسابي" },
        ]}
      />
      <main className="flex-1">{children}</main>
    </div>
  );
}
