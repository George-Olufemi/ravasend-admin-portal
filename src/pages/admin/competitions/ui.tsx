import React from "react";
import { X } from "lucide-react";

export const ngn = (val: number | string) => {
  const n = typeof val === "string" ? parseFloat(val) || 0 : val;
  return `₦${n.toLocaleString("en-NG", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const fmtN = (num: number) => num.toLocaleString();

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const szClass = size === "sm" ? "size-7 text-[10px]" : size === "lg" ? "size-10 text-xs" : "size-8 text-[11px]";
  return (
    <div
      className={`${szClass} rounded-full flex items-center justify-center font-bold text-white shrink-0`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {initials}
    </div>
  );
}

export function DateInput({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
}) {
  return (
    <div>
      {label && <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50"
      />
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
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function PurpleBtn({
  children,
  onClick,
  size = "md",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  size?: "sm" | "md";
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        size === "sm" ? "px-3 py-1.5" : "px-4 py-2.5"
      }`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
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
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-card border-l border-border h-full flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="p-6 border-b border-border flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-bold text-foreground">{title}</h3>
            {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-4">{children}</div>
        {footer && <div className="p-6 border-t border-border bg-card/50 shrink-0">{footer}</div>}
      </div>
    </div>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border/50 rounded-2xl p-4 sm:p-5">
      <p className="text-[11px] sm:text-[12px] font-medium text-muted-foreground">{label}</p>
      <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">{sub}</p>}
    </div>
  );
}

export function THead({ cols }: { cols: string[] }) {
  return (
    <thead className="bg-secondary/40 border-b border-border text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-left">
      <tr>
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">{children}</table>
      </div>
    </div>
  );
}
