import type { SVGProps } from "react";

/** مجموعة أيقونات خفيفة مرسومة يدويًا — بلا أي مكتبة خارجية */

type P = SVGProps<SVGSVGElement>;

function Svg({ children, ...p }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      width="1em"
      height="1em"
      {...p}
    >
      {children}
    </svg>
  );
}

export const IconCheck = (p: P) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const IconCheckCircle = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8.5 12.2 2.4 2.4 4.6-5" />
  </Svg>
);

export const IconLock = (p: P) => (
  <Svg {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" />
  </Svg>
);

export const IconPlay = (p: P) => (
  <Svg {...p}>
    <path d="M8.5 6.2 18 12l-9.5 5.8V6.2Z" fill="currentColor" strokeWidth={1.4} />
  </Svg>
);

export const IconPause = (p: P) => (
  <Svg {...p}>
    <rect x="7" y="6" width="3.2" height="12" rx="1" fill="currentColor" stroke="none" />
    <rect x="13.8" y="6" width="3.2" height="12" rx="1" fill="currentColor" stroke="none" />
  </Svg>
);

export const IconPlayCircle = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M10.4 9.2 15 12l-4.6 2.8V9.2Z" fill="currentColor" strokeWidth={1.2} />
  </Svg>
);

export const IconCircle = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8" />
  </Svg>
);

export const IconChevronDown = (p: P) => (
  <Svg {...p}>
    <path d="m6 9.5 6 6 6-6" />
  </Svg>
);

/** سهم "التالي" في واجهة RTL يشير إلى اليسار */
export const IconArrowNext = (p: P) => (
  <Svg {...p}>
    <path d="M19 12H5m0 0 6-6m-6 6 6 6" />
  </Svg>
);

/** سهم "السابق" في واجهة RTL يشير إلى اليمين */
export const IconArrowPrev = (p: P) => (
  <Svg {...p}>
    <path d="M5 12h14m0 0-6-6m6 6-6 6" />
  </Svg>
);

export const IconDocument = (p: P) => (
  <Svg {...p}>
    <path d="M14 3.5H7.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V8l-4.5-4.5Z" />
    <path d="M14 3.5V8h4.5" />
  </Svg>
);

export const IconDownload = (p: P) => (
  <Svg {...p}>
    <path d="M12 4v10m0 0 3.5-3.5M12 14l-3.5-3.5" />
    <path d="M5 16.5v1.8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.8" />
  </Svg>
);

export const IconClock = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
);

export const IconAward = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="9.5" r="5.5" />
    <path d="m8.5 14.2-1.3 6.3 4.8-2.6 4.8 2.6-1.3-6.3" />
  </Svg>
);

export const IconUsers = (p: P) => (
  <Svg {...p}>
    <circle cx="9.5" cy="8.5" r="3.3" />
    <path d="M3.5 20c0-3.2 2.7-5.3 6-5.3s6 2.1 6 5.3" />
    <path d="M16.5 6.3a3.2 3.2 0 0 1 0 6.2M17.5 14.9c2 .6 3.4 2.2 3.4 4.4" />
  </Svg>
);

export const IconChart = (p: P) => (
  <Svg {...p}>
    <path d="M4 20h16" />
    <rect x="6" y="11" width="3.4" height="6" rx="1" />
    <rect x="11.5" y="7" width="3.4" height="10" rx="1" />
    <rect x="17" y="13.5" width="3" height="3.5" rx="1" />
  </Svg>
);

export const IconPieChart = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12V3.5Z" />
    <path d="M15 3.9A8.5 8.5 0 0 1 20.1 9H15V3.9Z" />
  </Svg>
);

export const IconBook = (p: P) => (
  <Svg {...p}>
    <path d="M19.5 4.5v13.2c0 .7-.6 1.3-1.3 1.3H7.6a2.1 2.1 0 0 0-2.1 2.1V6.6a2.1 2.1 0 0 1 2.1-2.1h11.9Z" />
    <path d="M5.5 18.2a2.1 2.1 0 0 1 2.1-1.5h11.9" />
  </Svg>
);

export const IconMap = (p: P) => (
  <Svg {...p}>
    <path d="m3.5 6.8 5.5-2.3 6 2.3 5.5-2.3v12.7l-5.5 2.3-6-2.3-5.5 2.3V6.8Z" />
    <path d="M9 4.5v14.7M15 6.8v14.5" />
  </Svg>
);

export const IconSparkle = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.2l-1.8-5.6-5.7-1.8L10.2 9 12 3.5Z" />
  </Svg>
);

export const IconSettings = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 14.5a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-2.7 1.1v.3a2 2 0 1 1-4 0v-.2a1.6 1.6 0 0 0-2.8-1.1l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0-1.1-2.7H3a2 2 0 1 1 0-4h.2a1.6 1.6 0 0 0 1.1-2.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 2.7-1.1V3a2 2 0 1 1 4 0v.2a1.6 1.6 0 0 0 2.8 1.1l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0 1.1 2.7h.3a2 2 0 1 1 0 4h-.2a1.6 1.6 0 0 0-1.5 1.1Z" />
  </Svg>
);

export const IconLogout = (p: P) => (
  <Svg {...p}>
    <path d="M15 5.5H7.5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2H15" />
    <path d="M11 12h9m0 0-3-3m3 3-3 3" />
  </Svg>
);

export const IconMenu = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);

export const IconClose = (p: P) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const IconUpload = (p: P) => (
  <Svg {...p}>
    <path d="M12 16V5m0 0L8.5 8.5M12 5l3.5 3.5" />
    <path d="M5 16.5v1.8a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1.8" />
  </Svg>
);

export const IconWallet = (p: P) => (
  <Svg {...p}>
    <rect x="3.5" y="6" width="17" height="13" rx="2.5" />
    <path d="M3.5 10h17M16.5 14.5h1.5" />
  </Svg>
);

export const IconShield = (p: P) => (
  <Svg {...p}>
    <path d="M12 3.2 19 6v6c0 4.2-2.9 7.4-7 8.8-4.1-1.4-7-4.6-7-8.8V6l7-2.8Z" />
    <path d="m9.2 12 2 2 3.6-4" />
  </Svg>
);

export const IconTarget = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <circle cx="12" cy="12" r="4.5" />
    <circle cx="12" cy="12" r="1" fill="currentColor" />
  </Svg>
);

export const IconEdit = (p: P) => (
  <Svg {...p}>
    <path d="M16.5 4.5a2.1 2.1 0 0 1 3 3L9 18l-4 1 1-4 10.5-10.5Z" />
  </Svg>
);

export const IconTrash = (p: P) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7v11.5a2 2 0 0 0 2 2h7a2 2 0 0 0 2-2V7" />
  </Svg>
);

export const IconPlus = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const IconWhatsapp = (p: P) => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="1em" height="1em" aria-hidden="true" {...p}>
    <path d="M17.5 14.4c-.3-.2-1.8-.9-2-1s-.5-.2-.7.1-.8 1-.9 1.2-.3.2-.6.1a8 8 0 0 1-2.4-1.5 9 9 0 0 1-1.6-2c-.2-.3 0-.5.1-.6l.5-.6.3-.5v-.5l-1-2.3c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4A3.4 3.4 0 0 0 6 9c0 1.5 1.1 3 1.2 3.2A12 12 0 0 0 12 16.8c.7.3 1.2.5 1.6.6a3.9 3.9 0 0 0 1.8.1 2.9 2.9 0 0 0 1.9-1.3 2.4 2.4 0 0 0 .2-1.4l-.5-.3ZM12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.3a8.3 8.3 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.3 8.3 0 1 1 12 20.3Z" />
  </svg>
);
