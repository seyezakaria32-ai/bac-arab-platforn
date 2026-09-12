import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { db } from "./db";
import { ROLES } from "./constants";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  signSession,
  verifySession,
  type SessionPayload,
} from "./jwt";

/**
 * طبقة المصادقة — مبنية على JWT موقّع داخل كوكي httpOnly.
 * مفصولة عمدًا في ملف واحد حتى يسهل استبدالها لاحقًا بـ Auth.js/NextAuth
 * أو بمزوّد خارجي دون لمس بقية التطبيق.
 */

export async function hashPassword(plain: string) {
  return bcrypt.hash(plain, 12);
}

export async function verifyPassword(plain: string, hash: string) {
  return bcrypt.compare(plain, hash);
}

export async function createSessionCookie(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}) {
  const token = await signSession({
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  });
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** قراءة الجلسة من الكوكي دون لمس قاعدة البيانات */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  return verifySession(store.get(SESSION_COOKIE)?.value);
}

/** المستخدم الحالي من قاعدة البيانات (مع تخزين مؤقت داخل الطلب الواحد) */
export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  const user = await db.user.findUnique({
    where: { id: session.sub },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      avatarUrl: true,
      bio: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user || !user.isActive) return null;
  return user;
});

export type CurrentUser = NonNullable<
  Awaited<ReturnType<typeof getCurrentUser>>
>;

/** يفرض تسجيل الدخول — يعيد التوجيه إلى صفحة الدخول عند غيابه */
export async function requireUser(redirectTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const next = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : "";
    redirect(`/login${next}`);
  }
  return user;
}

/** يفرض صلاحية المسؤول */
export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser("/admin");
  if (user.role !== ROLES.ADMIN) redirect("/dashboard");
  return user;
}

/** تحديث آخر ظهور للطالب (لإحصائية «الطلاب المتوقفون») */
export async function touchLastSeen(userId: string) {
  await db.user
    .update({ where: { id: userId }, data: { lastSeenAt: new Date() } })
    .catch(() => null);
}
