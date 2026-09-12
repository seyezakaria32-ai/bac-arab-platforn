"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword } from "@/lib/auth";

export type ProfileState = { ok: boolean; message: string } | null;

const profileSchema = z.object({
  name: z.string().trim().min(3, "الاسم قصير جدًا").max(80),
  phone: z.string().trim().max(30).optional(),
});

export async function updateProfileAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, message: "يجب تسجيل الدخول" };

  const parsed = profileSchema.safeParse({
    name: formData.get("name"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  await db.user.update({
    where: { id: user.id },
    data: { name: parsed.data.name, phone: parsed.data.phone ?? null },
  });

  revalidatePath("/profile");
  return { ok: true, message: "حُفظت بياناتك بنجاح." };
}

const passwordSchema = z
  .object({
    current: z.string().min(1, "أدخل كلمة المرور الحالية"),
    next: z.string().min(8, "كلمة المرور الجديدة يجب ألّا تقلّ عن ٨ أحرف"),
    confirm: z.string(),
  })
  .refine((d) => d.next === d.confirm, {
    message: "كلمتا المرور غير متطابقتين",
    path: ["confirm"],
  });

export async function changePasswordAction(
  _prev: ProfileState,
  formData: FormData,
): Promise<ProfileState> {
  const current = await getCurrentUser();
  if (!current) return { ok: false, message: "يجب تسجيل الدخول" };

  const parsed = passwordSchema.safeParse({
    current: formData.get("current"),
    next: formData.get("next"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0].message };
  }

  const record = await db.user.findUnique({ where: { id: current.id } });
  if (!record) return { ok: false, message: "الحساب غير موجود" };

  const valid = await verifyPassword(parsed.data.current, record.passwordHash);
  if (!valid) return { ok: false, message: "كلمة المرور الحالية غير صحيحة" };

  await db.user.update({
    where: { id: current.id },
    data: { passwordHash: await hashPassword(parsed.data.next) },
  });

  return { ok: true, message: "تمّ تغيير كلمة المرور." };
}
