import React from "react";

export function DateInput({
  value,
  onChange,
  label,
  min,
}: {
  value: string;
  onChange: (v: string) => void;
  label?: string;
  min?: string;
}) {
  return (
    <div>
      {label && <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">{label}</label>}
      <input
        type="date"
        value={value}
        min={min}
        onChange={(e) => onChange(e.target.value)}
        className="bg-secondary border border-border rounded-xl px-3 py-1.5 text-[12px] text-foreground focus:outline-none focus:border-primary/50 [color-scheme:dark]"
      />
    </div>
  );
}
