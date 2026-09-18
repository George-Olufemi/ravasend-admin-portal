import React from "react";

interface PaginationProps {
  page: number;
  total: number;
  perPage: number;
  onChange: (p: number) => void;
}

export function Pagination({ page, total, perPage, onChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[12px] text-muted-foreground">
      <span>Showing {total === 0 ? 0 : Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
      </div>
    </div>
  );
}
