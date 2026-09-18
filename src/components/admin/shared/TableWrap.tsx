import React from "react";

export function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-x-auto w-full mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}
