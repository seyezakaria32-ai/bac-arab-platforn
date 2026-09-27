"use client";

import { useState } from "react";
import { IconChevronDown } from "@/components/ui/icons";
import { Collapse } from "@/components/ui/Collapse";
import { useAnchoredToggle } from "@/lib/use-anchored-toggle";

export type FaqItem = { q: string; a: string };

/** الأسئلة والأجوبة تُكتب من لوحة الإدارة ← تصميم الموقع (قسم الأسئلة) */
export function Faq({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  const anchored = useAnchoredToggle();

  return (
    <div className="mx-auto max-w-3xl space-y-3">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`overflow-hidden rounded-2xl border bg-white transition-colors ${
              isOpen ? "border-brand-300" : "border-cream-300"
            }`}
          >
            <button
              type="button"
              // سؤال واحد مفتوح: فتح سؤال يطوي السابق، والسؤال المنقور يبقى مكانه
              onClick={(e) => {
                const btn = e.currentTarget;
                anchored(btn, () => setOpen(isOpen ? null : i));
              }}
              aria-expanded={isOpen}
              className="flex w-full items-center gap-3 px-5 py-4 text-right transition-colors hover:bg-cream-50"
            >
              <IconChevronDown
                className={`shrink-0 text-lg text-ink-500 transition-transform duration-300 ${
                  isOpen ? "rotate-180" : ""
                }`}
              />
              <span className="flex-1 font-display text-[15px] font-bold text-ink-900">
                {item.q}
              </span>
            </button>
            <Collapse open={isOpen}>
              <p className="border-t border-cream-200 px-5 py-4 text-[14px] leading-loose whitespace-pre-line text-ink-700">
                {item.a}
              </p>
            </Collapse>
          </div>
        );
      })}
    </div>
  );
}
