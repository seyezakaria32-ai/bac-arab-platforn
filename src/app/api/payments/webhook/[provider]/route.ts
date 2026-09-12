import { NextResponse } from "next/server";
import { getProvider, enabledProviderIds } from "@/lib/payments";
import { applyWebhookResult } from "@/lib/payments/service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * نقطة استقبال إشعارات بوابات الدفع.
 *   POST /api/payments/webhook/wave
 *   POST /api/payments/webhook/orange_money
 *   POST /api/payments/webhook/cmi
 *
 * كل بوابة تتحقّق من توقيعها داخل مِلفّها الخاص، ثمّ يمرّ الناتج عبر
 * applyWebhookResult — النقطة الوحيدة التي تمنح الوصول إلى المحتوى.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider: providerId } = await params;

  if (!enabledProviderIds().includes(providerId)) {
    return NextResponse.json(
      { error: "بوابة غير مفعّلة" },
      { status: 404 },
    );
  }

  const provider = getProvider(providerId);
  if (!provider) {
    return NextResponse.json({ error: "بوابة غير معروفة" }, { status: 404 });
  }

  try {
    const result = await provider.handleWebhook(req);
    const applied = await applyWebhookResult(result);

    if (!applied.handled) {
      // نُرجع 200 حتى لا تُعيد البوابة الإرسال إلى ما لا نهاية
      console.warn(`[webhook:${providerId}] تُجوهل: ${applied.reason}`);
      return NextResponse.json({ received: true, note: applied.reason });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error(`[webhook:${providerId}]`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "خطأ" },
      { status: 400 },
    );
  }
}
