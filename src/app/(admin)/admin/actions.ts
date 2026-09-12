"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getSettings, setSetting } from "@/lib/settings";
import { activateSubscription, failPayment } from "@/lib/payments/service";
import { saveUpload, UploadError } from "@/lib/storage";
import { toEmbed } from "@/lib/video";
import { ROLES, SUBSCRIPTION_STATUS } from "@/lib/constants";

/**
 * إجراءات لوحة الإدارة.
 * كل إجراء يبدأ بـ guard() — لا اعتماد على الـ middleware وحده.
 */

export type AdminResult = { ok: boolean; message: string; id?: string };

async function guard() {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) {
    throw new Error("غير مصرّح لك بهذا الإجراء");
  }
  return user;
}

function refresh() {
  revalidatePath("/admin", "layout");
  revalidatePath("/dashboard");
  revalidatePath("/");
}

const num = (v: FormDataEntryValue | null, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const str = (v: FormDataEntryValue | null) => String(v ?? "").trim();
const bool = (v: FormDataEntryValue | null) => v === "on" || v === "true";

/* ═══════════════════════════ البرنامج ═══════════════════════════ */

export async function saveCourseAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));
  const title = str(formData.get("title"));
  if (!title) return { ok: false, message: "أدخل عنوان البرنامج" };

  await db.course.update({
    where: { id },
    data: {
      title,
      subtitle: str(formData.get("subtitle")) || null,
      description: str(formData.get("description")) || null,
      instructor: str(formData.get("instructor")) || null,
      durationText: str(formData.get("durationText")) || null,
      isPublished: bool(formData.get("isPublished")),
    },
  });

  refresh();
  return { ok: true, message: "حُفظت بيانات البرنامج" };
}

/* ═══════════════════════════ المسارات ═══════════════════════════ */

export async function deleteTrackAction(id: string): Promise<AdminResult> {
  await guard();
  const track = await db.track.findUnique({
    where: { id },
    include: { _count: { select: { modules: true } } },
  });
  if (!track) return { ok: false, message: "المسار غير موجود" };
  await db.track.delete({ where: { id } });
  refresh();
  return {
    ok: true,
    message: `حُذف «${track.title}» مع ${track._count.modules} وحدات`,
  };
}

export async function saveTrackAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));
  const data = {
    title: str(formData.get("title")),
    description: str(formData.get("description")) || null,
    color: str(formData.get("color")) || null,
    order: num(formData.get("order")),
    isPublished: bool(formData.get("isPublished")),
  };
  if (!data.title) return { ok: false, message: "أدخل عنوان المسار" };

  if (id) {
    await db.track.update({ where: { id }, data });
  } else {
    const courseId = str(formData.get("courseId"));
    await db.track.create({
      data: {
        ...data,
        courseId,
        slug: str(formData.get("slug")) || `track-${Date.now()}`,
      },
    });
  }
  refresh();
  return { ok: true, message: "حُفظ المسار" };
}

/* ═══════════════════════════ الوحدات ═══════════════════════════ */

export async function saveModuleAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));
  const data = {
    title: str(formData.get("title")),
    description: str(formData.get("description")) || null,
    order: num(formData.get("order")),
    isPublished: bool(formData.get("isPublished")),
    requiredPlan: str(formData.get("requiredPlan")) || "start",
  };
  if (!data.title) return { ok: false, message: "أدخل عنوان الوحدة" };

  if (id) {
    await db.module.update({ where: { id }, data });
  } else {
    const trackId = str(formData.get("trackId"));
    if (!trackId) return { ok: false, message: "اختر المسار" };
    const count = await db.module.count({ where: { trackId } });
    const created = await db.module.create({
      data: { ...data, trackId, order: data.order || count },
    });
    refresh();
    return { ok: true, message: "أُضيفت الوحدة", id: created.id };
  }
  refresh();
  return { ok: true, message: "حُفظت الوحدة" };
}

export async function deleteModuleAction(id: string): Promise<AdminResult> {
  await guard();
  await db.module.delete({ where: { id } });
  refresh();
  return { ok: true, message: "حُذفت الوحدة وكل دروسها" };
}

/* ═══════════════════════════ الدروس ═══════════════════════════ */

const lessonSchema = z.object({
  title: z.string().trim().min(2, "أدخل عنوان الدرس"),
  summary: z.string().trim().optional(),
  content: z.string().optional(),
  exercise: z.string().optional(),
  videoUrl: z.string().trim().optional(),
  videoProvider: z.string().default("youtube"),
  durationMinutes: z.number().int().min(0).max(600),
  order: z.number().int().min(0),
  requiredPlan: z.enum(["start", "premium"]),
  isPublished: z.boolean(),
  isFreePreview: z.boolean(),
  objectives: z.array(z.string()).default([]),
});

export async function saveLessonAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));

  const objectives = str(formData.get("objectives"))
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const parsed = lessonSchema.safeParse({
    title: str(formData.get("title")),
    summary: str(formData.get("summary")),
    content: String(formData.get("content") ?? ""),
    exercise: String(formData.get("exercise") ?? ""),
    videoUrl: str(formData.get("videoUrl")),
    videoProvider: str(formData.get("videoProvider")) || "youtube",
    durationMinutes: num(formData.get("durationMinutes")),
    order: num(formData.get("order")),
    requiredPlan: str(formData.get("requiredPlan")) || "start",
    isPublished: bool(formData.get("isPublished")),
    isFreePreview: bool(formData.get("isFreePreview")),
    objectives,
  });

  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const d = parsed.data;
  const data = {
    title: d.title,
    summary: d.summary || null,
    content: d.content || null,
    exercise: d.exercise || null,
    videoUrl: d.videoUrl || null,
    videoProvider: d.videoProvider,
    durationMinutes: d.durationMinutes,
    order: d.order,
    requiredPlan: d.requiredPlan,
    isPublished: d.isPublished,
    isFreePreview: d.isFreePreview,
    objectives: JSON.stringify(d.objectives),
  };

  if (id) {
    await db.lesson.update({ where: { id }, data });
    refresh();
    revalidatePath(`/learn/${id}`);
    return { ok: true, message: "حُفظ الدرس" };
  }

  const moduleId = str(formData.get("moduleId"));
  if (!moduleId) return { ok: false, message: "اختر الوحدة" };
  const count = await db.lesson.count({ where: { moduleId } });
  const created = await db.lesson.create({
    data: {
      ...data,
      moduleId,
      order: data.order || count,
      slug: `lesson-${Date.now().toString(36)}`,
    },
  });
  refresh();
  return { ok: true, message: "أُضيف الدرس", id: created.id };
}

export async function deleteLessonAction(id: string): Promise<AdminResult> {
  await guard();
  await db.lesson.delete({ where: { id } });
  refresh();
  return { ok: true, message: "حُذف الدرس" };
}

/** تحريك درس لأعلى أو لأسفل داخل وحدته */
export async function moveLessonAction(
  id: string,
  direction: "up" | "down",
): Promise<AdminResult> {
  await guard();
  const lesson = await db.lesson.findUnique({ where: { id } });
  if (!lesson) return { ok: false, message: "الدرس غير موجود" };

  const siblings = await db.lesson.findMany({
    where: { moduleId: lesson.moduleId },
    orderBy: { order: "asc" },
  });
  const index = siblings.findIndex((l) => l.id === id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= siblings.length) {
    return { ok: false, message: "لا يمكن التحريك أبعد من ذلك" };
  }

  const other = siblings[target];
  await db.$transaction([
    db.lesson.update({ where: { id: lesson.id }, data: { order: other.order } }),
    db.lesson.update({ where: { id: other.id }, data: { order: lesson.order } }),
  ]);

  // إعادة ترقيم مضمونة لتفادي تكرار القيم
  const reordered = await db.lesson.findMany({
    where: { moduleId: lesson.moduleId },
    orderBy: { order: "asc" },
  });
  await db.$transaction(
    reordered.map((l, i) =>
      db.lesson.update({ where: { id: l.id }, data: { order: i } }),
    ),
  );

  refresh();
  return { ok: true, message: "تمّ الترتيب" };
}

export async function toggleLessonPublishAction(
  id: string,
): Promise<AdminResult> {
  await guard();
  const lesson = await db.lesson.findUnique({ where: { id } });
  if (!lesson) return { ok: false, message: "الدرس غير موجود" };
  await db.lesson.update({
    where: { id },
    data: { isPublished: !lesson.isPublished },
  });
  refresh();
  return {
    ok: true,
    message: lesson.isPublished ? "أُخفي الدرس" : "نُشر الدرس",
  };
}

/* ═══════════════════════ موارد الدرس ═══════════════════════ */

export async function addResourceAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const lessonId = str(formData.get("lessonId"));
  const title = str(formData.get("title"));
  const requiredPlan = str(formData.get("requiredPlan")) || "start";
  const type = str(formData.get("type")) || "pdf";
  let url = str(formData.get("url"));

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      const stored = await saveUpload(file, "resources");
      url = stored.url;
    } catch (error) {
      return {
        ok: false,
        message: error instanceof UploadError ? error.message : "تعذّر رفع الملف",
      };
    }
  }

  if (!title || !url) {
    return { ok: false, message: "أدخل عنوانًا وارفع ملفًا أو ألصق رابطًا" };
  }

  const count = await db.lessonResource.count({ where: { lessonId } });
  await db.lessonResource.create({
    data: { lessonId, title, url, type, requiredPlan, order: count },
  });

  refresh();
  revalidatePath(`/learn/${lessonId}`);
  return { ok: true, message: "أُضيف المورد" };
}

export async function deleteResourceAction(id: string): Promise<AdminResult> {
  await guard();
  await db.lessonResource.delete({ where: { id } });
  refresh();
  return { ok: true, message: "حُذف المورد" };
}

/* ═══════════════════════ الاختبارات ═══════════════════════ */

export async function saveQuizAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const moduleId = str(formData.get("moduleId"));
  const data = {
    title: str(formData.get("title")) || "اختبار الوحدة",
    description: str(formData.get("description")) || null,
    passScore: Math.min(100, Math.max(0, num(formData.get("passScore"), 70))),
    maxAttempts: Math.max(0, num(formData.get("maxAttempts"))),
    timeLimitMinutes: Math.max(0, num(formData.get("timeLimitMinutes"))),
    isPublished: bool(formData.get("isPublished")),
    requiredPlan: str(formData.get("requiredPlan")) || "start",
    shuffleQuestions: bool(formData.get("shuffleQuestions")),
  };

  await db.quiz.upsert({
    where: { moduleId },
    update: data,
    create: { ...data, moduleId },
  });

  refresh();
  return { ok: true, message: "حُفظت إعدادات الاختبار" };
}

export async function saveQuestionAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));
  const quizId = str(formData.get("quizId"));
  const type = str(formData.get("type")) || "mcq";
  const prompt = str(formData.get("prompt"));
  if (!prompt) return { ok: false, message: "أدخل نصّ السؤال" };

  const accepted = str(formData.get("acceptedAnswers"))
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const data = {
    type,
    prompt,
    hint: str(formData.get("hint")) || null,
    explanation: str(formData.get("explanation")) || null,
    points: Math.max(1, num(formData.get("points"), 1)),
    order: num(formData.get("order")),
    acceptedAnswers: accepted.length ? JSON.stringify(accepted) : null,
  };

  // الخيارات: نصّ في كل سطر، ويُسبَق بعلامة * إذا كان صحيحًا
  const rawOptions = str(formData.get("options"))
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line, i) => ({
      text: line.replace(/^\*\s*/, ""),
      isCorrect: line.startsWith("*"),
      order: i,
    }));

  const needsOptions = ["mcq", "multi", "true_false"].includes(type);
  if (needsOptions) {
    if (rawOptions.length < 2)
      return { ok: false, message: "أضف خيارين على الأقل" };
    if (!rawOptions.some((o) => o.isCorrect))
      return {
        ok: false,
        message: "حدّد الإجابة الصحيحة بوضع * في بداية السطر",
      };
  }
  if (type === "short" && accepted.length === 0) {
    return { ok: false, message: "أضف إجابة مقبولة واحدة على الأقل" };
  }

  let questionId = id;
  if (id) {
    await db.question.update({ where: { id }, data });
    await db.option.deleteMany({ where: { questionId: id } });
  } else {
    const count = await db.question.count({ where: { quizId } });
    const created = await db.question.create({
      data: { ...data, quizId, order: data.order || count },
    });
    questionId = created.id;
  }

  if (needsOptions && questionId) {
    await db.option.createMany({
      data: rawOptions.map((o) => ({ ...o, questionId })),
    });
  }

  refresh();
  return { ok: true, message: id ? "حُفظ السؤال" : "أُضيف السؤال" };
}

export async function deleteQuestionAction(id: string): Promise<AdminResult> {
  await guard();
  await db.question.delete({ where: { id } });
  refresh();
  return { ok: true, message: "حُذف السؤال" };
}

/* ═══════════════ تصحيح الأسئلة التطبيقية (PREMIUM) ═══════════════ */

type StoredAnswer = {
  questionId: string;
  type: string;
  given: string | string[];
  correct: boolean | null;
  points: number;
  earned: number;
};

/**
 * تصحيح يدوي لمحاولة اختبار تحتوي أسئلة تطبيقية.
 * بعد التصحيح تُعاد النتيجة كاملةً محسوبةً على كل الأسئلة (الآلية + التطبيقية)،
 * وتُحدَّث حالة النجاح — وهو ما قد يفتح الوحدة التالية للطالب.
 */
export async function gradeAttemptAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const attemptId = str(formData.get("attemptId"));

  const attempt = await db.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { quiz: { include: { questions: true } } },
  });
  if (!attempt) return { ok: false, message: "المحاولة غير موجودة" };

  const stored: StoredAnswer[] = (() => {
    try {
      return JSON.parse(attempt.answers ?? "[]") as StoredAnswer[];
    } catch {
      return [];
    }
  })();

  const pointsByQuestion = new Map(
    attempt.quiz.questions.map((q) => [q.id, q.points]),
  );

  let stillPending = false;

  const graded = stored.map((a) => {
    if (a.correct !== null) return a;

    const raw = formData.get(`points_${a.questionId}`);
    if (raw === null || String(raw).trim() === "") {
      stillPending = true;
      return a;
    }

    const max = pointsByQuestion.get(a.questionId) ?? a.points;
    const earned = Math.max(0, Math.min(max, num(raw)));
    return { ...a, earned, correct: earned >= max / 2 };
  });

  const totalPoints = attempt.quiz.questions.reduce((s, q) => s + q.points, 0);
  const earnedPoints = graded.reduce((s, a) => s + a.earned, 0);
  // ما دام هناك سؤال غير مصحَّح، تبقى النتيجة محسوبة على المصحَّح فقط
  const denominator = stillPending
    ? graded.filter((a) => a.correct !== null).reduce((s, a) => s + a.points, 0)
    : totalPoints;

  const score =
    denominator === 0 ? 0 : Math.round((earnedPoints / denominator) * 100);
  const passed = score >= attempt.quiz.passScore;

  await db.quizAttempt.update({
    where: { id: attempt.id },
    data: {
      answers: JSON.stringify(graded),
      earnedPoints,
      totalPoints,
      score,
      passed,
      needsReview: stillPending,
      reviewNote: str(formData.get("note")) || null,
    },
  });

  refresh();
  revalidatePath(`/quiz/${attempt.quiz.moduleId}`, "layout");

  return {
    ok: true,
    message: stillPending
      ? "حُفظ التصحيح الجزئي — بقيت أسئلة غير مصحَّحة."
      : `اكتمل التصحيح — النتيجة ${score}% (${passed ? "ناجح" : "راسب"}).`,
  };
}

/* ═══════════════════════ الطلاب ═══════════════════════ */

export async function toggleStudentActiveAction(
  userId: string,
): Promise<AdminResult> {
  await guard();
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) return { ok: false, message: "الطالب غير موجود" };
  await db.user.update({
    where: { id: userId },
    data: { isActive: !user.isActive },
  });
  refresh();
  return { ok: true, message: user.isActive ? "أُوقف الحساب" : "فُعّل الحساب" };
}

/** منح اشتراك يدويًا (مثلًا لطالب دفع نقدًا) */
export async function grantSubscriptionAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const userId = str(formData.get("userId"));
  const planCode = str(formData.get("planCode"));
  const courseId = str(formData.get("courseId"));

  const plan = await db.plan.findUnique({ where: { code: planCode } });
  if (!plan) return { ok: false, message: "الباقة غير موجودة" };

  const expiresAt =
    plan.durationDays > 0
      ? new Date(Date.now() + plan.durationDays * 86_400_000)
      : null;

  await db.subscription.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: {
      planId: plan.id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startedAt: new Date(),
      expiresAt,
    },
    create: {
      userId,
      courseId,
      planId: plan.id,
      status: SUBSCRIPTION_STATUS.ACTIVE,
      startedAt: new Date(),
      expiresAt,
    },
  });

  refresh();
  return { ok: true, message: `فُعّل اشتراك ${plan.name}` };
}

export async function revokeSubscriptionAction(
  subscriptionId: string,
): Promise<AdminResult> {
  await guard();
  await db.subscription.update({
    where: { id: subscriptionId },
    data: { status: SUBSCRIPTION_STATUS.CANCELLED },
  });
  refresh();
  return { ok: true, message: "أُلغي الاشتراك" };
}

export async function resetStudentProgressAction(
  userId: string,
): Promise<AdminResult> {
  await guard();
  await db.lessonProgress.deleteMany({ where: { userId } });
  refresh();
  return { ok: true, message: "أُعيد ضبط تقدّم الطالب" };
}

/* ═══════════════════════ المدفوعات ═══════════════════════ */

export async function approvePaymentAction(
  paymentId: string,
): Promise<AdminResult> {
  const admin = await guard();
  await activateSubscription(paymentId, { verifiedById: admin.id });
  refresh();
  return { ok: true, message: "تمّ تأكيد الدفع وتفعيل الاشتراك" };
}

export async function rejectPaymentAction(
  paymentId: string,
  note?: string,
): Promise<AdminResult> {
  await guard();
  await failPayment(paymentId, note ?? "رُفضت من الإدارة");
  refresh();
  return { ok: true, message: "رُفضت العملية" };
}

/* ═══════════════════════ الباقات ═══════════════════════ */

export async function savePlanAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const id = str(formData.get("id"));

  // كل سطر ميزة، ويُسبَق بـ - إذا كانت غير مشمولة
  const features = str(formData.get("features"))
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((line) => ({
      label: line.replace(/^-\s*/, ""),
      included: !line.startsWith("-"),
    }));

  const priceMajor = num(formData.get("price"));
  const compareMajor = num(formData.get("comparePrice"));
  const currency = str(formData.get("currency")) || "XOF";
  const zeroDecimal = ["XOF", "XAF", "JPY", "KRW"].includes(currency);
  const toCents = (v: number) => Math.round(v * 100);

  await db.plan.update({
    where: { id },
    data: {
      name: str(formData.get("name")),
      tagline: str(formData.get("tagline")) || null,
      description: str(formData.get("description")) || null,
      priceCents: toCents(priceMajor),
      comparePriceCents: compareMajor > 0 ? toCents(compareMajor) : null,
      currency,
      durationDays: Math.max(0, num(formData.get("durationDays"))),
      badge: str(formData.get("badge")) || null,
      isHighlighted: bool(formData.get("isHighlighted")),
      isActive: bool(formData.get("isActive")),
      features: JSON.stringify(features),
    },
  });

  void zeroDecimal;
  refresh();
  return { ok: true, message: "حُفظت الباقة" };
}

/* ═══════════════════════ أكواد الخصم ═══════════════════════ */

export async function saveCouponAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();

  const code = str(formData.get("code")).toUpperCase().replace(/\s+/g, "");
  if (!/^[A-Z0-9_-]{3,30}$/.test(code)) {
    return {
      ok: false,
      message: "الكود من ٣ إلى ٣٠ حرفًا لاتينيًا أو رقمًا، بلا مسافات",
    };
  }

  const kind = str(formData.get("kind")) === "fixed" ? "fixed" : "percent";
  const raw = num(formData.get("value"));
  if (!(raw > 0)) return { ok: false, message: "أدخل قيمة الخصم" };
  if (kind === "percent" && raw > 100) {
    return { ok: false, message: "النسبة لا تتجاوز 100%" };
  }

  const expires = str(formData.get("expiresAt"));
  const data = {
    code,
    kind,
    // المبلغ الثابت يُدخَل بالفرنك ويُخزَّن بأصغر وحدة مثل أسعار الباقات
    value: kind === "fixed" ? Math.round(raw * 100) : Math.round(raw),
    owner: str(formData.get("owner")) || null,
    description: str(formData.get("description")) || null,
    planCodes: JSON.stringify(
      formData.getAll("planCodes").map(String).filter(Boolean),
    ),
    maxUses: Math.max(0, Math.round(num(formData.get("maxUses")))),
    expiresAt: expires ? new Date(`${expires}T23:59:59`) : null,
    isActive: bool(formData.get("isActive")),
  };

  const id = str(formData.get("id"));
  try {
    if (id) await db.coupon.update({ where: { id }, data });
    else await db.coupon.create({ data });
  } catch {
    return { ok: false, message: `الكود ${code} مستعمل من قبل — اختر كودًا آخر` };
  }

  refresh();
  revalidatePath("/admin/coupons");
  return { ok: true, message: id ? `حُدّث الكود ${code}` : `أُنشئ الكود ${code}` };
}

export async function toggleCouponAction(id: string): Promise<AdminResult> {
  await guard();
  const coupon = await db.coupon.findUnique({ where: { id } });
  if (!coupon) return { ok: false, message: "الكود غير موجود" };
  await db.coupon.update({
    where: { id },
    data: { isActive: !coupon.isActive },
  });
  revalidatePath("/admin/coupons");
  return {
    ok: true,
    message: coupon.isActive ? `أُوقف الكود ${coupon.code}` : `فُعّل الكود ${coupon.code}`,
  };
}

export async function deleteCouponAction(id: string): Promise<AdminResult> {
  await guard();
  // عمليات الدفع السابقة تبقى محفوظة (couponId ← null)
  const coupon = await db.coupon.delete({ where: { id } }).catch(() => null);
  if (!coupon) return { ok: false, message: "الكود غير موجود" };
  revalidatePath("/admin/coupons");
  return { ok: true, message: `حُذف الكود ${coupon.code}` };
}

/* ═══════════════════════ صور الواجهة ═══════════════════════ */

/** يقبل ملفًا مرفوعًا أو اختيارًا من الصور الجاهزة، ويعيد المسار */
async function resolveImageInput(
  formData: FormData,
): Promise<{ url: string | null; error?: string }> {
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    try {
      const stored = await saveUpload(file, "site");
      return { url: stored.url };
    } catch (error) {
      return {
        url: null,
        error:
          error instanceof UploadError ? error.message : "تعذّر رفع الصورة",
      };
    }
  }
  const picked = str(formData.get("pick"));
  return { url: picked || null };
}

/**
 * حفظ صورة في الصفحة الرئيسية.
 * slot = "hero" لبطاقة الأستاذ، أو رقم الموضع في شبكة الملصقات.
 */
export async function saveSiteImageAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const slot = str(formData.get("slot"));
  const { url, error } = await resolveImageInput(formData);
  if (error) return { ok: false, message: error };

  const settings = await getSettings();

  if (slot === "hero") {
    if (!url) return { ok: false, message: "اختر صورة أو ارفع ملفًا أولًا" };
    await setSetting("site.heroImage", url, "site");
    revalidatePath("/");
    return { ok: true, message: "حُدّثت صورة الأستاذ في الصفحة الرئيسية" };
  }

  const index = Number(slot);
  const gallery = [...settings["site.gallery"]];
  const alt = str(formData.get("alt"));

  if (slot === "new") {
    if (!url) return { ok: false, message: "اختر صورة أو ارفع ملفًا أولًا" };
    if (gallery.length >= 8) {
      return { ok: false, message: "الحدّ الأقصى ٨ صور في الشبكة" };
    }
    gallery.push({ src: url, alt: alt || "صورة من البرنامج" });
  } else {
    if (!Number.isInteger(index) || index < 0 || index >= gallery.length) {
      return { ok: false, message: "موضع غير صالح" };
    }
    const current = gallery[index];
    const nextSrc = url ?? current.src;
    if (!nextSrc) return { ok: false, message: "اختر صورة أو ارفع ملفًا أولًا" };
    gallery[index] = { src: nextSrc, alt: alt || current.alt };
  }

  await setSetting("site.gallery", gallery, "site");
  revalidatePath("/");
  return {
    ok: true,
    message:
      slot === "new"
        ? "أُضيفت الصورة إلى الشبكة"
        : url
          ? "حُدّثت الصورة"
          : "حُدّث وصف الصورة",
  };
}

export async function removeSiteImageAction(
  index: number,
): Promise<AdminResult> {
  await guard();
  const settings = await getSettings();
  const gallery = settings["site.gallery"].filter((_, i) => i !== index);
  if (gallery.length < 2) {
    return { ok: false, message: "يجب إبقاء صورتين على الأقل في الشبكة" };
  }
  await setSetting("site.gallery", gallery, "site");
  revalidatePath("/");
  refresh();
  return { ok: true, message: "حُذفت الصورة من الشبكة" };
}

/** تحريك صورة داخل الشبكة */
export async function moveSiteImageAction(
  index: number,
  direction: "up" | "down",
): Promise<AdminResult> {
  await guard();
  const settings = await getSettings();
  const gallery = [...settings["site.gallery"]];
  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= gallery.length) {
    return { ok: false, message: "لا يمكن التحريك أبعد من ذلك" };
  }
  [gallery[index], gallery[target]] = [gallery[target], gallery[index]];
  await setSetting("site.gallery", gallery, "site");
  revalidatePath("/");
  refresh();
  return { ok: true, message: "تمّ الترتيب" };
}

/**
 * فيديو التعريف في الصفحة الرئيسية.
 * الرابط إمّا يوتيوب/فيميو، أو مسار ملف رُفع عبر /api/admin/upload-video.
 */
export async function saveIntroVideoAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();
  const settings = await getSettings();
  const current = settings["site.introVideo"];

  const url = str(formData.get("url"));
  if (url && toEmbed(url).kind === "none") {
    return {
      ok: false,
      message: "الرابط غير مفهوم — ألصق رابط يوتيوب أو فيميو كاملًا",
    };
  }

  // صورة غلاف اختيارية
  let poster = str(formData.get("keepPoster")) === "0" ? "" : current.poster;
  const file = formData.get("posterFile");
  if (file instanceof File && file.size > 0) {
    try {
      poster = (await saveUpload(file, "site")).url;
    } catch (error) {
      return {
        ok: false,
        message:
          error instanceof UploadError ? error.message : "تعذّر رفع صورة الغلاف",
      };
    }
  }

  await setSetting(
    "site.introVideo",
    {
      url,
      title: str(formData.get("title")) || current.title,
      description: str(formData.get("description")),
      poster,
    },
    "site",
  );
  revalidatePath("/");
  refresh();
  return {
    ok: true,
    message: url
      ? "حُفظ فيديو التعريف — يظهر الآن بعد أعلى الصفحة الرئيسية"
      : "حُذف الرابط — قسم الفيديو مخفي عن الزوّار",
  };
}

/** العودة إلى صور الهوية الأصلية */
export async function resetSiteImagesAction(): Promise<AdminResult> {
  await guard();
  await db.setting.deleteMany({
    where: { key: { in: ["site.heroImage", "site.gallery"] } },
  });
  revalidatePath("/");
  refresh();
  return { ok: true, message: "أُعيدت الصور الأصلية" };
}

/* ═══════════════════════ الإعدادات ═══════════════════════ */

export async function saveSettingsAction(
  _prev: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await guard();

  const booleans = [
    "learning.sequential",
    "learning.sequentialAcrossTracks",
    "learning.requireQuizToAdvance",
    "learning.allowRewatch",
    "quiz.showCorrectAnswers",
    "certificate.enabled",
    "payment.autoActivate",
    "site.registrationOpen",
  ];
  const numbers = ["quiz.defaultPassScore", "certificate.minCompletion"];
  const strings = ["site.whatsapp", "site.supportEmail"];

  for (const key of booleans) {
    await setSetting(key, bool(formData.get(key)), key.split(".")[0]);
  }
  for (const key of numbers) {
    await setSetting(key, num(formData.get(key)), key.split(".")[0]);
  }
  for (const key of strings) {
    await setSetting(key, str(formData.get(key)), key.split(".")[0]);
  }

  refresh();
  return { ok: true, message: "حُفظت الإعدادات" };
}
