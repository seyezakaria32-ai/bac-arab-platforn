import "server-only";
import { db } from "@/lib/db";
import { getPublicCurriculum } from "@/lib/curriculum";
import { getSettings } from "@/lib/settings";
import { getBlocksByPlacement } from "@/lib/blocks";
import { toEmbed } from "@/lib/video";
import type { SectionContext } from "@/components/sections/shared";
import { getHomeSections } from "./server";

/**
 * ما تحتاجه الأقسام من خارجها — للصفحة الرئيسية ولمعاينة الأقسام في لوحة
 * الإدارة معًا، فتُطابق المعاينةُ الموقع.
 */
export async function getSectionContext(): Promise<SectionContext> {
  const [course, plans, settings, blocks, sections] = await Promise.all([
    getPublicCurriculum(),
    db.plan.findMany({ where: { isActive: true }, orderBy: { order: "asc" } }),
    getSettings(),
    getBlocksByPlacement("home"),
    getHomeSections(),
  ]);

  const tracks = course?.tracks ?? [];
  const lessons = tracks.reduce((n, t) => n + t.modules.reduce((m, mod) => m + mod.lessons.length, 0), 0);
  const modules = tracks.reduce((n, t) => n + t.modules.length, 0);
  const minutes = tracks.reduce(
    (n, t) => n + t.modules.reduce((m, mod) => m + mod.lessons.reduce((s, l) => s + l.durationMinutes, 0), 0),
    0,
  );

  const hero = sections.find((s) => s.type === "hero");
  const heroImage = (typeof hero?.values.image === "string" && hero.values.image) || settings["site.heroImage"];
  const intro = settings["site.introVideo"];

  return {
    counts: { lessons, modules, hours: Math.round(minutes / 60) },
    tracks,
    plans,
    intro,
    introEmbed: toEmbed(intro.url),
    blocks,
    heroImage,
  };
}
