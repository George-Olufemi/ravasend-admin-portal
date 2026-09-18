import React, { useState } from "react";
import { Pencil, MoreHorizontal, ToggleLeft, Trash2, Globe2, SlidersHorizontal } from "lucide-react";
import { FeeRule } from "../types";
import { FEE_CATS, catColorMap } from "../constants";
import { DropdownMenu } from "./shared"; // assuming shared

export function FeeRuleCard({
  f,
  onEdit,
  onToggle,
  onDelete,
}: {
  f: FeeRule;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const cat = FEE_CATS.find((c) => c.label === f.category) || FEE_CATS[5];
  const catCls = catColorMap[cat.color] || catColorMap.zinc;
  const isFree = f.feeModel === "free" || (f.feeModel === "percentage" && f.percent === "0%");
  const isComm = f.feeModel === "commission";

  const feeLabel = () => {
    if (isFree) return "Free";
    if (isComm) return `${f.commissionUserPct}% → users · ${f.commissionPlatformPct}% → platform`;
    const parts = [];
    if (f.base) parts.push(f.base);
    if (f.percent) parts.push(f.percent);
    const fee = parts.join(" + ");
    return f.noCap ? fee : f.cap ? `${fee} (max ${f.cap})` : fee;
  };

  const scopeLabel = () => {
    if (f.scope === "all")
      return `All ${
        f.category === "Cross-border"
          ? "corridors"
          : f.category === "Crypto"
          ? "assets"
          : f.category === "Bank Transfers"
          ? "banks"
          : "services"
      }`;
    if (f.providers.length === 0) return "No providers set";
    if (f.providers.length <= 3) return f.providers.join(", ");
    return `${f.providers.slice(0, 2).join(", ")} +${f.providers.length - 2} more`;
  };

  return (
    <div
      className={`bg-card border border-border rounded-2xl p-5 transition-all hover:border-primary/20 group ${
        f.status === "inactive" ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${catCls}`}>
              {f.category}
            </span>
            {f.direction !== "all" && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground border border-border capitalize">
                {f.direction}
              </span>
            )}
            {isFree && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FREE
              </span>
            )}
            {isComm && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                COMMISSION
              </span>
            )}
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
                f.status === "active"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  : "bg-red-500/10 text-red-400 border-red-500/20"
              }`}
            >
              {f.status}
            </span>
          </div>
          <p className="text-[14px] font-bold text-foreground leading-snug">{f.name || f.category}</p>
        </div>
        <div className="relative shrink-0 flex items-center gap-1">
          <button
            onClick={onEdit}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <Pencil size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen((m) => !m);
            }}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <DropdownMenu
              onClose={() => setMenuOpen(false)}
              items={[
                {
                  label: f.status === "active" ? "Disable rule" : "Enable rule",
                  icon: <ToggleLeft size={13} />,
                  onClick: onToggle,
                },
                {
                  label: "Delete rule",
                  icon: <Trash2 size={13} />,
                  onClick: onDelete,
                  danger: true,
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* Scope */}
      <div className="mb-3 flex items-center gap-2 p-2.5 bg-secondary/40 rounded-xl border border-border">
        {f.scope === "all" ? (
          <>
            <Globe2 size={11} className="text-muted-foreground shrink-0" />
            <p className="text-[11px] text-muted-foreground">{scopeLabel()}</p>
          </>
        ) : (
          <>
            <SlidersHorizontal size={11} className="text-primary shrink-0" />
            <p className="text-[11px] text-foreground font-medium">{scopeLabel()}</p>
          </>
        )}
      </div>

      {isComm ? (
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl p-3 text-center">
            <p className="text-[9px] text-emerald-400/70 uppercase tracking-wider font-bold mb-1">
              User Discount
            </p>
            <p className="text-[20px] font-black text-emerald-400 leading-none">{f.commissionUserPct}%</p>
            <p className="text-[9px] text-muted-foreground mt-0.5">of VTpass commission</p>
          </div>
          <div className="bg-primary/[0.06] border border-primary/15 rounded-xl p-3 text-center">
            <p className="text-[9px] text-primary/70 uppercase tracking-wider font-bold mb-1">
              Platform Revenue
            </p>
            <p className="text-[20px] font-black text-primary leading-none">
              {f.commissionPlatformPct}%
            </p>
            <p className="text-[9px] text-muted-foreground mt-0.5">of VTpass commission</p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
              Fee charged
            </p>
            <p className="text-[15px] font-black text-foreground font-mono">{feeLabel()}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
              Currencies
            </p>
            <div className="flex gap-1 flex-wrap justify-end">
              {(f.currencies || ["NGN"]).map((c) => (
                <span
                  key={c}
                  className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/[0.06] text-muted-foreground border border-border"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
      {(f.minAmount || f.maxAmount) && (
        <p className="mt-2.5 text-[10px] text-muted-foreground border-t border-border pt-2">
          Threshold: {f.minAmount && `min ₦${f.minAmount}`}{" "}
          {f.minAmount && f.maxAmount && " – "}{" "}
          {f.maxAmount && `max ₦${f.maxAmount}`}
        </p>
      )}
      {f.updatedAt && (
        <p className="mt-2 text-[10px] text-muted-foreground/60">
          Last updated: {new Date(f.updatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
