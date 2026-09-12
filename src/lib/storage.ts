import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

/**
 * طبقة التخزين — القرص المحلي افتراضيًا، مع واجهة واحدة تسمح
 * بالانتقال إلى S3 / Bunny / Cloudflare R2 بتغيير STORAGE_DRIVER فقط.
 */

export type StoredFile = { url: string; name: string; size: number };

const MAX_BYTES = 8 * 1024 * 1024; // 8 ميغابايت

const ALLOWED = new Map<string, string>([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["application/pdf", "pdf"],
]);

export class UploadError extends Error {}

export async function saveUpload(
  file: File,
  folder = "misc",
): Promise<StoredFile> {
  if (!file || file.size === 0) throw new UploadError("لم يُختَر أي ملف");
  if (file.size > MAX_BYTES)
    throw new UploadError("حجم الملف يتجاوز ٨ ميغابايت");

  const ext = ALLOWED.get(file.type);
  if (!ext)
    throw new UploadError("صيغة غير مدعومة — المسموح: JPG، PNG، WEBP، PDF");

  const driver = process.env.STORAGE_DRIVER ?? "local";
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const safeFolder = folder.replace(/[^a-z0-9_-]/gi, "");

  if (driver === "local") {
    // خارج public عمدًا: تُقدَّم عبر مسار /uploads حتى تعمل بعد النشر،
    // وعلى الخادم يشير المتغيّر إلى قرص دائم (مثال: /data/uploads)
    const baseDir = process.env.STORAGE_LOCAL_DIR ?? "uploads";
    const dir = path.join(process.cwd(), baseDir, safeFolder);
    await mkdir(dir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(dir, name), buffer);
    return {
      url: `/uploads/${safeFolder}/${name}`,
      name: file.name,
      size: file.size,
    };
  }

  // للتوسّع لاحقًا: S3 / Bunny — نفس التوقيع، تنفيذ مختلف
  throw new UploadError(
    `مزوّد التخزين «${driver}» غير مُنفَّذ بعد — استعمل STORAGE_DRIVER=local`,
  );
}
