import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export function DropdownMenu({
  items,
  onClose,
}: {
  items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[];
  onClose: () => void;
}) {
  return (
    <div
      className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 divide-y divide-border/50"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors ${
            item.danger
              ? "text-red-400 hover:bg-red-500/10"
              : "text-foreground hover:bg-white/5"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function PurpleBtn({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardContent className="p-5">
        <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

export function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[540px] overflow-y-auto bg-background p-6 flex flex-col justify-between border-l border-border z-50"
      >
        <div>
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="text-xl font-bold text-foreground">{title}</SheetTitle>
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          </SheetHeader>
          {children}
        </div>
        {footer && <div className="pt-6 border-t border-border mt-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}
