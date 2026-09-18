import React from "react";
import { X } from "lucide-react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
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
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 ${
        size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]"
      } ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-hidden mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

export function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-white/[0.02]">
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function SlidePanel({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex justify-end" onClick={onClose}>
      <div className="w-full sm:w-[440px] h-full bg-[#0F0D26] border-l border-border p-4 sm:p-6 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <h2 className="text-[16px] font-bold text-foreground">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
