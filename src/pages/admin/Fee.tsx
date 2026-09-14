import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Pencil,
  MoreHorizontal,
  ToggleLeft,
  Globe2,
  SlidersHorizontal,
  DollarSign,
  Percent,
  Zap,
  CheckCircle2,
  Share2,
  Building2,
  Coins,
  Hash,
  ArrowRight,
  AlertTriangle,
  Infinity,
} from "lucide-react";
import { feesAPI, Fee as ApiFee } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

// ─── Constants & Configurations ─────────────────────────────────────────────

const FEE_CATS = [
  { label: "Bank Transfers", color: "blue" },
  { label: "Crypto", color: "violet" },
  { label: "Bills & Airtime", color: "orange" },
  { label: "Cross-border", color: "cyan" },
  { label: "Internal Transfer", color: "green" },
  { label: "Other", color: "zinc" },
];

const CURRENCIES = ["NGN", "USDC", "USDT", "USD", "GBP", "EUR", "GHS"];

const catColorMap: Record<string, string> = {
  blue: "bg-blue-500/10 border-blue-500/20 text-blue-400",
  violet: "bg-violet-500/10 border-violet-500/20 text-violet-400",
  orange: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  cyan: "bg-cyan-500/10 border-cyan-500/20 text-cyan-400",
  green: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
  zinc: "bg-zinc-500/10 border-zinc-500/20 text-zinc-400",
};

const USER_COMMISSION_PCT = 30;
const PLATFORM_COMMISSION_PCT = 70;

const BILLS_SERVICE_TYPES = [
  "Airtime (MTN, Airtel, GLO, 9mobile)",
  "Data Bundles",
  "Electricity Bills",
  "TV Subscriptions",
  "Internet Services",
  "Water Bills",
  "Insurance Premiums",
  "Custom Bills",
];

const BANK_PROVIDERS = [
  "Access Bank",
  "Zenith Bank",
  "GTBank",
  "First Bank",
  "UBA",
  "FCMB",
  "Fidelity Bank",
  "Stanbic IBTC",
  "Union Bank",
  "Polaris Bank",
  "Sterling Bank",
  "Wema Bank",
  "Keystone Bank",
  "Heritage Bank",
  "Ecobank",
  "JAIZ Bank",
  "Kuda Bank",
  "OPay",
  "Palmpay",
  "Moniepoint",
];

const CRYPTO_ASSETS = [
  "BTC",
  "ETH",
  "USDC",
  "USDT",
  "SOL",
  "BNB",
  "MATIC",
  "TRX",
  "XRP",
  "AVAX",
];

const BILL_SERVICE_PROVIDERS = [
  "MTN Airtime",
  "Airtel Airtime",
  "GLO Airtime",
  "9mobile Airtime",
  "MTN Data",
  "Airtel Data",
  "GLO Data",
  "9mobile Data",
  "AEDC (Abuja)",
  "EKEDC (Eko)",
  "IKEDC (Ikeja)",
  "PHEDC (Port Harcourt)",
  "EEDC (Enugu)",
  "Jos Electricity",
  "Kaduna Electricity",
  "DSTV",
  "GOtv",
  "Startimes",
  "Spectranet",
  "Smile Internet",
  "WAEC",
  "NECO",
  "JAMB",
];

const CORRIDOR_PROVIDERS = [
  "Nigeria",
  "Ghana",
  "Kenya",
  "United Kingdom",
  "United States",
  "Canada",
  "South Africa",
  "Uganda",
  "Tanzania",
  "Rwanda",
  "Zimbabwe",
  "Zambia",
  "Cameroon",
  "Ivory Coast",
  "Senegal",
  "Ethiopia",
  "Egypt",
  "Morocco",
  "Germany",
  "France",
  "Netherlands",
  "Australia",
  "UAE",
  "India",
];

const PROVIDERS_BY_CATEGORY: Record<string, string[]> = {
  "Bank Transfers": BANK_PROVIDERS,
  Crypto: CRYPTO_ASSETS,
  "Bills & Airtime": BILL_SERVICE_PROVIDERS,
  "Cross-border": CORRIDOR_PROVIDERS,
  "Internal Transfer": [],
};

const VTPASS_SERVICES = [
  { service: "MTN Airtime", commission: 3.0 },
  { service: "Airtel Airtime", commission: 4.0 },
  { service: "GLO Airtime", commission: 5.0 },
  { service: "9mobile Airtime", commission: 5.0 },
  { service: "MTN Data", commission: 3.0 },
  { service: "Airtel Data", commission: 4.0 },
  { service: "GLO Data", commission: 5.0 },
  { service: "9mobile Data", commission: 5.0 },
  { service: "DSTV Subscription", commission: 2.0 },
  { service: "GOtv Subscription", commission: 2.0 },
  { service: "Startimes Subscription", commission: 2.5 },
  { service: "Electricity (AEDC, EKEDC, IKEDC, etc.)", commission: 1.2 },
];

export interface FeeRule {
  id: string;
  _id?: string;
  name: string;
  category: string;
  feeModel: "flat" | "percentage" | "flat+percentage" | "free" | "commission";
  scope: "all" | "specific";
  providers: string[];
  direction: "all" | "deposit" | "withdrawal" | "swap";
  base: string;
  percent: string;
  cap: string;
  noCap: boolean;
  currencies: string[];
  minAmount: string;
  maxAmount: string;
  commissionUserPct: number;
  commissionPlatformPct: number;
  status: "active" | "inactive";
  updatedAt?: string;
  rawItem?: ApiFee;
}

export type FeeFormState = {
  name: string;
  category: string;
  feeModel: string;
  scope: "all" | "specific";
  providers: string[];
  direction: "all" | "deposit" | "withdrawal" | "swap";
  base: string;
  percent: string;
  cap: string;
  noCap: boolean;
  currencies: string[];
  minAmount: string;
  maxAmount: string;
  commissionUserPct: number;
  commissionPlatformPct: number;
};

// ─── UI Helpers ─────────────────────────────────────────────────────────────

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

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function PurpleBtn({
  children,
  onClick,
  className = "",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[12px] font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardContent className="p-5">
        <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5 font-medium">{sub}</p>}
      </CardContent>
    </Card>
  );
}

function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <SheetContent
        side="right"
        className="w-full sm:max-w-[540px] overflow-y-auto bg-background p-6 flex flex-col justify-between border-l border-border z-50"
      >
        <div>
          <SheetHeader className="mb-5 text-left">
            <SheetTitle className="text-xl font-bold text-foreground">{title}</SheetTitle>
            <p className="text-[12px] text-muted-foreground">{subtitle}</p>
          </SheetHeader>
          {children}
        </div>
        {footer && <div className="pt-6 border-t border-border mt-6">{footer}</div>}
      </SheetContent>
    </Sheet>
  );
}

// ─── Fee Card Component ─────────────────────────────────────────────────────

function FeeRuleCard({
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

// ─── Fee Form Component ─────────────────────────────────────────────────────

function FeeRuleForm({
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

// ─── Main Fee Page Component ──────────────────────────────────────────────────

function FeePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [globalComm, setGlobalComm] = useState({
    user: USER_COMMISSION_PCT,
    platform: PLATFORM_COMMISSION_PCT,
  });
  const [editingComm, setEditingComm] = useState(false);
  const [commDraft, setCommDraft] = useState(globalComm);
  const [showCommTable, setShowCommTable] = useState(false);

  const [fees, setFees] = useState<FeeRule[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("All");

  const blankForm = (): FeeFormState => ({
    name: "",
    category: "Bank Transfers",
    feeModel: "flat",
    scope: "all",
    providers: [],
    direction: "all",
    base: "",
    percent: "",
    cap: "",
    noCap: true,
    currencies: ["NGN"],
    minAmount: "",
    maxAmount: "",
    commissionUserPct: globalComm.user,
    commissionPlatformPct: globalComm.platform,
  });

  const [form, setForm] = useState<FeeFormState>(blankForm());

  // Map API response items to FeeRule format
  const mapApiFeeToRule = (item: ApiFee, defaultCategory: string): FeeRule => {
    let cat = defaultCategory;
    if (item.category) {
      if (item.category.toLowerCase().includes("crypto")) cat = "Crypto";
      else if (item.category.toLowerCase().includes("cross")) cat = "Cross-border";
      else if (item.category.toLowerCase().includes("bank")) cat = "Bank Transfers";
      else if (item.category.toLowerCase().includes("bill")) cat = "Bills & Airtime";
    }

    const feeModelRaw = (item.feeType || "FLAT").toLowerCase();
    let feeModel: FeeRule["feeModel"] = "flat";
    if (feeModelRaw.includes("percentage") && feeModelRaw.includes("flat")) feeModel = "flat+percentage";
    else if (feeModelRaw.includes("percentage")) feeModel = "percentage";
    else if (feeModelRaw.includes("free")) feeModel = "free";
    else if (feeModelRaw.includes("commission")) feeModel = "commission";

    let providers: string[] = [];
    let scope: "all" | "specific" = "all";

    if (item.assets && item.assets.length > 0) {
      scope = "specific";
      providers = item.assets;
    } else if (item.corridors && item.corridors.length > 0) {
      scope = "specific";
      providers = item.corridors;
    } else if (item.banks && item.banks.length > 0) {
      scope = "specific";
      providers = item.banks;
    } else if (item.services && item.services.length > 0) {
      scope = "specific";
      providers = item.services;
    } else if (item.applicationType && item.applicationType.startsWith("SPECIFIC")) {
      scope = "specific";
    }

    return {
      id: item._id,
      _id: item._id,
      name: item.ruleName || `${cat} Fee`,
      category: cat,
      feeModel,
      scope,
      providers,
      direction: "all",
      base: item.amount !== undefined ? `₦${item.amount}` : "",
      percent: item.percentage || "",
      cap: item.maximumAmount || "",
      noCap: !item.maximumAmount,
      currencies: item.currency ? [item.currency] : ["NGN"],
      minAmount: "",
      maxAmount: "",
      commissionUserPct: USER_COMMISSION_PCT,
      commissionPlatformPct: PLATFORM_COMMISSION_PCT,
      status: (item.status || "ACTIVE").toLowerCase() as "active" | "inactive",
      updatedAt: item.updatedAt || item.createdAt,
      rawItem: item,
    };
  };

  // Fetch all 4 fee endpoints
  const { data: feeData, isLoading } = useQuery({
    queryKey: ["fees"],
    queryFn: async () => {
      const [conversionRes, forexRes, withdrawalRes, billRes] = await Promise.all([
        feesAPI.getAll(),
        feesAPI.getAllForexFee(),
        feesAPI.getAllWithdrawalFees(),
        feesAPI.getAllBillFees(),
      ]);

      return {
        conversion: conversionRes?.data || [],
        forex: forexRes?.data || [],
        withdrawal: withdrawalRes?.data || [],
        bill: billRes?.data || [],
      };
    },
  });

  useEffect(() => {
    if (feeData) {
      const list: FeeRule[] = [];

      (feeData.conversion || []).forEach((item: ApiFee) => {
        list.push(mapApiFeeToRule(item, "Crypto"));
      });

      (feeData.forex || []).forEach((item: ApiFee) => {
        list.push(mapApiFeeToRule(item, "Cross-border"));
      });

      (feeData.withdrawal || []).forEach((item: ApiFee) => {
        list.push(mapApiFeeToRule(item, "Bank Transfers"));
      });

      (feeData.bill || []).forEach((item: ApiFee) => {
        list.push(mapApiFeeToRule(item, "Bills & Airtime"));
      });

      setFees(list);
    }
  }, [feeData]);

  const createMutation = useMutation({
    mutationFn: ({ feeType, data }: { feeType: string; data: any }) => {
      if (feeType === "forex") return feesAPI.createForexFee(data);
      if (feeType === "withdrawal") return feesAPI.createWithdrawalFee(data);
      if (feeType === "bill") return feesAPI.createBillFee(data);
      return feesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setShowPanel(false);
      setForm(blankForm());
      toast({ title: "Success", description: "Fee rule created successfully!" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to create fee rule",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => feesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setShowPanel(false);
      setEditingId(null);
      setForm(blankForm());
      toast({ title: "Success", description: "Fee rule updated successfully!" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to update fee rule",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: feesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast({ title: "Success", description: "Fee rule deleted successfully!" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete fee rule",
      });
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm(blankForm());
    setShowPanel(true);
  };

  const openEdit = (f: FeeRule) => {
    setEditingId(f.id);
    setForm({
      name: f.name,
      category: f.category,
      feeModel: f.feeModel,
      scope: f.scope,
      providers: f.providers,
      direction: f.direction,
      base: f.base.replace(/[^0-9.]/g, ""),
      percent: f.percent,
      cap: f.cap,
      noCap: f.noCap,
      currencies: f.currencies,
      minAmount: f.minAmount,
      maxAmount: f.maxAmount,
      commissionUserPct: f.commissionUserPct,
      commissionPlatformPct: f.commissionPlatformPct,
    });
    setShowPanel(true);
  };

  const saveRule = () => {
    const rawAmt = Number(form.base.replace(/[^0-9.]/g, "")) || 0;

    const appTypeMap: Record<string, { all: string; specific: string }> = {
      Crypto: { all: "ALL_ASSETS", specific: "SPECIFIC_ASSETS" },
      "Cross-border": { all: "ALL_CORRIDORS", specific: "SPECIFIC_CORRIDORS" },
      "Bank Transfers": { all: "ALL_BANKS", specific: "SPECIFIC_BANKS" },
      "Bills & Airtime": { all: "ALL_SERVICES", specific: "SPECIFIC_SERVICES" },
    };

    const catInfo = appTypeMap[form.category] || {
      all: "ALL_SERVICES",
      specific: "SPECIFIC_SERVICES",
    };
    const applicationType = form.scope === "specific" ? catInfo.specific : catInfo.all;

    let feeType = "FLAT";
    if (form.feeModel === "percentage") feeType = "PERCENTAGE";
    else if (form.feeModel === "flat+percentage") feeType = "FLAT + PERCENTAGE";
    else if (form.feeModel === "free") feeType = "FREE";
    else if (form.feeModel === "commission") feeType = "COMMISSION";

    const basePayload: any = {
      amount: rawAmt,
      ruleName: form.name || `${form.category} Fee`,
      category:
        form.category === "Cross-border"
          ? "Cross Border"
          : form.category === "Bank Transfers"
          ? "Bank Withdrwawl"
          : form.category === "Bills & Airtime"
          ? "Bill"
          : form.category,
      applicationType,
      currency: form.currencies[0] || "NGN",
      feeType,
      percentage: form.percent || "",
      maximumAmount: form.noCap ? "" : form.cap,
    };

    if (form.category === "Crypto") {
      basePayload.assets = form.scope === "specific" ? form.providers : [];
    } else if (form.category === "Cross-border") {
      basePayload.corridors = form.scope === "specific" ? form.providers : [];
    } else if (form.category === "Bank Transfers") {
      basePayload.banks = form.scope === "specific" ? form.providers : [];
    } else if (form.category === "Bills & Airtime") {
      basePayload.services = form.scope === "specific" ? form.providers : [];
    }

    if (editingId && !editingId.startsWith("f")) {
      updateMutation.mutate({ id: editingId, data: basePayload });
    } else {
      if (form.category === "Crypto")
        createMutation.mutate({ feeType: "conversion", data: basePayload });
      else if (form.category === "Cross-border")
        createMutation.mutate({ feeType: "forex", data: basePayload });
      else if (form.category === "Bank Transfers")
        createMutation.mutate({ feeType: "withdrawal", data: basePayload });
      else if (form.category === "Bills & Airtime")
        createMutation.mutate({ feeType: "bill", data: basePayload });
      else createMutation.mutate({ feeType: "conversion", data: basePayload });
    }
  };

  const toggleFee = (id: string) =>
    setFees((f) =>
      f.map((x) => (x.id === id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x))
    );

  const deleteFee = (id: string) => {
    deleteMutation.mutate(id);
    setFees((f) => f.filter((x) => x.id !== id));
  };

  const cats = ["All", ...FEE_CATS.map((c) => c.label)];
  const visible = filterCat === "All" ? fees : fees.filter((f) => f.category === filterCat);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      <PageHeader
        title="Fee Structure"
        subtitle="Platform fee rules for every transaction type"
        action={
          <PurpleBtn onClick={openAdd}>
            <Plus size={13} /> Add Fee Rule
          </PurpleBtn>
        }
      />

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard
          label="Active Fee Rules"
          value={String(fees.filter((f) => f.status === "active").length)}
        />
        <StatCard label="Total Categories" value={String(FEE_CATS.length)} sub="Configured types" />
        <StatCard
          label="Commission Split"
          value={`${globalComm.user}% / ${globalComm.platform}%`}
          sub="User discount / Platform revenue"
        />
      </div>

      {/* Bills commission info banner */}
      <div className="mb-4 bg-amber-500/[0.06] border border-amber-500/20 rounded-xl overflow-hidden">
        <div className="p-4 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-7 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0 mt-0.5">
              <Percent size={13} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-foreground mb-0.5">
                Bills & Airtime — Commission Model
              </p>
              <p className="text-[11px] text-muted-foreground">
                VTpass pays commission per transaction. You pass{" "}
                <span className="text-emerald-400 font-bold">{globalComm.user}%</span> to users as a
                discount and retain{" "}
                <span className="text-primary font-bold">{globalComm.platform}%</span> as revenue.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setCommDraft(globalComm);
                setEditingComm((v) => !v);
              }}
              className={`text-[11px] font-semibold border px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
                editingComm
                  ? "bg-primary/15 text-primary border-primary/30"
                  : "text-amber-400 border-amber-500/20 hover:bg-amber-500/10"
              }`}
            >
              {editingComm ? "Cancel" : "Edit Split"}
            </button>
            <button
              onClick={() => setShowCommTable((s) => !s)}
              className="text-[11px] text-muted-foreground border border-border px-3 py-1.5 rounded-lg hover:text-foreground transition-colors font-semibold shrink-0 whitespace-nowrap"
            >
              {showCommTable ? "Hide" : "View"} Rates
            </button>
          </div>
        </div>

        {editingComm && (
          <div className="border-t border-amber-500/20 p-4 bg-amber-500/[0.03]">
            <p className="text-[11px] text-muted-foreground mb-3">
              Changing the global split will update all Bills & Airtime commission rules.
            </p>
            <div className="flex items-end gap-3 flex-wrap">
              <div>
                <label className="text-[10px] text-emerald-400 font-semibold block mb-1.5">
                  User discount (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commDraft.user}
                  onChange={(e) => {
                    const u = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                    setCommDraft({ user: u, platform: 100 - u });
                  }}
                  className="w-24 bg-secondary border border-emerald-500/30 rounded-lg px-3 py-2 text-[14px] font-black text-emerald-400 focus:outline-none"
                />
              </div>
              <div className="pb-2 text-muted-foreground text-[12px]">+</div>
              <div>
                <label className="text-[10px] text-primary/80 font-semibold block mb-1.5">
                  Platform revenue (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={commDraft.platform}
                  onChange={(e) => {
                    const p = Math.min(100, Math.max(0, parseInt(e.target.value) || 0));
                    setCommDraft({ platform: p, user: 100 - p });
                  }}
                  className="w-24 bg-secondary border border-primary/30 rounded-lg px-3 py-2 text-[14px] font-black text-primary focus:outline-none"
                />
              </div>
              <div className="pb-2 text-muted-foreground text-[12px]">
                = {commDraft.user + commDraft.platform}%
              </div>
              <button
                onClick={() => {
                  setGlobalComm(commDraft);
                  setFees((f) =>
                    f.map((r) =>
                      r.feeModel === "commission"
                        ? {
                            ...r,
                            commissionUserPct: commDraft.user,
                            commissionPlatformPct: commDraft.platform,
                          }
                        : r
                    )
                  );
                  setEditingComm(false);
                }}
                disabled={commDraft.user + commDraft.platform !== 100}
                className="pb-0 px-4 py-2 rounded-lg text-[12px] font-bold text-white disabled:opacity-40 transition-all"
                style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
              >
                Save Split
              </button>
            </div>
            {commDraft.user + commDraft.platform !== 100 && (
              <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1">
                <AlertTriangle size={10} /> Must total 100%
              </p>
            )}
          </div>
        )}
      </div>

      {showCommTable && (
        <div className="mb-5 bg-card border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-border flex items-center justify-between">
            <p className="text-[12px] font-bold text-foreground">VTpass Commission Rates</p>
            <p className="text-[11px] text-muted-foreground">
              User gets {globalComm.user}% · Platform keeps {globalComm.platform}%
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Service",
                    "VTpass Commission",
                    `User Discount (${globalComm.user}%)`,
                    `Platform Revenue (${globalComm.platform}%)`,
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[10px] text-muted-foreground font-semibold uppercase tracking-wider px-4 py-3 whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {VTPASS_SERVICES.map((s) => {
                  const c = s.commission;
                  return (
                    <tr key={s.service} className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5 text-[12px] font-medium text-foreground">
                        {s.service}
                      </td>
                      <td className="px-4 py-2.5 text-[12px] font-mono text-foreground">{c}%</td>
                      <td className="px-4 py-2.5 text-[12px] font-mono text-emerald-400">
                        {((c * globalComm.user) / 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-2.5 text-[12px] font-mono text-primary">
                        {((c * globalComm.platform) / 100).toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category filter */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {cats.map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all whitespace-nowrap ${
              filterCat === c
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground border border-border"
            }`}
            style={
              filterCat === c
                ? { background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }
                : {}
            }
          >
            {c}{" "}
            <span
              className={`ml-1 text-[10px] ${
                filterCat === c ? "text-white/60" : "text-muted-foreground"
              }`}
            >
              {c === "All" ? fees.length : fees.filter((f) => f.category === c).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {visible.map((f) => (
          <FeeRuleCard
            key={f.id}
            f={f}
            onEdit={() => openEdit(f)}
            onToggle={() => toggleFee(f.id)}
            onDelete={() => deleteFee(f.id)}
          />
        ))}
        {visible.length === 0 && (
          <div className="col-span-2 py-16 text-center text-[13px] text-muted-foreground bg-card border border-border rounded-2xl">
            No fee rules in this category.
          </div>
        )}
      </div>

      <SlidePanel
        open={showPanel}
        onClose={() => setShowPanel(false)}
        title={editingId ? "Edit Fee Rule" : "Add Fee Rule"}
        subtitle={editingId ? "Update fee configuration" : "Configure a new platform fee"}
        footer={
          <div className="flex gap-3">
            <PurpleBtn
              onClick={saveRule}
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? "Saving..." : "Save Rule"}
            </PurpleBtn>
            <button
              onClick={() => setShowPanel(false)}
              className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        }
      >
        <FeeRuleForm value={form} onChange={setForm} />
      </SlidePanel>
    </div>
  );
}

export default FeePage;
