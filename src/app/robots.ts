import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site-url";

const base = siteUrl();

/**
 * الصفحة التعريفية مفتوحة لمحرّكات البحث، وكل ما يخصّ الطالب أو الإدارة
 * ممنوع من الفهرسة — وخاصّة إيصالات الدفع.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api/",
          "/uploads/receipts",
          "/dashboard",
          "/learn",
          "/quiz",
          "/profile",
          "/checkout",
          "/certificate",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
