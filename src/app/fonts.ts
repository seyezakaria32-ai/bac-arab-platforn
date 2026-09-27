import {
  IBM_Plex_Sans_Arabic,
  Almarai,
  Readex_Pro,
  Cairo,
  Tajawal,
  Noto_Kufi_Arabic,
  Noto_Naskh_Arabic,
  Amiri,
  Markazi_Text,
  Changa,
  El_Messiri,
  Reem_Kufi,
  Alexandria,
  Zain,
  Harmattan,
  Baloo_Bhaijaan_2,
  Marhey,
  Lalezar,
} from "next/font/google";

/*
 * كل الخطوط التي يختار منها المدير (أسماؤها وأدوارها في src/lib/fonts.ts).
 *
 * تُستضاف مع الموقع عند البناء. تعريفها هنا لا يحمّلها عند الزائر: المتصفّح
 * لا يطلب ملفّ خطّ إلا إن استُعمل في الصفحة. preload: false لكل خطّ غير
 * الثلاثة الافتراضية، وإلا طلب المتصفّح كل الخطوط مسبقًا في كل صفحة.
 */

/* ── الثلاثة الافتراضية — كما كانت تمامًا ── */

/* IBM Plex Sans Arabic: أثقل وزن فيه 700، فأصناف 800/900 تُعرض بـ 700.
 * latin ضروري للأرقام اللاتينية (7,500 فرنك). */
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-plex-arabic",
  display: "swap",
});

/* Almarai: مضغوط، فلا تلتفّ العناوين الطويلة. أرقامه اللاتينية من IBM Plex. */
const almarai = Almarai({
  subsets: ["arabic"],
  weight: ["400", "700", "800"],
  variable: "--font-almarai",
  display: "swap",
});

/* Readex Pro: هندسي واسع، واضح بالأحجام الصغيرة */
const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-readex",
  display: "swap",
});

/* ── الخطوط الاختيارية ──
 * next/font يقرأ الإعدادات قراءةً ثابتة عند البناء، فلا يقبل كائنًا مشتركًا
 * بالنشر (...): display وpreload مكتوبان في كل تعريف. */

const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo", display: "swap", preload: false });
const tajawal = Tajawal({ subsets: ["arabic", "latin"], weight: ["400", "500", "700", "800"], variable: "--font-tajawal", display: "swap", preload: false });
const notoKufi = Noto_Kufi_Arabic({ subsets: ["arabic", "latin"], variable: "--font-noto-kufi", display: "swap", preload: false });
const notoNaskh = Noto_Naskh_Arabic({ subsets: ["arabic", "latin"], variable: "--font-noto-naskh", display: "swap", preload: false });
const amiri = Amiri({ subsets: ["arabic", "latin"], weight: ["400", "700"], variable: "--font-amiri", display: "swap", preload: false });
const markazi = Markazi_Text({ subsets: ["arabic", "latin"], variable: "--font-markazi", display: "swap", preload: false });
const changa = Changa({ subsets: ["arabic", "latin"], variable: "--font-changa", display: "swap", preload: false });
const elMessiri = El_Messiri({ subsets: ["arabic", "latin"], variable: "--font-el-messiri", display: "swap", preload: false });
const reemKufi = Reem_Kufi({ subsets: ["arabic", "latin"], variable: "--font-reem-kufi", display: "swap", preload: false });
const alexandria = Alexandria({ subsets: ["arabic", "latin"], variable: "--font-alexandria", display: "swap", preload: false });
const zain = Zain({ subsets: ["arabic", "latin"], weight: ["400", "700", "800"], variable: "--font-zain", display: "swap", preload: false });
const harmattan = Harmattan({ subsets: ["arabic", "latin"], weight: ["400", "500", "700"], variable: "--font-harmattan", display: "swap", preload: false });
const baloo = Baloo_Bhaijaan_2({ subsets: ["arabic", "latin"], variable: "--font-baloo", display: "swap", preload: false });
const marhey = Marhey({ subsets: ["arabic", "latin"], variable: "--font-marhey", display: "swap", preload: false });
const lalezar = Lalezar({ subsets: ["arabic", "latin"], weight: "400", variable: "--font-lalezar", display: "swap", preload: false });

/** أصناف متغيّرات الخطوط — تُوضع كلّها على <html> فيصير كل خطّ متاحًا للاختيار */
export const fontVariableClasses = [
  plexArabic, almarai, readex, cairo, tajawal, notoKufi, notoNaskh, amiri, markazi,
  changa, elMessiri, reemKufi, alexandria, zain, harmattan, baloo, marhey, lalezar,
]
  .map((f) => f.variable)
  .join(" ");
