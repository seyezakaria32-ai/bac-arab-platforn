/**
 * تبديل مزوّد قاعدة البيانات في prisma/schema.prisma
 *
 *   node scripts/switch-db.mjs sqlite      → تطوير محلي فوري بملف dev.db
 *   node scripts/switch-db.mjs postgresql  → الإنتاج (Neon / Supabase / خادم خاص)
 *
 * المخطط مكتوب عمدًا بأنواع متوافقة مع المزوّدين (لا Enum ولا Json)
 * لذلك التبديل لا يتطلّب أي تعديل آخر في الكود.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const schemaPath = resolve(root, "prisma/schema.prisma");
const envPath = resolve(root, ".env");

const target = (process.argv[2] || "").toLowerCase();
if (!["sqlite", "postgresql"].includes(target)) {
  console.error("الاستعمال: node scripts/switch-db.mjs <sqlite|postgresql>");
  process.exit(1);
}

const schema = readFileSync(schemaPath, "utf8");
const updated = schema.replace(
  /(datasource\s+db\s*\{[^}]*?provider\s*=\s*")[^"]+(")/s,
  `$1${target}$2`,
);
writeFileSync(schemaPath, updated, "utf8");

// تحديث DATABASE_URL في .env إن كان موجودًا وكان يشير للمزوّد الآخر
if (existsSync(envPath)) {
  const env = readFileSync(envPath, "utf8");
  const isSqliteUrl = /^DATABASE_URL="?file:/m.test(env);
  if (target === "sqlite" && !isSqliteUrl) {
    console.log('⚠️  تذكير: عيّن DATABASE_URL="file:./dev.db" في ملف .env');
  }
  if (target === "postgresql" && isSqliteUrl) {
    console.log("⚠️  تذكير: عيّن DATABASE_URL إلى رابط PostgreSQL في ملف .env");
  }
}

console.log(`✅ تم ضبط مزوّد قاعدة البيانات على: ${target}`);
console.log("   التالي:  npx prisma db push  ثم  npm run db:seed");
