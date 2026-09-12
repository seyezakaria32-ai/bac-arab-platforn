import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ═════════════════════════ عناصر واجهة مشتركة ═════════════════════════ */

const BUTTON_BASE =
  "font-ui inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2";

const BUTTON_VARIANTS = {
  primary:
    "bg-brand-500 text-ink-900 shadow-sm hover:bg-brand-400 hover:shadow-md active:scale-[.98]",
  dark: "bg-ink-900 text-white hover:bg-ink-800 active:scale-[.98]",
  outline:
    "border-2 border-ink-900/15 bg-white text-ink-900 hover:border-brand-500 hover:text-brand-700",
  ghost: "text-ink-700 hover:bg-ink-50",
  gold: "bg-gold-400 text-ink-900 shadow-sm hover:bg-gold-500 active:scale-[.98]",
  danger: "bg-red-600 text-white hover:bg-red-700",
} as const;

const BUTTON_SIZES = {
  sm: "h-9 px-3.5 text-[13px]",
  md: "h-11 px-5 text-sm",
  lg: "h-13 px-7 text-base",
} as const;

export type ButtonVariant = keyof typeof BUTTON_VARIANTS;

export function buttonClass(
  variant: ButtonVariant = "primary",
  size: keyof typeof BUTTON_SIZES = "md",
  extra = "",
) {
  return `${BUTTON_BASE} ${BUTTON_VARIANTS[variant]} ${BUTTON_SIZES[size]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<"button"> & {
  variant?: ButtonVariant;
  size?: keyof typeof BUTTON_SIZES;
}) {
  return (
    <button className={buttonClass(variant, size, className)} {...props} />
  );
}

export function LinkButton({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ComponentProps<typeof Link> & {
  variant?: ButtonVariant;
  size?: keyof typeof BUTTON_SIZES;
}) {
  return <Link className={buttonClass(variant, size, className)} {...props} />;
}

/* ───────────────────────────── شارة ───────────────────────────── */

const BADGE_TONES = {
  brand: "bg-brand-50 text-brand-800 ring-brand-200",
  gold: "bg-gold-50 text-gold-600 ring-gold-100",
  ink: "bg-ink-50 text-ink-700 ring-ink-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-700 ring-amber-200",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
} as const;

export function Badge({
  tone = "brand",
  children,
  className = "",
}: {
  tone?: keyof typeof BADGE_TONES;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`font-ui inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${BADGE_TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

/* ─────────────────────────── شريط التقدّم ─────────────────────────── */

export function ProgressBar({
  value,
  className = "",
  tone = "brand",
  size = "md",
  showLabel = false,
}: {
  value: number;
  className?: string;
  tone?: "brand" | "gold" | "dark";
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const heights = { sm: "h-1.5", md: "h-2.5", lg: "h-3.5" };
  const tones = {
    brand: "bg-brand-500",
    gold: "bg-gold-400",
    dark: "bg-ink-800",
  };

  return (
    <div className={className}>
      <div
        className={`w-full overflow-hidden rounded-full bg-ink-100 ${heights[size]}`}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="نسبة التقدّم"
      >
        <div
          className={`${heights[size]} rounded-full transition-[width] duration-700 ease-out ${tones[tone]}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <div className="mt-1.5 text-left text-xs font-bold text-ink-500">
          <span className="num">{clamped}%</span>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── حلقة تقدّم دائرية ───────────────────────── */

export function ProgressRing({
  value,
  size = 96,
  stroke = 9,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;

  return (
    <div
      className="relative shrink-0"
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${label ?? "التقدّم"}: ${clamped}%`}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-ink-100"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          className="text-brand-500 transition-[stroke-dashoffset] duration-1000 ease-out"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c - (clamped / 100) * c}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <span className="num font-display text-xl font-black text-ink-900">
          {clamped}%
        </span>
      </div>
    </div>
  );
}

/* ─────────────────────────── حالة فارغة ─────────────────────────── */

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-12 text-center">
      {icon && <div className="text-3xl opacity-60">{icon}</div>}
      <h3 className="font-display text-lg font-bold text-ink-900">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm leading-relaxed text-ink-500">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

/* ─────────────────────────── رسالة تنبيه ─────────────────────────── */

export function Alert({
  tone = "info",
  title,
  children,
}: {
  tone?: "info" | "success" | "warning" | "error";
  title?: string;
  children: ReactNode;
}) {
  const tones = {
    info: "border-brand-200 bg-brand-50 text-brand-900",
    success: "border-emerald-200 bg-emerald-50 text-emerald-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-900",
  };
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${tones[tone]}`}>
      {title && <p className="mb-1 font-bold">{title}</p>}
      <div className="leading-relaxed">{children}</div>
    </div>
  );
}

/* ─────────────────────────── بطاقة إحصائية ─────────────────────────── */

export function StatCard({
  label,
  value,
  hint,
  tone = "ink",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ink" | "brand" | "gold" | "green";
  icon?: ReactNode;
}) {
  const tones = {
    ink: "text-ink-900",
    brand: "text-brand-600",
    gold: "text-gold-500",
    green: "text-emerald-600",
  };
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-500">{label}</p>
        {icon && <span className="text-lg opacity-50">{icon}</span>}
      </div>
      <p
        className={`num mt-2 font-display text-2xl font-black sm:text-3xl ${tones[tone]}`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
