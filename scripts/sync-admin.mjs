import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

/**
 * مزامنة حساب المسؤول مع متغيّرات البيئة عند كل إقلاع.
 *
 * لماذا: ADMIN_EMAIL وADMIN_PASSWORD كانا يُقرآن في البذر وحده، أي مرّة واحدة
 * عند إنشاء القاعدة. تغييرهما لاحقًا في لوحة الاستضافة لم يكن يغيّر شيئًا،
 * والبذر نفسه لا يُعاد لأنه يمحو الدروس وتقدّم الطلبة. الآن المتغيّرات هي
 * المرجع: تغيّرها ← يُعاد النشر ← يعمل الدخول بالقيم الجديدة.
 *
 * لا يطبع كلمة المرور أبدًا: سجلّات الاستضافة تُحفَظ وتُشارَك.
 */

const clean = (v) => {
  if (typeof v !== "string") return "";
  let s = v.trim();
  while (s.length > 1 && /^["']/.test(s) && s.at(-1) === s[0]) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const log = (msg) => console.log("[admin] " + msg);

// صفحة الدخول تحوّل البريد إلى أحرف صغيرة قبل البحث، فنخزّنه كذلك
const email = clean(process.env.ADMIN_EMAIL).toLowerCase();
const password = clean(process.env.ADMIN_PASSWORD);
const name = clean(process.env.ADMIN_NAME) || "الأستاذ زكريا سي";

if (!email || !password) {
  log("ADMIN_EMAIL أو ADMIN_PASSWORD غير مضبوط — لم يُعدَّل حساب المسؤول.");
  process.exit(0);
}
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  log("قيمة ADMIN_EMAIL ليست بريدًا صالحًا: " + email + " — تُخطّيت المزامنة.");
  process.exit(0);
}
if (password.length < 8) {
  log("ADMIN_PASSWORD أقصر من 8 أحرف — رُفض لضعفه وتُخطّيت المزامنة.");
  process.exit(0);
}

const db = new PrismaClient();

try {
  let user = await db.user.findUnique({ where: { email } });

  // حساب أُنشئ سابقًا ببريد فيه أحرف كبيرة لا تجده صفحة الدخول أبدًا: نصحّحه
  if (!user) {
    const admins = await db.user.findMany({ where: { role: "admin" } });
    const mixedCase = admins.find((a) => a.email.toLowerCase() === email);
    if (mixedCase) {
      user = await db.user.update({ where: { id: mixedCase.id }, data: { email } });
      log("صُحّح بريد المسؤول إلى أحرف صغيرة: " + email);
    }
  }

  if (!user) {
    await db.user.create({
      data: {
        email,
        name,
        passwordHash: await bcrypt.hash(password, 12),
        role: "admin",
      },
    });
    log("أُنشئ حساب المسؤول: " + email);
  } else {
    const data = {};
    if (user.role !== "admin") data.role = "admin";
    if (!user.isActive) data.isActive = true;
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      data.passwordHash = await bcrypt.hash(password, 12);
    }
    if (Object.keys(data).length) {
      await db.user.update({ where: { id: user.id }, data });
      log(
        "حُدّث حساب المسؤول " + email + ": " +
          Object.keys(data)
            .map((k) => (k === "passwordHash" ? "كلمة المرور" : k))
            .join("، "),
      );
    } else {
      log("حساب المسؤول " + email + " مطابق للمتغيّرات.");
    }
  }

  const others = await db.user.findMany({
    where: { role: "admin", NOT: { email } },
    select: { email: true },
  });
  if (others.length) {
    log(
      "تنبيه: حسابات مسؤول أخرى ما زالت فعّالة: " +
        others.map((o) => o.email).join("، ") +
        " — احذفها من لوحة الإدارة إن لم تعد تستعملها.",
    );
  }
} catch (e) {
  // لا نُسقط الموقع كلّه بسبب حساب المسؤول: الطلبة يجب أن يصلوا لدروسهم
  console.warn("[admin] تعذّرت مزامنة حساب المسؤول: " + e.message);
} finally {
  await db.$disconnect();
}
