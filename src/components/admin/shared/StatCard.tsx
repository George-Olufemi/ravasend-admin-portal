import React from "react";

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  isLoading?: boolean;
}

export function StatCard({ label, value, sub, isLoading }: StatCardProps) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl p-5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      {isLoading ? (
        <div className="h-7 w-20 bg-muted/30 rounded animate-pulse mt-1" />
      ) : (
        <p className="text-[22px] font-bold text-foreground leading-none mt-1">{value}</p>
      )}
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}
