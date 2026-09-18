import React from "react";
import { Search } from "lucide-react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  search?: string;
  onSearch?: (v: string) => void;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, search, onSearch, action }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
        {search !== undefined && onSearch && (
          <div className="relative w-full sm:w-72">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={search}
              onChange={(e) => onSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl pl-9 pr-3 py-2.5 text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
        )}
        {action}
      </div>
    </div>
  );
}
