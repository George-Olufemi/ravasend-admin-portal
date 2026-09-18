import React from "react";

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
