import React from "react";

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

export function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl p-5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[22px] font-bold text-foreground leading-none mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-x-auto w-full mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

export function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-white/[0.02]">
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[12px] text-muted-foreground">
      <span>Showing {Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
      </div>
    </div>
  );
}
