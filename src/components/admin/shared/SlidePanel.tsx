import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface SlidePanelProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function SlidePanel({ open, onClose, title, subtitle, children, footer }: SlidePanelProps) {
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[480px] overflow-y-auto bg-background p-6 flex flex-col justify-between">
        <div>
          <SheetHeader className="mb-4">
            <SheetTitle className="text-lg font-bold text-foreground">{title}</SheetTitle>
            {subtitle && <p className="text-[12px] text-muted-foreground">{subtitle}</p>}
          </SheetHeader>
          {children}
        </div>
        {footer && <div className="pt-5 border-t border-border mt-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
