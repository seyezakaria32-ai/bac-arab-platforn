"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  addSectionAction,
  deleteSectionAction,
  reorderSectionsAction,
  toggleSectionAction,
} from "@/app/(admin)/admin/design/actions";
import type { IconKey } from "@/lib/sections/registry";
import { Alert, Badge } from "@/components/ui";
import { IconEdit, IconPlus, IconTrash } from "@/components/ui/icons";
import { SectionIcon } from "@/components/sections/SectionIcon";

export type SectionRow = {
  id: string;
  name: string;
  typeLabel: string;
  icon: IconKey;
  isVisible: boolean;
  menuLabel: string;
  anchor: string;
  /** ما وُضع بعد القسم أو داخله من سلايدر وأزرار */
  attached: { label: string; href: string }[];
};

export type SectionTypeOption = {
  type: string;
  label: string;
  description: string;
  icon: IconKey;
  available: boolean;
};

/**
 * أقسام الصفحة الرئيسية بترتيبها: سحب وإفلات (حاسوب) أو سهمان (هاتف)،
 * إظهار وإخفاء، تعديل، حذف، وإضافة قسم جديد في أيّ مكان.
 */
export function SectionsManager({ rows: initial, types }: { rows: SectionRow[]; types: SectionTypeOption[] }) {
  const router = useRouter();
  const [rows, setRows] = useState(initial);
  const [notice, setNotice] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, start] = useTransition();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [insertAfter, setInsertAfter] = useState<string>("");

  useEffect(() => setRows(initial), [initial]);

  const run = (task: () => Promise<{ ok: boolean; message: string }>, rollback?: () => void) =>
    start(async () => {
      const res = await task();
      setNotice(res);
      if (!res.ok) rollback?.();
      router.refresh();
    });

  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const before = rows;
    const next = [...rows];
    const [x] = next.splice(from, 1);
    next.splice(to, 0, x);
    setRows(next);
    run(() => reorderSectionsAction(next.map((r) => r.id)), () => setRows(before));
  };

  const remove = (r: SectionRow) => {
    const extra = r.attached.length
      ? `\n\nالمرتبط به (${r.attached.length}) سينتقل إلى بعد القسم الذي قبله.`
      : "";
    if (!window.confirm(`حذف قسم «${r.name}» من الصفحة الرئيسية؟ يمكنك إعادته لاحقًا من «إضافة قسم».${extra}`)) return;
    setRows((list) => list.filter((x) => x.id !== r.id));
    run(() => deleteSectionAction(r.id));
  };

  const add = (type: string) =>
    start(async () => {
      const res = await addSectionAction(type, insertAfter || null);
      setNotice(res);
      if (res.ok && res.id) router.push(`/admin/design/${res.id}`);
      else router.refresh();
    });

  return (
    <div className="space-y-4">
      {notice && <Alert tone={notice.ok ? "success" : "error"}>{notice.message}</Alert>}
      <p className="text-[12.5px] text-ink-500">
        الترتيب هنا هو ترتيب الصفحة من الأعلى إلى الأسفل. اسحب القسم لنقله (على الحاسوب)، أو استعمل السهمين.
        {pending && <span className="mr-2 font-bold text-brand-700">جارٍ الحفظ…</span>}
      </p>

      <ol className="space-y-2">
        {rows.map((r, i) => (
          <li
            key={r.id}
            draggable
            onDragStart={(e) => {
              setDragId(r.id);
              e.dataTransfer.effectAllowed = "move";
            }}
            onDragOver={(e) => {
              if (!dragId) return;
              e.preventDefault();
              if (overId !== r.id) setOverId(r.id);
            }}
            onDrop={(e) => {
              e.preventDefault();
              const from = rows.findIndex((x) => x.id === dragId);
              setDragId(null);
              setOverId(null);
              if (from >= 0) move(from, i);
            }}
            onDragEnd={() => {
              setDragId(null);
              setOverId(null);
            }}
            className={`rounded-2xl border bg-white transition-all ${
              r.isVisible ? "border-cream-300" : "border-dashed border-cream-300 bg-cream-50"
            } ${dragId === r.id ? "opacity-40" : ""} ${overId === r.id && dragId !== r.id ? "ring-2 ring-brand-500" : ""}`}
          >
            <div className="flex flex-wrap items-center gap-3 px-3 py-3 sm:px-4">
              <span className="cursor-grab text-ink-300 active:cursor-grabbing" aria-hidden>
                ⋮⋮
              </span>
              <span
                className={`grid size-9 shrink-0 place-items-center rounded-xl text-lg ${
                  r.isVisible ? "bg-brand-50 text-brand-600" : "bg-cream-200 text-ink-300"
                }`}
              >
                <SectionIcon name={r.icon} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/admin/design/${r.id}`}
                    className={`font-display text-[15px] font-bold hover:text-brand-700 ${
                      r.isVisible ? "text-ink-900" : "text-ink-500"
                    }`}
                  >
                    {r.name}
                  </Link>
                  {!r.isVisible && <Badge tone="ink">مخفي</Badge>}
                  {r.menuLabel && <Badge tone="brand">في القائمة: {r.menuLabel}</Badge>}
                </div>
                {r.name !== r.typeLabel && <p className="text-[12px] text-ink-500">{r.typeLabel}</p>}
              </div>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0 || pending}
                  aria-label={`نقل «${r.name}» إلى الأعلى`}
                  className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === rows.length - 1 || pending}
                  aria-label={`نقل «${r.name}» إلى الأسفل`}
                  className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => run(() => toggleSectionAction(r.id))}
                  disabled={pending}
                  className="font-ui h-9 rounded-lg border border-cream-300 px-3 text-[12.5px] font-bold text-ink-700 hover:border-brand-300 disabled:opacity-50"
                >
                  {r.isVisible ? "إخفاء" : "إظهار"}
                </button>
                <Link
                  href={`/admin/design/${r.id}`}
                  className="font-ui inline-flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-3 text-[12.5px] font-bold text-white hover:bg-ink-800"
                >
                  <IconEdit />
                  تعديل
                </Link>
                <button
                  type="button"
                  onClick={() => remove(r)}
                  disabled={pending}
                  aria-label={`حذف «${r.name}»`}
                  className="grid size-9 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  <IconTrash />
                </button>
              </div>
            </div>
            {r.attached.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 border-t border-cream-200 px-4 py-2 text-[12px] text-ink-500">
                <span>↳ مرتبط به:</span>
                {r.attached.map((a) => (
                  <Link key={a.href + a.label} href={a.href} className="rounded-full bg-cream-100 px-2.5 py-0.5 font-bold text-ink-700 hover:text-brand-700">
                    {a.label}
                  </Link>
                ))}
              </div>
            )}
          </li>
        ))}
      </ol>

      {/* ── إضافة قسم ── */}
      {!adding ? (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="font-ui inline-flex h-11 items-center gap-2 rounded-xl bg-brand-500 px-5 text-[14px] font-bold text-ink-900 hover:bg-brand-400"
        >
          <IconPlus />
          إضافة قسم
        </button>
      ) : (
        <div className="rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/40 p-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <label className="block min-w-60 flex-1">
              <span className="mb-1.5 block text-[13px] font-bold text-ink-800">مكان القسم الجديد</span>
              <select
                value={insertAfter}
                onChange={(e) => setInsertAfter(e.target.value)}
                className="w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-[14px] text-ink-900"
              >
                <option value="">في آخر الصفحة</option>
                <option value="__start">في أعلى الصفحة</option>
                {rows.map((r) => (
                  <option key={r.id} value={r.id}>
                    بعد «{r.name}»
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="font-ui h-10 rounded-xl px-4 text-[13px] font-bold text-ink-500 hover:bg-white"
            >
              إلغاء
            </button>
          </div>
          <p className="mt-4 mb-2 text-[13px] font-bold text-ink-800">نوع القسم</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {types.map((t) => (
              <button
                key={t.type}
                type="button"
                disabled={!t.available || pending}
                onClick={() => add(t.type)}
                className="flex items-start gap-3 rounded-xl border border-cream-300 bg-white p-3 text-right transition-colors hover:border-brand-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-lg text-brand-600">
                  <SectionIcon name={t.icon} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-[14px] font-bold text-ink-900">{t.label}</span>
                  <span className="mt-0.5 block text-[12px] leading-relaxed text-ink-500">
                    {t.available ? t.description : "موجود في الصفحة — لا يتكرّر"}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
