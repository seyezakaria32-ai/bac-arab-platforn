"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  resetSectionAction,
  saveSectionAction,
  uploadSectionImageAction,
  type SaveSectionResult,
} from "@/app/(admin)/admin/design/actions";
import {
  ICON_KEYS,
  SECTION_DEFS,
  type FieldDef,
  type SectionType,
  type SectionValues,
} from "@/lib/sections/registry";
import { LINK_HINT } from "@/lib/links";
import type { SiteImage } from "@/lib/settings";
import { Alert } from "@/components/ui";
import { IconChevronDown, IconPlus, IconTrash, IconUpload } from "@/components/ui/icons";
import { SectionIcon } from "@/components/sections/SectionIcon";

/**
 * محرّر قسم من أقسام الصفحة الرئيسية. يُبنى من تعريف حقول النوع (registry.ts)
 * — النموذج نفسه لكل الأقسام: نصوص، روابط، صور، أيقونات، وقوائم تُضاف
 * عناصرها وتُحذف وتُرتَّب (المزايا، الأسئلة، المحاور…).
 *
 * لا يُحفظ شيء حتى يُضغط «حفظ»، والتنبيه قبل مغادرة الصفحة يحمي التعديلات.
 */

const LibraryContext = createContext<SiteImage[]>([]);

const inputClass =
  "w-full rounded-xl border border-cream-300 bg-white px-3.5 py-2.5 text-[14px] text-ink-900 outline-none transition-colors placeholder:text-ink-300 focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

export function SectionEditor({
  id,
  type,
  initial,
  library,
}: {
  id: string;
  type: SectionType;
  initial: SectionValues;
  library: SiteImage[];
}) {
  const router = useRouter();
  const def = SECTION_DEFS[type];
  const [values, setValues] = useState<SectionValues>(initial);
  const [saved, setSaved] = useState(() => JSON.stringify(initial));
  const [result, setResult] = useState<SaveSectionResult | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(values) !== saved;

  // تعديلات غير محفوظة: تنبيه قبل إغلاق الصفحة أو تحديثها
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const apply = (res: SaveSectionResult) => {
    setResult(res);
    if (res.ok && res.values) {
      setValues(res.values);
      setSaved(JSON.stringify(res.values));
      router.refresh(); // المعاينة أسفل الصفحة تُرسم من المحفوظ
    }
  };

  const save = () => start(async () => apply(await saveSectionAction(id, values)));
  const reset = () => {
    if (!window.confirm("إعادة هذا القسم إلى محتواه الأصلي؟ ستُمحى كل تعديلاتك عليه.")) return;
    start(async () => apply(await resetSectionAction(id)));
  };

  return (
    <LibraryContext.Provider value={library}>
      <div className="space-y-5">
        <Fields fields={def.fields} values={values} onChange={setValues} />

        {/* شريط الحفظ يبقى ظاهرًا أسفل الشاشة أثناء التحرير */}
        <div className="sticky bottom-3 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-cream-300 bg-white/95 p-3 shadow-lg backdrop-blur">
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="font-ui inline-flex h-11 items-center justify-center rounded-xl bg-ink-900 px-6 text-[14px] font-bold text-white transition-colors hover:bg-ink-800 disabled:opacity-50"
          >
            {pending ? "جارٍ الحفظ…" : "حفظ القسم"}
          </button>
          <span className={`text-[13px] font-bold ${dirty ? "text-gold-600" : "text-ink-500"}`} role="status">
            {dirty
              ? "تعديلات غير محفوظة"
              : result
                ? result.message
                : "لا تعديلات"}
          </span>
          <button
            type="button"
            onClick={reset}
            disabled={pending}
            className="font-ui mr-auto h-9 rounded-lg px-3 text-[12.5px] font-bold text-ink-500 hover:bg-cream-100 hover:text-ink-900 disabled:opacity-50"
          >
            استعادة المحتوى الأصلي
          </button>
        </div>
        {result && !result.ok && <Alert tone="error">{result.message}</Alert>}
      </div>
    </LibraryContext.Provider>
  );
}

/* ═════════════════════ الحقول ═════════════════════ */

function Fields({
  fields,
  values,
  onChange,
}: {
  fields: FieldDef[];
  values: SectionValues;
  onChange: (v: SectionValues) => void;
}) {
  return (
    <div className="space-y-4">
      {fields.map((f) => (
        <FieldControl key={f.name} f={f} value={values[f.name]} onChange={(v) => onChange({ ...values, [f.name]: v })} />
      ))}
    </div>
  );
}

function Label({ f, children }: { f: FieldDef; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-bold text-ink-800">{f.label}</span>
      {children}
      {"hint" in f && f.hint && <span className="mt-1 block text-[12px] leading-relaxed text-ink-500">{f.hint}</span>}
    </label>
  );
}

function FieldControl({ f, value, onChange }: { f: FieldDef; value: unknown; onChange: (v: unknown) => void }) {
  const text = typeof value === "string" ? value : "";
  switch (f.kind) {
    case "text":
      return (
        <Label f={f}>
          <input
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder={f.placeholder}
            maxLength={f.max}
            className={inputClass}
          />
        </Label>
      );
    case "textarea":
      return (
        <Label f={f}>
          <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder={f.placeholder}
            maxLength={f.max}
            rows={f.rows ?? 3}
            className={`${inputClass} resize-y leading-loose`}
          />
        </Label>
      );
    case "link":
      return (
        <Label f={{ ...f, hint: f.hint ?? LINK_HINT }}>
          <input
            value={text}
            onChange={(e) => onChange(e.target.value)}
            dir="ltr"
            placeholder="#plans"
            className={`${inputClass} text-left`}
          />
        </Label>
      );
    case "select":
      return (
        <Label f={f}>
          <select value={text || f.options[0].value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </Label>
      );
    case "icon":
      return <IconPicker label={f.label} value={text} onChange={onChange} />;
    case "image":
      return <ImageField f={f} value={text} onChange={onChange} />;
    case "list":
      return <ListField f={f} value={value} onChange={onChange} />;
  }
}

/* ═════════════════════ أيقونة ═════════════════════ */

function IconPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-bold text-ink-800">{label}</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {ICON_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={value === key}
            aria-label={key}
            onClick={() => onChange(key)}
            className={`grid size-9 place-items-center rounded-lg text-lg transition-colors ${
              value === key
                ? "bg-brand-500 text-ink-900 ring-2 ring-brand-600"
                : "bg-white text-ink-500 ring-1 ring-cream-300 hover:text-brand-700"
            }`}
          >
            <SectionIcon name={key} />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ═════════════════════ صورة ═════════════════════ */

function ImageField({
  f,
  value,
  onChange,
}: {
  f: Extract<FieldDef, { kind: "image" }>;
  value: string;
  onChange: (v: string) => void;
}) {
  const library = useContext(LibraryContext);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLibrary, setShowLibrary] = useState(false);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await uploadSectionImageAction(fd);
      if (res.ok && res.url) onChange(res.url);
      else setError(res.message);
    } catch {
      setError("تعذّر رفع الصورة — تحقّق من الاتصال");
    }
    setBusy(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-bold text-ink-800">{f.label}</span>
      <div className="flex flex-wrap items-start gap-4">
        <div
          className="relative w-44 shrink-0 overflow-hidden rounded-xl bg-cream-100 ring-1 ring-cream-300"
          style={{ aspectRatio: f.aspect ?? "4 / 3" }}
        >
          {value ? (
            <Image src={value} alt="" fill sizes="176px" className="object-cover" />
          ) : (
            <span className="grid h-full place-items-center text-[12px] text-ink-300">بلا صورة</span>
          )}
        </div>
        <div className="flex min-w-40 flex-1 flex-col gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileRef.current?.click()}
            className="font-ui inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-[13px] font-bold text-ink-900 hover:bg-brand-400 disabled:opacity-60"
          >
            <IconUpload />
            {busy ? "جارٍ الرفع…" : "رفع صورة من جهازك"}
          </button>
          <button
            type="button"
            onClick={() => setShowLibrary((v) => !v)}
            className="font-ui h-10 rounded-xl border border-cream-300 bg-white px-4 text-[13px] font-bold text-ink-700 hover:border-brand-300"
          >
            {showLibrary ? "إخفاء صور الهوية" : "من صور الهوية الجاهزة"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="font-ui h-9 rounded-lg text-[12.5px] font-bold text-red-600 hover:bg-red-50"
            >
              إزالة الصورة
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={(e) => void upload(e.target.files?.[0])}
          />
        </div>
      </div>
      {f.hint && <span className="mt-1.5 block text-[12px] text-ink-500">{f.hint}</span>}
      {error && <p className="mt-1.5 text-[12.5px] font-bold text-red-600">{error}</p>}
      {showLibrary && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
          {library.map((img) => (
            <button
              key={img.src}
              type="button"
              title={img.alt}
              onClick={() => {
                onChange(img.src);
                setShowLibrary(false);
              }}
              className={`relative aspect-square overflow-hidden rounded-lg ring-1 hover:ring-2 hover:ring-brand-500 ${
                value === img.src ? "ring-2 ring-brand-600" : "ring-cream-300"
              }`}
            >
              <Image src={img.src} alt={img.alt} fill sizes="100px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═════════════════════ قائمة ═════════════════════ */

/** عنصر فارغ لقائمة: نصوص فارغة، أوّل خيار، أيقونة، وقوائم فارغة */
function blankItem(fields: FieldDef[]): SectionValues {
  const out: SectionValues = {};
  for (const f of fields) {
    if (f.kind === "list") out[f.name] = [];
    else if (f.kind === "select") out[f.name] = f.options[0].value;
    else if (f.kind === "icon") out[f.name] = "sparkle";
    else out[f.name] = "";
  }
  return out;
}

/** ملخّص العنصر المطويّ: أوّل نصّ غير فارغ فيه */
function summaryOf(item: SectionValues, fields: FieldDef[]): string {
  for (const f of fields) {
    const v = item[f.name];
    if ((f.kind === "text" || f.kind === "textarea") && typeof v === "string" && v.trim()) {
      const t = v.trim().replace(/\*\*/g, "");
      return t.length > 70 ? `${t.slice(0, 70)}…` : t;
    }
  }
  return "";
}

function ListField({
  f,
  value,
  onChange,
}: {
  f: Extract<FieldDef, { kind: "list" }>;
  value: unknown;
  onChange: (v: SectionValues[]) => void;
}) {
  const items: SectionValues[] = Array.isArray(value)
    ? value.filter((x): x is SectionValues => !!x && typeof x === "object")
    : [];
  // قوائم قصيرة مفتوحة، والطويلة مطويّة حتى لا تمتدّ الصفحة بلا نهاية
  const [open, setOpen] = useState<Set<number>>(() => new Set(items.length <= 3 ? items.map((_, i) => i) : []));

  const update = (next: SectionValues[], openIndex?: number) => {
    onChange(next);
    if (openIndex !== undefined) setOpen(new Set([openIndex]));
  };
  const move = (i: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [x] = next.splice(i, 1);
    next.splice(to, 0, x);
    update(next, to);
  };
  const remove = (i: number) => {
    const summary = summaryOf(items[i], f.fields);
    if (!window.confirm(`حذف ${f.itemLabel} ${i + 1}${summary ? ` («${summary}»)` : ""}؟`)) return;
    update(items.filter((_, j) => j !== i));
    setOpen(new Set());
  };
  const canAdd = !f.max || items.length < f.max;
  const canRemove = !f.min || items.length > f.min;

  return (
    <fieldset className="rounded-2xl border border-cream-300 bg-cream-50/60 p-3 sm:p-4">
      <legend className="px-2 text-[13.5px] font-black text-ink-900">
        {f.label} <span className="num font-normal text-ink-500">({items.length})</span>
      </legend>
      {f.hint && <p className="mb-3 text-[12px] leading-relaxed text-ink-500">{f.hint}</p>}

      <ol className="space-y-2.5">
        {items.map((item, i) => {
          const isOpen = open.has(i);
          return (
            <li key={i} className="overflow-hidden rounded-xl border border-cream-300 bg-white">
              <div className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => {
                    const next = new Set(open);
                    if (isOpen) next.delete(i);
                    else next.add(i);
                    setOpen(next);
                  }}
                  aria-expanded={isOpen}
                  className="flex min-w-0 flex-1 items-center gap-2 text-right"
                >
                  <IconChevronDown className={`shrink-0 text-ink-300 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  <span className="num shrink-0 text-[12px] font-black text-ink-500">
                    {f.itemLabel} {i + 1}
                  </span>
                  <span className="truncate text-[13px] text-ink-700">{summaryOf(item, f.fields)}</span>
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i - 1)}
                  disabled={i === 0}
                  aria-label={`تقديم ${f.itemLabel} ${i + 1}`}
                  className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, i + 1)}
                  disabled={i === items.length - 1}
                  aria-label={`تأخير ${f.itemLabel} ${i + 1}`}
                  className="grid size-8 place-items-center rounded-lg text-ink-500 hover:bg-cream-100 disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  disabled={!canRemove}
                  aria-label={`حذف ${f.itemLabel} ${i + 1}`}
                  title={canRemove ? "حذف" : `يلزم ${f.min} على الأقلّ`}
                  className="grid size-8 place-items-center rounded-lg text-red-600 hover:bg-red-50 disabled:opacity-30"
                >
                  <IconTrash />
                </button>
              </div>
              {isOpen && (
                <div className="border-t border-cream-200 p-3 sm:p-4">
                  <Fields
                    fields={f.fields}
                    values={item}
                    onChange={(v) => update(items.map((x, j) => (j === i ? v : x)))}
                  />
                </div>
              )}
            </li>
          );
        })}
      </ol>

      <button
        type="button"
        disabled={!canAdd}
        onClick={() => update([...items, blankItem(f.fields)], items.length)}
        className="font-ui mt-3 inline-flex h-10 items-center gap-2 rounded-xl border-2 border-dashed border-cream-300 px-4 text-[13px] font-bold text-ink-700 hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
      >
        <IconPlus />
        {canAdd ? `إضافة ${f.itemLabel}` : `الحدّ الأقصى ${f.max}`}
      </button>
    </fieldset>
  );
}
