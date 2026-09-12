"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  createSessionCookie,
  destroySessionCookie,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export type AuthState = { error?: string; field?: string } | null;

const safeNext = (next: unknown) => {
  const value = typeof next === "string" ? next : "";
  // نقبل المسارات الداخلية فقط، منعًا لإعادة التوجيه إلى موقع خارجي
  return value.startsWith("/") && !value.startsWith("//") ? value : "";
};

/* ───────────────────────────── التسجيل ───────────────────────────── */

const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "الاسم قصير جدًا — اكتب اسمك الكامل")
    .max(80, "الاسم طويل جدًا"),
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  phone: z.string().trim().max(30).optional(),
  password: z
    .string()
    .min(8, "كلمة المرور يجب ألّا تقلّ عن ٨ أحرف")
    .max(72, "كلمة المرور طويلة جدًا"),
});

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const settings = await getSettings();
  if (!settings["site.registrationOpen"]) {
    return { error: "التسجيل مغلق حاليًا. تواصل معنا عبر واتساب." };
  }

  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0]) };
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return {
      error: "هذا البريد مسجَّل بالفعل — سجّل الدخول بدلًا من ذلك.",
      field: "email",
    };
  }

  const user = await db.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: "student",
    },
  });

  await createSessionCookie(user);

  const next = safeNext(formData.get("next"));
  redirect(next || "/dashboard");
}

/* ─────────────────────────── تسجيل الدخول ─────────────────────────── */

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("البريد الإلكتروني غير صحيح"),
  password: z.string().min(1, "أدخل كلمة المرور"),
});

export async function loginAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue.message, field: String(issue.path[0]) };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // رسالة موحّدة حتى لا نكشف أي البريدَين مسجَّل
  const invalid = { error: "البريد الإلكتروني أو كلمة المرور غير صحيحة." };
  if (!user) return invalid;

  const ok = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!ok) return invalid;

  if (!user.isActive) {
    return { error: "حسابك موقوف. تواصل مع الإدارة." };
  }

  await createSessionCookie(user);
  await db.user.update({
    where: { id: user.id },
    data: { lastSeenAt: new Date() },
  });

  const next = safeNext(formData.get("next"));
  redirect(next || (user.role === "admin" ? "/admin" : "/dashboard"));
}

/* ─────────────────────────── تسجيل الخروج ─────────────────────────── */

export async function logoutAction() {
  await destroySessionCookie();
  redirect("/");
}
