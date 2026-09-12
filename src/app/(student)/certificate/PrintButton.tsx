"use client";

import { Button } from "@/components/ui";
import { IconDownload } from "@/components/ui/icons";

export function PrintButton() {
  return (
    <Button onClick={() => window.print()}>
      <IconDownload />
      طباعة / حفظ PDF
    </Button>
  );
}
