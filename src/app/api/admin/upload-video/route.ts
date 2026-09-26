import { NextResponse } from "next/server";
import { createWriteStream } from "node:fs";
import { mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

/**
 * رفع فيديو من لوحة الإدارة.
 * لا نمرّره عبر Server Action (حدّها ١٠ ميغابايت ويُحمَّل الملف كاملًا في الذاكرة)،
 * بل نكتب جسم الطلب على القرص تدريجيًا مع حدّ أقصى للحجم.
 */

export const runtime = "nodejs";

const MAX_BYTES = 300 * 1024 * 1024; // 300 ميغابايت

const TYPES: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

function fail(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) return fail("غير مصرّح", 403);

  const type = (req.headers.get("content-type") ?? "").split(";")[0].trim();
  const ext = TYPES[type];
  if (!ext) return fail("صيغة غير مدعومة — المسموح: MP4 أو WEBM", 415);

  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) return fail("حجم الفيديو يتجاوز ٣٠٠ ميغابايت", 413);
  if (!req.body) return fail("لم يُرسَل أي ملف", 400);

  // resolve لا join — انظر saveUpload في src/lib/storage.ts
  const dir = path.resolve(
    process.cwd(),
    process.env.STORAGE_LOCAL_DIR ?? "uploads",
    "videos",
  );
  await mkdir(dir, { recursive: true });
  const name = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  const target = path.join(dir, name);

  let bytes = 0;
  const limiter = new Transform({
    transform(chunk: Buffer, _enc, cb) {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) cb(new Error("too-large"));
      else cb(null, chunk);
    },
  });

  try {
    await pipeline(
      Readable.fromWeb(req.body as unknown as NodeReadableStream),
      limiter,
      createWriteStream(target),
    );
  } catch (error) {
    await unlink(target).catch(() => {});
    return error instanceof Error && error.message === "too-large"
      ? fail("حجم الفيديو يتجاوز ٣٠٠ ميغابايت", 413)
      : fail("انقطع الرفع — أعد المحاولة", 500);
  }

  if (bytes === 0) {
    await unlink(target).catch(() => {});
    return fail("الملف فارغ", 400);
  }

  return NextResponse.json({ url: `/uploads/videos/${name}`, size: bytes });
}
