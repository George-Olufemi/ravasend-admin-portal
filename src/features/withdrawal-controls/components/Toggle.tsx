import React from "react";

export function Toggle({ on, onToggle, disabled }: { on: boolean; onToggle: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${on ? "bg-primary" : "bg-secondary"}`}
    >
      <span className={`size-4 rounded-full bg-white absolute top-1 transition-transform ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}
