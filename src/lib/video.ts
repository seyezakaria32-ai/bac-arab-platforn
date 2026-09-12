/**
 * تطبيع روابط الفيديو إلى رابط تضمين صالح.
 * يدعم يوتيوب وفيميو وBunny والروابط المباشرة — وإضافة مزوّد جديد
 * تعني إضافة حالة واحدة هنا فقط.
 */

export type EmbedInfo = {
  kind: "iframe" | "file" | "none";
  src: string | null;
  provider: string;
};

export function toEmbed(
  url: string | null | undefined,
  provider = "youtube",
): EmbedInfo {
  const raw = (url ?? "").trim();
  if (!raw) return { kind: "none", src: null, provider };

  // رابط ملف مباشر
  if (/\.(mp4|webm|ogg|m4v)(\?|$)/i.test(raw) || provider === "direct") {
    return { kind: "file", src: raw, provider: "direct" };
  }

  // يوتيوب
  const yt =
    raw.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/)?.[1] ??
    (provider === "youtube" && /^[\w-]{6,}$/.test(raw) ? raw : null);
  if (yt) {
    return {
      kind: "iframe",
      src: `https://www.youtube-nocookie.com/embed/${yt}?rel=0&modestbranding=1&hl=ar`,
      provider: "youtube",
    };
  }

  // فيميو
  const vimeo = raw.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1];
  if (vimeo) {
    return {
      kind: "iframe",
      src: `https://player.vimeo.com/video/${vimeo}`,
      provider: "vimeo",
    };
  }

  // أي رابط تضمين آخر (Bunny / Mux …)
  if (/^https?:\/\//i.test(raw)) {
    return { kind: "iframe", src: raw, provider };
  }

  return { kind: "none", src: null, provider };
}
