import React from "react";
import { DollarSign, Percent, Zap, CheckCircle2, Share2, Building2, Coins, Globe2, Hash, SlidersHorizontal, ArrowRight, AlertTriangle } from "lucide-react";
import { FeeFormState } from "../types";
import { FEE_CATS, PROVIDERS_BY_CATEGORY } from "../constants";

export function FeeRuleForm({
  value,
  onChange,
}: {
  value: FeeFormState;
  onChange: (v: FeeFormState) => void;
}) {
  const toggleCurrency = (c: string) =>
    onChange({
      ...value,
      currencies: value.currencies.includes(c)
        ? value.currencies.filter((x) => x !== c)
        : [...value.currencies, c],
    });

  const toggleProvider = (p: string) =>
    onChange({
      ...value,
      providers: value.providers.includes(p)
        ? value.providers.filter((x) => x !== p)
        : [...value.providers, p],
    });

  const availableProviders = PROVIDERS_BY_CATEGORY[value.category] || [];

  const FEE_MODELS = [
    { id: "flat", label: "Flat", desc: "Fixed amount per txn", icon: <DollarSign size={13} /> },
    { id: "percentage", label: "Percentage", desc: "% of transaction", icon: <Percent size={13} /> },
    { id: "flat+percentage", label: "Flat + %", desc: "Base + percentage", icon: <Zap size={13} /> },
    { id: "free", label: "Free", desc: "No charge", icon: <CheckCircle2 size={13} /> },
    { id: "commission", label: "Commission", desc: "Split VTpass payout", icon: <Share2 size={13} /> },
  ];

  const CAT_ICONS: Record<string, React.ReactNode> = {
    "Bank Transfers": <Building2 size={14} />,
    Crypto: <Coins size={14} />,
    "Bills & Airtime": <Zap size={14} />,
    "Cross-border": <Globe2 size={14} />,
    Other: <Hash size={14} />,
  };

  return (
    <div className="space-y-5">
      {/* Rule name */}
      <div>
        <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
          Rule Name <span className="text-red-400">*</span>
        </label>
        <input
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          placeholder="e.g. Standard Bank Withdrawal, USDC Deposit, Cross Border"
        />
      </div>

      {/* Category */}
      <div>
        <label className="text-[11px] text-muted-foreground font-semibold block mb-2">Category</label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {FEE_CATS.map((cat) => (
            <button
              key={cat.label}
              type="button"
              onClick={() =>
                onChange({ ...value, category: cat.label, scope: "all", providers: [] })
              }
              className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                value.category === cat.label
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-primary/20"
              }`}
            >
              <span className={value.category === cat.label ? "text-primary" : "text-muted-foreground"}>
                {CAT_ICONS[cat.label] || <Hash size={14} />}
              </span>
              <span className="text-[9px] font-bold leading-tight">
                {cat.label.replace(" & ", "/")}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Direction (Crypto only) */}
      {value.category === "Crypto" && (
        <div>
          <label className="text-[11px] text-muted-foreground font-semibold block mb-2">
            Direction
          </label>
          <div className="flex gap-2">
            {(["all", "deposit", "withdrawal", "swap"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onChange({ ...value, direction: d })}
                className={`flex-1 py-2 rounded-xl text-[11px] font-bold border transition-all capitalize ${
                  value.direction === d
                    ? "bg-primary/15 text-primary border-primary/40"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {d === "all" ? "All" : d}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Scope */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[11px] text-muted-foreground font-semibold">Applies to</label>
          {value.scope === "specific" && availableProviders.length > 0 && (
            <button
              type="button"
              onClick={() => onChange({ ...value, providers: availableProviders })}
              className="text-[10px] text-primary hover:underline"
            >
              Select all
            </button>
          )}
        </div>
        <div className="flex gap-2 mb-3">
          {(["all", "specific"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() =>
                onChange({ ...value, scope: s, providers: s === "all" ? [] : value.providers })
              }
              className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all flex items-center justify-center gap-2 ${
                value.scope === s
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? (
                <>
                  <Globe2 size={12} /> All{" "}
                  {value.category === "Bank Transfers"
                    ? "banks"
                    : value.category === "Crypto"
                    ? "assets"
                    : value.category === "Cross-border"
                    ? "corridors"
                    : "services"}
                </>
              ) : (
                <>
                  <SlidersHorizontal size={12} /> Specific
                </>
              )}
            </button>
          ))}
        </div>
        {value.scope === "specific" && availableProviders.length > 0 && (
          <div className="bg-secondary/40 border border-border rounded-xl p-3 max-h-48 overflow-y-auto">
            <div className="flex flex-wrap gap-1.5">
              {availableProviders.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleProvider(p)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${
                    value.providers.includes(p)
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {value.providers.length > 0 && (
              <p className="text-[10px] text-primary mt-2">{value.providers.length} selected</p>
            )}
          </div>
        )}
      </div>

      {/* Fee model */}
      <div>
        <label className="text-[11px] text-muted-foreground font-semibold block mb-2">
          Fee Model
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
          {FEE_MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ ...value, feeModel: m.id })}
              className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all ${
                value.feeModel === m.id
                  ? "border-primary/40 bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>{m.icon}</span>
              <span className="text-[9px] font-bold leading-tight">{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Commission model auto-switch for Bills */}
      {value.category === "Bills & Airtime" && value.feeModel !== "commission" && (
        <div className="p-3 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl text-[11px] text-muted-foreground flex items-center justify-between gap-3">
          <span>Bills & Airtime typically use the commission model.</span>
          <button
            type="button"
            onClick={() => onChange({ ...value, feeModel: "commission" })}
            className="text-amber-400 font-semibold whitespace-nowrap hover:underline text-[11px]"
          >
            Switch to commission →
          </button>
        </div>
      )}

      {/* Fee amounts */}
      {(value.feeModel === "flat" || value.feeModel === "flat+percentage") && (
        <div>
          <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
            Flat / Base Fee Amount <span className="text-red-400">*</span>
          </label>
          <input
            value={value.base}
            onChange={(e) => onChange({ ...value, base: e.target.value })}
            className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            placeholder="e.g. 35 or 9 or 0.8"
          />
        </div>
      )}
      {(value.feeModel === "percentage" || value.feeModel === "flat+percentage") && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
              Percentage (%)
            </label>
            <input
              value={value.percent}
              onChange={(e) => onChange({ ...value, percent: e.target.value })}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. 2%"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold">
                Maximum cap
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.noCap}
                  onChange={(e) => onChange({ ...value, noCap: e.target.checked })}
                  className="accent-primary"
                />
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Infinity size={10} /> No cap
                </span>
              </label>
            </div>
            <input
              value={value.cap}
              onChange={(e) => onChange({ ...value, cap: e.target.value })}
              disabled={value.noCap}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-40"
              placeholder="e.g. 5000"
            />
          </div>
        </div>
      )}

      {/* Commission model */}
      {value.feeModel === "commission" && (
        <div className="space-y-3">
          <div className="bg-amber-500/[0.06] border border-amber-500/20 rounded-xl p-3.5">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-2.5">
              Commission split
            </p>
            <div className="flex items-center gap-2 text-center">
              <div className="flex-1 bg-background/50 rounded-xl p-2.5 border border-border">
                <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                  VTpass pays
                </p>
                <p className="text-[15px] font-black text-foreground">X%</p>
              </div>
              <ArrowRight size={12} className="text-muted-foreground shrink-0" />
              <div className="flex-1 bg-emerald-500/[0.08] rounded-xl p-2.5 border border-emerald-500/20">
                <p className="text-[9px] text-emerald-400 uppercase tracking-wider font-semibold mb-1">
                  User discount
                </p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value.commissionUserPct}
                  onChange={(e) => {
                    const u = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                    onChange({
                      ...value,
                      commissionUserPct: u,
                      commissionPlatformPct: 100 - u,
                    });
                  }}
                  className="w-full bg-transparent text-[18px] font-black text-emerald-400 text-center focus:outline-none"
                />
                <p className="text-[9px] text-muted-foreground">% of X%</p>
              </div>
              <span className="text-muted-foreground text-[11px] shrink-0">+</span>
              <div className="flex-1 bg-primary/[0.08] rounded-xl p-2.5 border border-primary/20">
                <p className="text-[9px] text-primary/80 uppercase tracking-wider font-semibold mb-1">
                  Platform keeps
                </p>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={value.commissionPlatformPct}
                  onChange={(e) => {
                    const p = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                    onChange({
                      ...value,
                      commissionPlatformPct: p,
                      commissionUserPct: 100 - p,
                    });
                  }}
                  className="w-full bg-transparent text-[18px] font-black text-primary text-center focus:outline-none"
                />
                <p className="text-[9px] text-muted-foreground">% of X%</p>
              </div>
            </div>
            {value.commissionUserPct + value.commissionPlatformPct !== 100 && (
              <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                <AlertTriangle size={10} /> Must total 100%
              </p>
            )}
          </div>
        </div>
      )}

      {/* Currency selection */}
      <div>
        <label className="text-[11px] text-muted-foreground font-semibold block mb-2">Currency</label>
        <div className="flex flex-wrap gap-1.5">
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => toggleCurrency(c)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all ${
                value.currencies.includes(c)
                  ? "bg-primary/15 text-primary border-primary/40"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
