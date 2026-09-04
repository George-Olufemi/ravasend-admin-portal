import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Copy,
  MoreHorizontal,
  ToggleLeft,
  Users2,
  Infinity,
} from "lucide-react";
import {
  promoCodesAPI,
  segmentAPI,
  PromoCode as ApiPromoCode,
  CreatePromoCodeData,
} from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Card, CardContent } from "@/components/ui/card";

export interface PromoCode {
  id?: string;
  code: string;
  tier: "premium" | "standard";
  rewardAmt: string;
  description: string;
  minTxn: string;
  segment?: string | null;
  uses: number;
  limit: number | null;
  expires: string;
  status: "active" | "inactive";
}

function daysUntil(dateStr: string) {
  if (!dateStr) return 0;
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / 86400000));
}

function fmtN(num: number) {
  return new Intl.NumberFormat().format(num || 0);
}

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

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="bg-card border-border/50 shadow-card">
      <CardContent className="p-5">
        <p className="text-[12px] font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-foreground mt-1">{value}</p>
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

function PromoCard({ p, onCopy, onToggle, onDelete }: {
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

function PromoCodesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newCode, setNewCode] = useState({
    discount: "",
    expiredAt: "",
    maxUsage: "1",
    transactionAmount: "",
  });

  const { data: promoData, isLoading } = useQuery({
    queryKey: ["promocodes"],
    queryFn: promoCodesAPI.getAll,
  });

  const { data: segmentsResponse } = useQuery({
    queryKey: ["segments"],
    queryFn: segmentAPI.getAllSegments,
  });

  useEffect(() => {
    if (promoData?.data) {
      const mapped = promoData.data.map((p: ApiPromoCode): PromoCode => {
        const rewardVal = p.rewardAmount ?? p.discount ?? 0;
        const rewardAmtStr = typeof rewardVal === "number" ? `₦${fmtN(rewardVal)}` : String(rewardVal).startsWith("₦") ? String(rewardVal) : `₦${rewardVal}`;
        const minTxnVal = p.transactionAmount;
        let minTxnStr = "None";
        if (minTxnVal && minTxnVal > 0) {
          minTxnStr = `₦${fmtN(minTxnVal)}`;
        }
        let segName: string | null = null;
        if (p.targetSegments && p.targetSegments.length > 0 && segmentsResponse?.data) {
          const matchedSeg = segmentsResponse.data.find((s) => s._id === p.targetSegments![0]);
          if (matchedSeg) segName = matchedSeg.segmentName;
        }

        return {
          id: p._id,
          code: p.promoCode,
          tier: (p.promoType?.toLowerCase() === "premium" ? "premium" : "standard"),
          rewardAmt: rewardAmtStr,
          description: p.description || "Cashback reward",
          minTxn: minTxnStr,
          segment: segName,
          uses: p.usageCount || 0,
          limit: (p.maxUsage && p.maxUsage < 999999) ? p.maxUsage : null,
          expires: p.expiredAt ? p.expiredAt.split("T")[0] : "",
          status: (p.status === "inactive" || p.isDeleted) ? "inactive" : "active",
        };
      });
      setPromos(mapped);
    }
  }, [promoData, segmentsResponse]);

  const createMutation = useMutation({
    mutationFn: promoCodesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocodes"] });
      toast({ title: "Success", description: "Promo code created successfully!" });
      setShowCreate(false);
      setNewCode({ discount: "", expiredAt: "", maxUsage: "1", transactionAmount: "" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to create promo code",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: promoCodesAPI.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocodes"] });
      toast({ title: "Success", description: "Promo code deleted successfully!" });
    },
    onError: (err: any) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: err?.response?.data?.message || "Failed to delete promo code",
      });
    },
  });

  const createPromo = () => {
    if (!newCode.discount || !newCode.expiredAt || !newCode.transactionAmount) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fill in all required fields (Discount, Expiration Date, and Min Transaction).",
      });
      return;
    }

    const payload: CreatePromoCodeData = {
      discount: newCode.discount.replace(/[^0-9.]/g, ""),
      expiredAt: newCode.expiredAt,
      maxUsage: parseInt(newCode.maxUsage) || 1,
      transactionAmount: newCode.transactionAmount.replace(/[^0-9.]/g, ""),
    };

    createMutation.mutate(payload);
  };

  const toggleStatus = (code: string) => {
    setPromos(p => p.map(x => x.code === code ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x));
    toast({ title: "Status Updated", description: `Promo code ${code} status changed.` });
  };

  const deletePromo = (code: string) => {
    deleteMutation.mutate(code);
    setPromos(p => p.filter(x => x.code !== code));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Promo code ${code} copied to clipboard`,
    });
  };

  const totalValueGiven = useMemo(() => {
    let total = 0;
    promos.forEach((p) => {
      const numeric = parseInt(p.rewardAmt.replace(/[^0-9]/g, ""), 10) || 0;
      total += numeric * (p.uses || 1);
    });
    return total > 0 ? `₦${fmtN(total)}` : "₦0";
  }, [promos]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-7">
      <PageHeader title="Promo Codes" subtitle="Create and manage discount and reward promo codes"
        action={<PurpleBtn onClick={() => setShowCreate(true)}><Plus size={13} /> Create Promo Code</PurpleBtn>} />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Codes" value={String(promos.filter(p => p.status === "active").length)} />
        <StatCard label="Total Redemptions" value={fmtN(promos.reduce((a, p) => a + p.uses, 0))} />
        <StatCard label="Total Value Given" value={totalValueGiven} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {promos.map(p => (
          <PromoCard key={p.code} p={p}
            onCopy={() => handleCopyCode(p.code)}
            onToggle={() => toggleStatus(p.code)}
            onDelete={() => deletePromo(p.code)} />
        ))}
        {promos.length === 0 && (
          <div className="col-span-full py-16 text-center text-[13px] text-muted-foreground bg-card border border-border rounded-2xl">
            No promo codes found.
          </div>
        )}
      </div>

      <SlidePanel open={showCreate} onClose={() => setShowCreate(false)} title="Create Promo Code" subtitle="Code is auto-generated by the system on publish"
        footer={
          <div className="flex gap-3">
            <PurpleBtn onClick={createPromo} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Publishing..." : "Create & Publish"}
            </PurpleBtn>
            <button onClick={() => setShowCreate(false)} className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground hover:bg-white/5 transition-colors">Cancel</button>
          </div>
        }>
        <div className="space-y-5">
          {/* Discount / Reward amount */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Discount Amount (₦) <span className="text-red-400">*</span></label>
            <input value={newCode.discount} onChange={e => setNewCode(n => ({ ...n, discount: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. 150" />
          </div>

          {/* Transaction Amount */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Minimum Transaction Amount (₦) <span className="text-red-400">*</span></label>
            <input value={newCode.transactionAmount} onChange={e => setNewCode(n => ({ ...n, transactionAmount: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. 350000" />
          </div>

          {/* Max Usage */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Max Usage Count <span className="text-red-400">*</span></label>
            <input type="number" min="1" value={newCode.maxUsage} onChange={e => setNewCode(n => ({ ...n, maxUsage: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="1" />
          </div>

          {/* Expiration Date */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Expiry Date <span className="text-red-400">*</span></label>
            <input type="date" value={newCode.expiredAt} onChange={e => setNewCode(n => ({ ...n, expiredAt: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

export default PromoCodesPage;
