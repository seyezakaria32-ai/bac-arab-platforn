import { bictorysProvider } from "./bictorys";
import { waveProvider } from "./wave";
import { orangeMoneyProvider } from "./orange-money";
import { cmiProvider } from "./cmi";
import { manualProvider } from "./manual";
import type { PaymentProvider } from "./types";

export * from "./types";

/** سجلّ البوابات — أضف بوابة جديدة هنا فقط */
const REGISTRY: Record<string, PaymentProvider> = {
  [bictorysProvider.id]: bictorysProvider,
  [waveProvider.id]: waveProvider,
  [orangeMoneyProvider.id]: orangeMoneyProvider,
  [cmiProvider.id]: cmiProvider,
  [manualProvider.id]: manualProvider,
};

/** البوابات المفعّلة في متغيّرات البيئة (PAYMENT_PROVIDERS) */
export function enabledProviderIds(): string[] {
  const raw = process.env.PAYMENT_PROVIDERS ?? "manual";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s && REGISTRY[s]);
}

export function getProvider(id: string): PaymentProvider | null {
  return REGISTRY[id] ?? null;
}

/** البوابات الجاهزة للعرض للطالب (مفعّلة + مهيّأة) */
export function availableProviders() {
  return enabledProviderIds()
    .map((id) => REGISTRY[id])
    .filter((p) => p.isConfigured())
    .map((p) => ({
      id: p.id,
      label: p.label,
      description: p.description,
      icon: p.icon,
    }));
}

/** كل البوابات المسجّلة مع حالة تهيئتها — للوحة الإدارة */
export function providerStatus() {
  const enabled = new Set(enabledProviderIds());
  return Object.values(REGISTRY).map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
    enabled: enabled.has(p.id),
    configured: p.isConfigured(),
  }));
}
