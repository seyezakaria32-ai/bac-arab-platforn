import type { SVGProps } from "react";
import {
  IconAward, IconBook, IconChart, IconCheck, IconCheckCircle, IconClock, IconDocument,
  IconDownload, IconLock, IconMap, IconPieChart, IconPlayCircle, IconSettings, IconShield,
  IconSparkle, IconTarget, IconUsers, IconWallet, IconWhatsapp,
} from "@/components/ui/icons";
import type { IconKey } from "@/lib/sections/registry";

/** الأيقونات التي يختار منها المدير في أقسام الصفحة (المفاتيح في ICON_KEYS) */
export const SECTION_ICONS: Record<IconKey, (p: SVGProps<SVGSVGElement>) => React.ReactNode> = {
  clock: IconClock,
  users: IconUsers,
  target: IconTarget,
  award: IconAward,
  book: IconBook,
  map: IconMap,
  document: IconDocument,
  playCircle: IconPlayCircle,
  pieChart: IconPieChart,
  chart: IconChart,
  sparkle: IconSparkle,
  shield: IconShield,
  check: IconCheck,
  checkCircle: IconCheckCircle,
  wallet: IconWallet,
  download: IconDownload,
  whatsapp: IconWhatsapp,
  lock: IconLock,
  settings: IconSettings,
};

export function SectionIcon({ name, className }: { name: unknown; className?: string }) {
  const Icon = SECTION_ICONS[name as IconKey] ?? IconSparkle;
  return <Icon className={className} />;
}
