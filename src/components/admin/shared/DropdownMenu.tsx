import React from "react";

interface DropdownMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
}

interface DropdownMenuProps {
  items: DropdownMenuItem[];
  onClose: () => void;
}

export function DropdownMenu({ items, onClose }: DropdownMenuProps) {
  return (
    <div
      className="absolute right-0 top-full mt-1 w-44 bg-card border border-border rounded-xl shadow-xl z-50 p-1 divide-y divide-border/50"
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, i) => (
        <button
          key={i}
          onClick={() => {
            item.onClick();
            onClose();
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium rounded-lg transition-colors ${
            item.danger
              ? "text-red-400 hover:bg-red-500/10"
              : "text-foreground hover:bg-white/5"
          }`}
        >
          {item.icon}
          {item.label}
        </button>
      ))}
    </div>
  );
}
