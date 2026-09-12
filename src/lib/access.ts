import "server-only";
import { db } from "./db";
import {
  PLAN_CODES,
  PLAN_TIERS,
  SUBSCRIPTION_STATUS,
  TIER_RANK,
  ROLES,
} from "./constants";

/**
 * طبقة الصلاحيات — تحدّد ما إذا كان للطالب اشتراك نشِط وما مستوى باقته.
 * كل حماية للمحتوى المدفوع تمرّ من هنا (الصفحات + مسارات API معًا)
 * حتى لا يمكن الوصول إلى أي درس مدفوع عبر الرابط المباشر.
 */

export type Access = {
  hasAccess: boolean;
  isAdmin: boolean;
  planCode: string | null;
  /** أعلى مستوى محتوى مسموح: start | premium */
  tier: string;
  subscriptionId: string | null;
  status: string | null;
  expiresAt: Date | null;
};

export const NO_ACCESS: Access = {
  hasAccess: false,
  isAdmin: false,
  planCode: null,
  tier: PLAN_TIERS.START,
  subscriptionId: null,
  status: null,
  expiresAt: null,
};

/** صلاحية المستخدم على برنامج معيّن */
export async function getAccess(
  user: { id: string; role: string } | null,
  courseId: string,
): Promise<Access> {
  if (!user) return NO_ACCESS;

  // المسؤول يرى كل شيء (للمراجعة والتصحيح) دون أن يحتاج اشتراكًا
  if (user.role === ROLES.ADMIN) {
    return {
      hasAccess: true,
      isAdmin: true,
      planCode: PLAN_CODES.PREMIUM_ELITE,
      tier: PLAN_TIERS.PREMIUM,
      subscriptionId: null,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      expiresAt: null,
    };
  }

  const sub = await db.subscription.findUnique({
    where: { userId_courseId: { userId: user.id, courseId } },
    include: { plan: true },
  });

  if (!sub || sub.status !== SUBSCRIPTION_STATUS.ACTIVE) {
    return {
      ...NO_ACCESS,
      planCode: sub?.plan.code ?? null,
      status: sub?.status ?? null,
      subscriptionId: sub?.id ?? null,
    };
  }

  // انتهاء الصلاحية
  if (sub.expiresAt && sub.expiresAt.getTime() < Date.now()) {
    await db.subscription.update({
      where: { id: sub.id },
      data: { status: SUBSCRIPTION_STATUS.EXPIRED },
    });
    return {
      ...NO_ACCESS,
      planCode: sub.plan.code,
      status: SUBSCRIPTION_STATUS.EXPIRED,
      subscriptionId: sub.id,
      expiresAt: sub.expiresAt,
    };
  }

  return {
    hasAccess: true,
    isAdmin: false,
    planCode: sub.plan.code,
    tier:
      sub.plan.code === PLAN_CODES.PREMIUM_ELITE
        ? PLAN_TIERS.PREMIUM
        : PLAN_TIERS.START,
    subscriptionId: sub.id,
    status: sub.status,
    expiresAt: sub.expiresAt,
  };
}

/** هل تكفي باقة الطالب لفتح محتوى يتطلّب مستوى معيّنًا؟ */
export function tierAllows(userTier: string, requiredTier: string) {
  return (TIER_RANK[userTier] ?? 1) >= (TIER_RANK[requiredTier] ?? 1);
}
