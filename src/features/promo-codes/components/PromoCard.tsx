import React, { useState } from "react";
import { Copy, MoreHorizontal, ToggleLeft, Trash2, Users2, Infinity } from "lucide-react";
import { PromoCode } from "../types";
import { daysUntil } from "../utils";

function DropdownMenu({
  items,
  onClose,
}: {
  items: { label: string; icon: React.ReactNode; onClick: () => void; danger?: boolean }[];
  onClose: () => void;
}) {
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

export function PromoCard({ p, onCopy, onToggle, onDelete }: {
  p: PromoCode;
  onCopy: () => void; onToggle: () => void; onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const days = daysUntil(p.expires);
  const isPremium = p.tier === "premium";
  const pct = p.limit ? Math.min(100, Math.round((p.uses / p.limit) * 100)) : 0;

  return (
    <div className={`relative rounded-2xl border overflow-hidden transition-all ${p.status === "inactive" ? "opacity-60" : ""} ${isPremium ? "border-amber-500/25 bg-gradient-to-br from-amber-500/[0.06] to-transparent" : "border-border bg-card"}`}>
      {/* Header strip */}
      <div className={`px-5 pt-4 pb-3 flex items-center justify-between border-b ${isPremium ? "border-amber-500/15" : "border-border"}`}>
        <div className="flex items-center gap-2">
          {isPremium
            ? <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-amber-400 uppercase">★ Premium</span>
            : <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Standard</span>}
          {p.status === "inactive" && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">DISABLED</span>}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="opacity-60">⏱</span> {days > 0 ? `Expires in ${days} day${days !== 1 ? "s" : ""}` : "Expired"}
          </span>
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(m => !m); }} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded">
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <DropdownMenu onClose={() => setMenuOpen(false)} items={[
                { label: "Copy code", icon: <Copy size={13} />, onClick: onCopy },
                { label: p.status === "active" ? "Disable code" : "Enable code", icon: <ToggleLeft size={13} />, onClick: onToggle },
                { label: "Delete", icon: <Trash2 size={13} />, onClick: onDelete, danger: true },
              ]} />
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pt-4 pb-5">
        <p className="text-[11px] text-muted-foreground mb-1">{"You'll get"}</p>
        <p className={`text-[28px] font-black leading-none mb-0.5 ${isPremium ? "text-amber-400" : "text-primary"}`} style={isPremium ? {} : { background: "linear-gradient(135deg, #7B3FE4, #A78BFA)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{p.rewardAmt}</p>
        <p className="text-[12px] text-muted-foreground mt-1 mb-4">{p.description}</p>

        {/* Code box */}
        <div className={`flex items-center justify-between rounded-xl px-4 py-3 border mb-4 ${isPremium ? "bg-amber-500/[0.08] border-amber-500/20" : "bg-primary/[0.06] border-primary/20"}`}>
          <div>
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">Promocode</p>
            <p className={`text-[15px] font-black font-mono tracking-wider ${isPremium ? "text-amber-300" : "text-primary"}`}>{p.code}</p>
          </div>
          <button onClick={onCopy}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[12px] font-bold text-white transition-all hover:opacity-90 active:scale-[0.97] ${isPremium ? "bg-amber-500" : ""}`}
            style={isPremium ? {} : { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}>
            <Copy size={12} /> Copy
          </button>
        </div>

        {/* Footer meta */}
        <div className="flex items-center flex-wrap gap-3 mb-3">
          <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className={`size-1.5 rounded-full ${p.minTxn === "None" ? "bg-zinc-500" : "bg-violet-400"}`} />
            {p.minTxn === "None" ? "No minimum" : `Min: ${p.minTxn}`}
          </span>
          {p.segment ? (
            <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Users2 size={9} /> {p.segment}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              All users
            </span>
          )}
        </div>

        {/* Usage bar */}
        <div className="flex items-center gap-2">
          {p.limit === null ? (
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Infinity size={12} className="text-primary" />
              <span>{p.uses} redemptions · <span className="text-primary font-semibold">Unlimited</span></span>
            </div>
          ) : (
            <>
              <div className="flex-1 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: isPremium ? "#F59E0B" : "linear-gradient(90deg, #7B3FE4, #A78BFA)" }} />
              </div>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{p.uses}/{p.limit} used</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
