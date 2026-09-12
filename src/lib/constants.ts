/**
 * ثوابت المنصّة — بديل عن Enum في Prisma حتى يبقى المخطط متوافقًا
 * مع PostgreSQL و SQLite معًا، وحتى تُضاف قيم جديدة دون ترحيل قاعدة بيانات.
 */

// ───────────────────────────── الأدوار ─────────────────────────────
export const ROLES = {
  STUDENT: "student",
  ADMIN: "admin",
} as const;
export type Role = (typeof ROLES)[keyof typeof ROLES];

// ───────────────────────────── الباقات ─────────────────────────────
export const PLAN_CODES = {
  START: "START",
  PREMIUM_ELITE: "PREMIUM_ELITE",
} as const;
export type PlanCode = (typeof PLAN_CODES)[keyof typeof PLAN_CODES];

/** مستوى الوصول المخزَّن على الدروس/الوحدات/الموارد */
export const PLAN_TIERS = {
  START: "start",
  PREMIUM: "premium",
} as const;
export type PlanTier = (typeof PLAN_TIERS)[keyof typeof PLAN_TIERS];

/** ترتيب الباقات — الأعلى يشمل الأدنى */
export const PLAN_RANK: Record<string, number> = {
  [PLAN_CODES.START]: 1,
  [PLAN_CODES.PREMIUM_ELITE]: 2,
};
export const TIER_RANK: Record<string, number> = {
  [PLAN_TIERS.START]: 1,
  [PLAN_TIERS.PREMIUM]: 2,
};

// ──────────────────────────── الاشتراكات ────────────────────────────
export const SUBSCRIPTION_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  EXPIRED: "expired",
  CANCELLED: "cancelled",
} as const;
export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

// ────────────────────────────── الدفع ──────────────────────────────
export const PAYMENT_STATUS = {
  PENDING: "pending",
  AWAITING_REVIEW: "awaiting_review",
  PAID: "paid",
  FAILED: "failed",
  REFUNDED: "refunded",
} as const;
export type PaymentStatus =
  (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "في انتظار الدفع",
  awaiting_review: "بانتظار التحقق",
  paid: "مدفوع",
  failed: "فشل",
  refunded: "مُسترجَع",
};

export const PROVIDER_LABELS: Record<string, string> = {
  wave: "Wave",
  orange_money: "Orange Money",
  cmi: "بطاقة بنكية (CMI)",
  manual: "تحويل يدوي",
  stripe: "Stripe",
};

// ────────────────────────────── التقدّم ──────────────────────────────
export const PROGRESS_STATUS = {
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
} as const;

/** حالة العرض المحسوبة لكل درس في الواجهة */
export const LESSON_STATE = {
  COMPLETED: "completed",
  CURRENT: "current",
  LOCKED: "locked",
  PREVIEW: "preview",
} as const;
export type LessonState = (typeof LESSON_STATE)[keyof typeof LESSON_STATE];

// ───────────────────────────── الاختبارات ─────────────────────────────
export const QUESTION_TYPES = {
  MCQ: "mcq",
  MULTI: "multi",
  TRUE_FALSE: "true_false",
  SHORT: "short",
  OPEN: "open",
} as const;
export type QuestionType =
  (typeof QUESTION_TYPES)[keyof typeof QUESTION_TYPES];

export const QUESTION_TYPE_LABELS: Record<string, string> = {
  mcq: "اختيار من متعدد",
  multi: "اختيار متعدد الإجابات",
  true_false: "صح أو خطأ",
  short: "سؤال قصير",
  open: "سؤال تطبيقي",
};

// ────────────────────────────── الموارد ──────────────────────────────
export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  pdf: "ملف PDF",
  doc: "مستند",
  image: "صورة",
  audio: "ملف صوتي",
  link: "رابط خارجي",
};

// ───────────────────────── هوية المنصّة ─────────────────────────
export const BRAND = {
  name: "Bac Arabe Sénégal",
  nameAr: "باك عربي السنغال",
  programTitle: "الدليل الشامل لمنهجية الإجابة",
  programSubtitle: "في التاريخ والجغرافيا",
  instructor: "الأستاذ زكريا سي",
  instructorBio: [
    "طالب ماجستير بالمغرب",
    "متفوّق في البكالوريا الحكومية بمعدل 17.89",
    "صانع محتوى تعليمي رقمي",
  ],
  whatsapp: "+212632092292",
  // وتيرة مقترحة لا موعد إلزامي — الدراسة ذاتية: يبدأ الطالب فور التسجيل
  duration: "حوالي شهرين",
  audience: "طلبة البكالوريا",
} as const;
