import React from "react";
export * from "./Toggle";

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6">
      <h1 className="text-xl font-bold text-foreground">{title}</h1>
      {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
    </div>
  );
}
