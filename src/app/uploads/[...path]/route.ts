import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { ROLES } from "@/lib/constants";

/**
 * تقديم الملفات المرفوعة (صور الواجهة، موارد الدروس، الإيصالات، الفيديو).
 *
 * لماذا مسار بدل مجلّد public: في الإنتاج لا يقدّم Next إلا ملفات public
 * الموجودة لحظة البناء، فأي ملف يُرفع بعد النشر يعطي 404. وهذا المسار يقرأ
 * من STORAGE_LOCAL_DIR، وهو على الخادم قرص دائم خارج مجلّد المشروع.
 *
 * وفيه أيضًا ما لا يوفّره مجلّد public: إيصالات الدفع لم تعد مكشوفة لمن
 * يعرف رابطها، بل للمسؤول وحده.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

/** المجلّدات التي لا تُعرض إلا للمسؤول */
const PRIVATE_FOLDERS = new Set(["receipts"]);

function deny(message: string, status: number) {
  return new NextResponse(message, { status });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  if (!segments?.length) return deny("غير موجود", 404);

  // منع الخروج من مجلّد التخزين (../ أو مسارات مطلقة)
  const unsafe = segments.some(
    (s) => !s || s === "." || s.includes("..") || s.includes("/") || s.includes("\\"),
  );
  if (unsafe) return deny("مسار غير صالح", 400);

  if (PRIVATE_FOLDERS.has(segments[0])) {
    const user = await getCurrentUser();
    if (!user || user.role !== ROLES.ADMIN) return deny("غير مصرّح", 403);
  }

  const baseDir = path.resolve(
    process.cwd(),
    process.env.STORAGE_LOCAL_DIR ?? "uploads",
  );
  const filePath = path.resolve(baseDir, ...segments);
  // تحقّق ثانٍ بعد التطبيع، احتياطًا
  if (!filePath.startsWith(baseDir + path.sep)) return deny("مسار غير صالح", 400);

  const info = await stat(filePath).catch(() => null);
  if (!info?.isFile()) return deny("الملف غير موجود", 404);

  const type = TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
  const isPrivate = PRIVATE_FOLDERS.has(segments[0]);
  const headers: Record<string, string> = {
    "content-type": type,
    "accept-ranges": "bytes",
    // أسماء الملفات عشوائية ولا تتغيّر، فالتخزين المؤقّت الطويل آمن
    "cache-control": isPrivate
      ? "private, no-store"
      : "public, max-age=31536000, immutable",
    "x-content-type-options": "nosniff",
  };

  // دعم Range ليعمل التنقّل داخل الفيديو
  const range = req.headers.get("range");
  const match = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null;
  if (match) {
    const size = info.size;
    const start = match[1] ? Number(match[1]) : 0;
    const end = match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;

    if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) {
      return new NextResponse(null, {
        status: 416,
        headers: { "content-range": `bytes */${size}` },
      });
    }

    const stream = Readable.toWeb(
      createReadStream(filePath, { start, end }),
    ) as unknown as ReadableStream;

    return new NextResponse(stream, {
      status: 206,
      headers: {
        ...headers,
        "content-range": `bytes ${start}-${end}/${size}`,
        "content-length": String(end - start + 1),
      },
    });
  }

  const stream = Readable.toWeb(
    createReadStream(filePath),
  ) as unknown as ReadableStream;

  return new NextResponse(stream, {
    status: 200,
    headers: { ...headers, "content-length": String(info.size) },
  });
}
