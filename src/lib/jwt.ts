import { SignJWT, jwtVerify } from "jose";

/**
 * توقيع/تحقق الجلسات — متوافق مع Edge Runtime (يُستعمل في middleware.ts)
 * لا يستورد Prisma ولا bcrypt حتى يبقى خفيفًا وقابلًا للتشغيل على الحافة.
 */

export type SessionPayload = {
  sub: string; // معرّف المستخدم
  email: string;
  name: string;
  role: string;
};

const SESSION_DAYS = Number(process.env.AUTH_SESSION_DAYS ?? 30);
export const SESSION_COOKIE = "bac_session";
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;

function secretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET غير معرّف أو قصير جدًا — أضفه إلى ملف .env قبل التشغيل.",
    );
  }
  return new TextEncoder().encode(secret);
}

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setSubject(payload.sub)
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(secretKey());
}

export async function verifySession(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: String(payload.role ?? "student"),
    };
  } catch {
    return null;
  }
}
