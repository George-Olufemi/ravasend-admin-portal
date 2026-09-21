import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export * from "./PromoCard";

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
    <Button
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </Button>
  );
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardContent className="p-5">
        <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{value}</p>
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
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] overflow-y-auto bg-background p-6 flex flex-col justify-between border-l border-border z-50">
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
