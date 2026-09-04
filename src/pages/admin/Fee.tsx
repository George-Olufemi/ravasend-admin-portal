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
} from "lucide-react";
import { feesAPI, Fee as ApiFee, CreateFeeData } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

// ─── Types & Configuration ──────────────────────────────────────────────────

export type FeeTypeKey = "conversion" | "forex" | "withdrawal";

export interface FeeRule {
  id: string;
  _id?: string;
  feeType: FeeTypeKey;
  feeTypeLabel: string;
  name: string;
  category: string;
  scope: "all";
  base: string;
  currencies: string[];
  status: "active" | "inactive";
  amountRaw: number;
  updatedAt?: string;
}

type FeeFormState = {
  feeType: FeeTypeKey;
  amount: string;
};

const FEE_TYPE_CONFIG: Record<FeeTypeKey, { label: string; category: string; defaultCurrencies: string[] }> = {
  conversion: {
    label: "Conversion Fee",
    category: "Crypto",
    defaultCurrencies: ["NGN", "USDC", "USDT"],
  },
  forex: {
    label: "Forex Fee",
    category: "Cross-border",
    defaultCurrencies: ["USD", "GBP", "EUR"],
  },
  withdrawal: {
    label: "Withdrawal Fee",
    category: "Bank Transfers",
    defaultCurrencies: ["NGN"],
  },
};

// ─── UI Helper Components ───────────────────────────────────────────────────

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
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="w-full sm:max-w-[540px] overflow-y-auto bg-background p-6 flex flex-col justify-between border-l border-border z-50">
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
  const isFree = f.amountRaw === 0;

  return (
    <div
      className={`bg-card border border-border rounded-2xl p-5 transition-all hover:border-primary/20 group ${
        f.status === "inactive" ? "opacity-50" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-violet-500/10 border-violet-500/20 text-violet-400">
              {f.category}
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/[0.06] text-muted-foreground border border-border">
              {f.feeTypeLabel}
            </span>
            {isFree && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FREE
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
          <p className="text-[14px] font-bold text-foreground leading-snug">{f.name}</p>
        </div>
        <div className="relative shrink-0 flex items-center gap-1">
          {/* <button
            onClick={onEdit}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-colors"
          >
            <Pencil size={12} />
          </button> */}
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

      <div className="mb-3 flex items-center gap-2 p-2.5 bg-secondary/40 rounded-xl border border-border">
        <Globe2 size={11} className="text-muted-foreground shrink-0" />
        <p className="text-[11px] text-muted-foreground">All transactions</p>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-[9px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
            Fee charged
          </p>
          <p className="text-[15px] font-black text-foreground font-mono">
            {isFree ? "Free" : f.base}
          </p>
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
      {f.updatedAt && (
        <p className="mt-2.5 text-[10px] text-muted-foreground border-t border-border pt-2">
          Last updated: {new Date(f.updatedAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}

// ─── Main Fee Page Component ──────────────────────────────────────────────────

function FeePage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [fees, setFees] = useState<FeeRule[]>([]);
  const [showPanel, setShowPanel] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState("All");

  const [form, setForm] = useState<FeeFormState>({
    feeType: "conversion",
    amount: "",
  });

  // Fetch all 3 fee endpoints
  const { data: feeData, isLoading } = useQuery({
    queryKey: ["fees"],
    queryFn: async () => {
      const [conversionRes, forexRes, withdrawalRes] = await Promise.all([
        feesAPI.getAll(),
        feesAPI.getAllForexFee(),
        feesAPI.getAllWithdrawalFees(),
      ]);

      return {
        conversion: conversionRes?.data || [],
        forex: forexRes?.data || [],
        withdrawal: withdrawalRes?.data || [],
      };
    },
  });

  useEffect(() => {
    if (feeData) {
      const list: FeeRule[] = [];

      // Conversion fees
      (feeData.conversion || []).forEach((item: ApiFee) => {
        list.push({
          id: item._id,
          _id: item._id,
          feeType: "conversion",
          feeTypeLabel: "Conversion Fee",
          name: "Currency Conversion Fee",
          category: "Crypto",
          scope: "all",
          base: `₦${item.amount}`,
          currencies: ["NGN", "USDC", "USDT"],
          status: "active",
          amountRaw: item.amount,
          updatedAt: item.updatedAt || item.createdAt,
        });
      });

      // Forex fees
      (feeData.forex || []).forEach((item: ApiFee) => {
        list.push({
          id: item._id,
          _id: item._id,
          feeType: "forex",
          feeTypeLabel: "Forex Fee",
          name: "Foreign Bank Transfer Fee",
          category: "Cross-border",
          scope: "all",
          base: `₦${item.amount}`,
          currencies: ["USD", "GBP", "EUR"],
          status: "active",
          amountRaw: item.amount,
          updatedAt: item.updatedAt || item.createdAt,
        });
      });

      // Withdrawal fees
      (feeData.withdrawal || []).forEach((item: ApiFee) => {
        list.push({
          id: item._id,
          _id: item._id,
          feeType: "withdrawal",
          feeTypeLabel: "Withdrawal Fee",
          name: "Local Bank Transfer Fee",
          category: "Bank Transfers",
          scope: "all",
          base: `₦${item.amount}`,
          currencies: ["NGN"],
          status: "active",
          amountRaw: item.amount,
          updatedAt: item.updatedAt || item.createdAt,
        });
      });

      setFees(list);
    }
  }, [feeData]);

  const createMutation = useMutation({
    mutationFn: ({ feeType, data }: { feeType: FeeTypeKey; data: CreateFeeData }) => {
      if (feeType === "forex") return feesAPI.createForexFee(data);
      if (feeType === "withdrawal") return feesAPI.createWithdrawalFee(data);
      return feesAPI.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setShowPanel(false);
      setForm({ feeType: "conversion", amount: "" });
      toast({ title: "Success", description: "Fee created successfully!" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to create fee",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateFeeData> }) =>
      feesAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      setShowPanel(false);
      setEditingId(null);
      setForm({ feeType: "conversion", amount: "" });
      toast({ title: "Success", description: "Fee updated successfully!" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to update fee",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: feesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fees"] });
      toast({ title: "Success", description: "Fee deleted successfully!" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete fee",
      });
    },
  });

  const openAdd = () => {
    setEditingId(null);
    setForm({ feeType: "conversion", amount: "" });
    setShowPanel(true);
  };

  const openEdit = (f: FeeRule) => {
    setEditingId(f.id);
    setForm({
      feeType: f.feeType,
      amount: String(f.amountRaw),
    });
    setShowPanel(true);
  };

  const saveRule = () => {
    if (!form.amount) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please enter a valid fee amount.",
      });
      return;
    }

    const rawAmt = form.amount.replace(/[^0-9.]/g, "");

    if (editingId && !editingId.startsWith("f")) {
      updateMutation.mutate({ id: editingId, data: { amount: rawAmt } });
    } else {
      createMutation.mutate({ feeType: form.feeType, data: { amount: rawAmt } });
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

  const filterTabs = ["All", "Conversion Fee", "Forex Fee", "Withdrawal Fee"];

  const visible = useMemo(() => {
    if (filterCat === "All") return fees;
    if (filterCat === "Conversion Fee") return fees.filter((f) => f.feeType === "conversion");
    if (filterCat === "Forex Fee") return fees.filter((f) => f.feeType === "forex");
    if (filterCat === "Withdrawal Fee") return fees.filter((f) => f.feeType === "withdrawal");
    return fees;
  }, [fees, filterCat]);

  const convAmt = useMemo(() => {
    const f = fees.find((x) => x.feeType === "conversion");
    return f ? f.base : "Not set";
  }, [fees]);

  const forexAmt = useMemo(() => {
    const f = fees.find((x) => x.feeType === "forex");
    return f ? f.base : "Not set";
  }, [fees]);

  const withdrawAmt = useMemo(() => {
    const f = fees.find((x) => x.feeType === "withdrawal");
    return f ? f.base : "Not set";
  }, [fees]);

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
        <StatCard label="Conversion Fee" value={convAmt} sub="Applied to currency swap" />
        <StatCard label="Forex Transfer Fee" value={forexAmt} sub="Applied to foreign transfers" />
        <StatCard label="Withdrawal Fee" value={withdrawAmt} sub="Applied to local bank withdrawals" />
      </div>

      {/* Filter Pills */}
      <div className="flex items-center gap-1.5 mb-5 flex-wrap">
        {filterTabs.map((c) => {
          const count =
            c === "All"
              ? fees.length
              : c === "Conversion Fee"
              ? fees.filter((f) => f.feeType === "conversion").length
              : c === "Forex Fee"
              ? fees.filter((f) => f.feeType === "forex").length
              : fees.filter((f) => f.feeType === "withdrawal").length;

          return (
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
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Fee Cards Grid */}
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
            No fee rules found in this category.
          </div>
        )}
      </div>

      {/* Slide Panel for Add / Edit */}
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
        <div className="space-y-5">
          {/* Target Fee Type Selector */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-2">
              Fee Type <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { key: "conversion", label: "Conversion Fee" },
                  { key: "forex", label: "Forex Fee" },
                  { key: "withdrawal", label: "Withdrawal Fee" },
                ] as const
              ).map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, feeType: t.key }))}
                  className={`py-2.5 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    form.feeType === t.key
                      ? "bg-primary/15 text-primary border-primary/40"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Amount input */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
              Fee Amount (₦) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={form.amount}
              onChange={(e) => setForm((prev) => ({ ...prev, amount: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. 150 or 9 or 0.8"
            />
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

export default FeePage;
