import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    // مصادر الصور الخارجية المسموح بها (صور الطلاب، أغلفة الدروس، CDN الفيديو)
    remotePatterns: [
      { protocol: "https", hostname: "**.youtube.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "**.vimeocdn.com" },
      { protocol: "https", hostname: "**.b-cdn.net" },
    ],
  },
  eslint: { ignoreDuringBuilds: true },
  experimental: {
    // الحدّ الافتراضي ١ ميغابايت — نرفعه ليتّسع لرفع الصور (حتى ٨ ميغابايت)
    // الفيديو لا يمرّ من هنا: له مسار رفع مستقلّ يكتب على القرص تدريجيًا
    serverActions: { bodySizeLimit: "10mb" },
  },
};

export default nextConfig;
