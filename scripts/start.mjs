import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";

/**
 * تشغيل المنصّة في الإنتاج.
 *
 * لماذا سكربت بدل أمر مباشر: لوحات الاستضافة تُدخَل فيها المتغيّرات يدويًا،
 * وأشيع خطأ هو نسخ القيمة مع علامتَي التنصيص ("file:/data/app.db")، فيفشل
 * Prisma برسالة غامضة. هنا ننظّف القيم ونشرح الخطأ بالعربية قبل الإقلاع.
 */

const clean = (v) => {
  if (typeof v !== "string") return "";
  let s = v.trim();
  // إزالة تنصيص محيط بالقيمة (خطأ نسخ شائع في لوحات الاستضافة)
  while (s.length > 1 && /^["']/.test(s) && s.at(-1) === s[0]) {
    s = s.slice(1, -1).trim();
  }
  return s;
};

const fail = (message) => {
  console.error("\n✖ تعذّر تشغيل المنصّة: " + message + "\n");
  process.exit(1);
};

/* ── قاعدة البيانات ── */
let dbUrl = clean(process.env.DATABASE_URL);
if (!dbUrl) {
  fail(
    "المتغيّر DATABASE_URL غير مضبوط.\n" +
      "  أضفه في إعدادات الاستضافة بالقيمة (بلا تنصيص):  file:/data/app.db",
  );
}

const isPostgres = /^postgres(ql)?:\/\//i.test(dbUrl);
if (!isPostgres && !dbUrl.startsWith("file:")) {
  // قيمة مثل /data/app.db أو ./dev.db — نصلحها بدل إسقاط النشر
  if (dbUrl.startsWith("/") || dbUrl.startsWith("./") || dbUrl.endsWith(".db")) {
    console.warn(
      "[start] DATABASE_URL لا يبدأ بـ file: — صُحّح تلقائيًا إلى file:" + dbUrl,
    );
    dbUrl = "file:" + dbUrl;
  } else {
    fail(
      "قيمة DATABASE_URL غير صالحة: " + dbUrl + "\n" +
        "  المتوقّع لقاعدة SQLite:  file:/data/app.db",
    );
  }
}
process.env.DATABASE_URL = dbUrl;

// ملف SQLite على قرص دائم: نتأكّد من وجود المجلّد قبل أن يكتب Prisma
if (dbUrl.startsWith("file:")) {
  const dir = path.dirname(dbUrl.slice("file:".length));
  if (dir && dir !== ".") {
    try {
      mkdirSync(dir, { recursive: true });
    } catch (e) {
      console.warn("[start] تعذّر إنشاء مجلّد قاعدة البيانات " + dir + ": " + e.message);
    }
  }
}

/* ── مجلّد الملفات المرفوعة ── */
const storageDir = clean(process.env.STORAGE_LOCAL_DIR);
if (storageDir) {
  process.env.STORAGE_LOCAL_DIR = storageDir;
  try {
    mkdirSync(storageDir, { recursive: true });
  } catch (e) {
    console.warn("[start] تعذّر إنشاء مجلّد الملفات " + storageDir + ": " + e.message);
  }
}

/* ── متغيّرات أخرى تُنظَّف من التنصيص ── */
for (const key of [
  "NEXT_PUBLIC_SITE_URL",
  "AUTH_SECRET",
  "STORAGE_DRIVER",
  "PAYMENT_PROVIDERS",
  "PAYMENT_CURRENCY",
  "BICTORYS_BASE_URL",
  "BICTORYS_SECRET_KEY",
  "BICTORYS_PUBLIC_KEY",
  "BICTORYS_WEBHOOK_SECRET",
  "BICTORYS_COUNTRY",
]) {
  if (process.env[key]) process.env[key] = clean(process.env[key]);
}

if (!clean(process.env.AUTH_SECRET)) {
  fail(
    "المتغيّر AUTH_SECRET غير مضبوط — لا يمكن توقيع جلسات الدخول.\n" +
      '  ولّد مفتاحًا:  node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"',
  );
}

/* ── تهيئة الجداول ثم تشغيل الخادم ── */
/**
 * نشغّل أدوات المشروع من ملفّاتها داخل node_modules عبر Node نفسه، لا باسمها
 * المجرّد: الاسم المجرّد لا يعمل إلا إذا كان node_modules/.bin في مسار النظام،
 * وهو ما يحدث عند التشغيل عبر npm فقط.
 */
const entry = (...parts) => path.join(process.cwd(), "node_modules", ...parts);

const runNode = (scriptPath, args, label) => {
  if (!existsSync(scriptPath)) {
    fail("لم أجد " + label + " في node_modules — شغّل npm ci أولًا.");
  }
  return spawnSync(process.execPath, [scriptPath, ...args], { stdio: "inherit" });
};

console.log("[start] تهيئة قاعدة البيانات: " + dbUrl);
const push = runNode(
  entry("prisma", "build", "index.js"),
  ["db", "push", "--skip-generate", "--accept-data-loss"],
  "أداة prisma",
);
if (push.status !== 0) {
  fail("فشل إنشاء جداول قاعدة البيانات (prisma db push).");
}

const server = runNode(entry("next", "dist", "bin", "next"), ["start"], "خادم next");
process.exit(server.status ?? 1);
