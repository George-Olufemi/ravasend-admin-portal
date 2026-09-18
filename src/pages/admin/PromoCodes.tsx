import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Copy,
  MoreHorizontal,
  ToggleLeft,
  Users2,
  Infinity,
  Loader2,
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

import {
  PromoCode,
  VALID_SEGMENT_TERMS,
  resolveSegmentTerm,
  genPromoCode,
  daysUntil,
  fmtN,
  PageHeader,
  PurpleBtn,
  StatCard,
  SlidePanel,
  PromoCard,
} from "@/features/promo-codes";


function PromoCodesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [targetUserIds, setTargetUserIds] = useState<string[]>([]);
  const [fetchingSegmentUsers, setFetchingSegmentUsers] = useState(false);

  const [newCode, setNewCode] = useState({
    generatedCode: genPromoCode(),
    tier: "standard" as "premium" | "standard",
    rewardAmt: "",
    description: "",
    minTxn: "",
    segmentId: "" as string,
    unlimited: false,
    limit: "100",
    expiresInDays: "30",
  });

  const regenCode = () => setNewCode((n) => ({ ...n, generatedCode: genPromoCode() }));

  // Main promo list query
  const { data: promoData, isLoading } = useQuery({
    queryKey: ["promocodes"],
    queryFn: promoCodesAPI.getAll,
  });

  // Card stats queries
  const { data: activePromoCountRes } = useQuery({
    queryKey: ["promo-active-count"],
    queryFn: promoCodesAPI.getNumberOfActivePromo,
  });

  const { data: redeemedPromoRes } = useQuery({
    queryKey: ["promo-redeemed-count"],
    queryFn: promoCodesAPI.getNumberOfPromoRedeemed,
  });

  const { data: totalValueRes } = useQuery({
    queryKey: ["promo-total-value"],
    queryFn: promoCodesAPI.getTotalValueGiven,
  });

  // Segments query
  const { data: segmentsResponse } = useQuery({
    queryKey: ["segments"],
    queryFn: segmentAPI.getAllSegments,
  });

  // When selected segment changes, map segment name to valid segmentTerm & fetch user IDs via getTargetSegmentUsers
  useEffect(() => {
    if (!newCode.segmentId) {
      setTargetUserIds([]);
      return;
    }

    let isMounted = true;
    setFetchingSegmentUsers(true);

    const matchedSeg = segmentsResponse?.data?.find((s) => s._id === newCode.segmentId);
    const segmentName = matchedSeg ? matchedSeg.segmentName : newCode.segmentId;
    const validTerm = resolveSegmentTerm(segmentName);

    promoCodesAPI
      .getTargetSegmentUsers(validTerm)
      .then((res) => {
        if (isMounted) {
          if (res?.data && Array.isArray(res.data)) {
            const ids = res.data.map((u: any) => u._id).filter(Boolean);
            setTargetUserIds(ids);
          } else {
            setTargetUserIds([]);
          }
        }
      })
      .catch((err) => {
        console.error("Error fetching target segment users:", err);
        if (isMounted) setTargetUserIds([]);
      })
      .finally(() => {
        if (isMounted) setFetchingSegmentUsers(false);
      });

    return () => {
      isMounted = false;
    };
  }, [newCode.segmentId, segmentsResponse]);

  // Map API response to PromoCode component state
  useEffect(() => {
    if (promoData?.data && Array.isArray(promoData.data)) {
      const mapped = promoData.data.map((p: ApiPromoCode): PromoCode => {
        const rewardVal = p.rewardAmount ?? (p as any).discount ?? 0;
        const rewardAmtStr =
          typeof rewardVal === "number"
            ? `₦${fmtN(rewardVal)}`
            : String(rewardVal).startsWith("₦")
            ? String(rewardVal)
            : `₦${rewardVal}`;
        const minTxnVal = p.transactionAmount;
        let minTxnStr = "None";
        if (minTxnVal && Number(minTxnVal) > 0) {
          minTxnStr = `₦${fmtN(Number(minTxnVal))}`;
        }
        let segName: string | null = null;
        if (p.targetSegments && p.targetSegments.length > 0) {
          if (segmentsResponse?.data) {
            const matchedSeg = segmentsResponse.data.find((s) => s._id === p.targetSegments![0]);
            if (matchedSeg) segName = matchedSeg.segmentName;
          }
          if (!segName) {
            segName = `${p.targetSegments.length} user(s)`;
          }
        }

        return {
          id: p._id,
          code: p.promoCode,
          tier: p.promoType?.toLowerCase() === "premium" ? "premium" : "standard",
          rewardAmt: rewardAmtStr,
          description: p.description || "Reward promo code",
          minTxn: minTxnStr,
          segment: segName,
          uses: p.usageCount || 0,
          limit: p.maxUsage !== undefined && p.maxUsage !== null && p.maxUsage < 999999 ? p.maxUsage : null,
          expires: p.expiredAt ? p.expiredAt.split("T")[0] : "",
          status: p.status === "inactive" || p.isDeleted ? "inactive" : "active",
        };
      });
      setPromos(mapped);
    }
  }, [promoData, segmentsResponse]);

  const createMutation = useMutation({
    mutationFn: promoCodesAPI.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["promocodes"] });
      queryClient.invalidateQueries({ queryKey: ["promo-active-count"] });
      toast({ title: "Success", description: "Promo code created successfully!" });
      setShowCreate(false);
      setNewCode({
        generatedCode: genPromoCode(),
        tier: "standard",
        rewardAmt: "",
        description: "",
        minTxn: "",
        segmentId: "",
        unlimited: false,
        limit: "100",
        expiresInDays: "30",
      });
      setTargetUserIds([]);
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
      queryClient.invalidateQueries({ queryKey: ["promo-active-count"] });
      queryClient.invalidateQueries({ queryKey: ["promo-redeemed-count"] });
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
    if (!newCode.rewardAmt) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please specify a reward amount.",
      });
      return;
    }

    const rewardNum = parseFloat(newCode.rewardAmt.replace(/[^0-9.]/g, "")) || 0;
    const minTxnStr = newCode.minTxn ? newCode.minTxn.replace(/[^0-9.]/g, "") : "0";

    const payload: CreatePromoCodeData = {
      promoCode: newCode.generatedCode,
      promoType: newCode.tier,
      rewardAmount: rewardNum,
      description: newCode.description || newCode.rewardAmt,
      transactionAmount: minTxnStr,
      maxUsage: newCode.unlimited ? 999999 : parseInt(newCode.limit) || 100,
      days: parseInt(newCode.expiresInDays || "30") || 30,
      targetSegments: targetUserIds,
    };

    createMutation.mutate(payload);
  };

  const toggleStatus = (code: string) => {
    setPromos((p) =>
      p.map((x) => (x.code === code ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x))
    );
    toast({ title: "Status Updated", description: `Promo code ${code} status changed.` });
  };

  const deletePromo = (code: string) => {
    deleteMutation.mutate(code);
    setPromos((p) => p.filter((x) => x.code !== code));
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied!",
      description: `Promo code ${code} copied to clipboard`,
    });
  };

  const previewExpiry = new Date(Date.now() + parseInt(newCode.expiresInDays || "30") * 86400000).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  const activeCodesVal =
    activePromoCountRes?.data !== undefined && typeof activePromoCountRes.data === "number"
      ? String(activePromoCountRes.data)
      : String(promos.filter((p) => p.status === "active").length);

  const totalRedemptionsVal =
    redeemedPromoRes?.data !== undefined && typeof redeemedPromoRes.data === "number"
      ? fmtN(redeemedPromoRes.data)
      : fmtN(promos.reduce((a, p) => a + p.uses, 0));

  const totalValueVal =
    totalValueRes?.data !== undefined && typeof totalValueRes.data === "number"
      ? `₦${fmtN(totalValueRes.data)}`
      : "₦0";

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
        title="Promo Codes"
        subtitle="Create and manage discount and reward promo codes"
        action={
          <PurpleBtn onClick={() => setShowCreate(true)}>
            <Plus size={13} /> Create Promo Code
          </PurpleBtn>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Active Codes" value={activeCodesVal} />
        <StatCard label="Total Redemptions" value={totalRedemptionsVal} />
        <StatCard label="Total Value Given" value={totalValueVal} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
        {promos.map((p) => (
          <PromoCard
            key={p.code}
            p={p}
            onCopy={() => handleCopyCode(p.code)}
            onToggle={() => toggleStatus(p.code)}
            onDelete={() => deletePromo(p.code)}
          />
        ))}
        {promos.length === 0 && (
          <div className="col-span-full py-16 text-center text-[13px] text-muted-foreground bg-card border border-border rounded-2xl">
            No promo codes found.
          </div>
        )}
      </div>

      <SlidePanel
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create Promo Code"
        subtitle="Code is auto-generated by the system"
        footer={
          <div className="flex gap-3">
            <PurpleBtn onClick={createPromo} disabled={createMutation.isPending || fetchingSegmentUsers}>
              {createMutation.isPending ? <Loader2 /> : "Create & Publish"}
            </PurpleBtn>
            <button
              onClick={() => setShowCreate(false)}
              className="flex-1 border border-border text-muted-foreground text-[13px] rounded-xl hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          {/* Generated code */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Generated Code</label>
            <div className="flex items-center gap-2 bg-secondary border border-border rounded-xl px-4 py-3">
              <span className="flex-1 text-[15px] font-black font-mono text-primary tracking-wider">
                {newCode.generatedCode}
              </span>
              <button
                onClick={regenCode}
                className="text-[11px] text-muted-foreground hover:text-primary transition-colors font-semibold border border-border rounded-lg px-3 py-1.5"
              >
                Regenerate
              </button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">Auto-generated unique 12-character code.</p>
          </div>

          {/* Tier */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-2">Tier</label>
            <div className="flex gap-2">
              {(["standard", "premium"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setNewCode((n) => ({ ...n, tier: t }))}
                  className={`flex-1 py-2.5 rounded-xl text-[12px] font-bold border transition-all ${
                    newCode.tier === t
                      ? t === "premium"
                        ? "bg-amber-500/15 text-amber-400 border-amber-500/40"
                        : "bg-primary/15 text-primary border-primary/40"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "premium" ? "★ Premium" : "Standard"}
                </button>
              ))}
            </div>
          </div>

          {/* Reward amount */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">
              Reward Amount <span className="text-red-400">*</span>
            </label>
            <input
              value={newCode.rewardAmt}
              onChange={(e) => setNewCode((n) => ({ ...n, rewardAmt: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. ₦1,000"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Reward Description</label>
            <input
              value={newCode.description}
              onChange={(e) => setNewCode((n) => ({ ...n, description: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. Crypto swap cashback reward"
            />
          </div>

          {/* Min txn */}
          <div>
            <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Minimum Transaction</label>
            <input
              value={newCode.minTxn}
              onChange={(e) => setNewCode((n) => ({ ...n, minTxn: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              placeholder="e.g. $500 or ₦50,000 — leave blank for none"
            />
          </div>

          {/* Segment targeting */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] text-muted-foreground font-semibold">Target Segment</label>
              <span className="text-[10px] text-muted-foreground">From Messaging → Segments</span>
            </div>
            <select
              value={newCode.segmentId}
              onChange={(e) => setNewCode((n) => ({ ...n, segmentId: e.target.value }))}
              className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground focus:outline-none focus:border-primary/50"
            >
              <option value="">All users (no segment restriction)</option>
              {segmentsResponse?.data?.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.segmentName} ({fmtN(s.totalUserTargeted || 0)} users)
                </option>
              ))}
            </select>
            {fetchingSegmentUsers && (
              <p className="text-[10px] text-primary mt-1 flex items-center gap-1">
                <LoadingSpinner size="sm" /> Fetching segment user IDs...
              </p>
            )}
            {!fetchingSegmentUsers && newCode.segmentId && (
              <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                {targetUserIds.length} user ID(s) targeted for this promo.
              </p>
            )}
            <p className="text-[10px] text-muted-foreground mt-1">
              The promo code card will only appear to users in this segment.
            </p>
          </div>

          {/* Usage limit + Expires */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[11px] text-muted-foreground font-semibold">Usage Limit</label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newCode.unlimited}
                    onChange={(e) => setNewCode((n) => ({ ...n, unlimited: e.target.checked }))}
                    className="accent-primary"
                  />
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <Infinity size={10} /> Unlimited
                  </span>
                </label>
              </div>
              <input
                value={newCode.limit}
                onChange={(e) => setNewCode((n) => ({ ...n, limit: e.target.value }))}
                disabled={newCode.unlimited}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 disabled:opacity-40"
                placeholder="e.g. 100"
              />
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-semibold block mb-1.5">Expires in (days)</label>
              <input
                type="number"
                min="1"
                value={newCode.expiresInDays}
                onChange={(e) => setNewCode((n) => ({ ...n, expiresInDays: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3.5 py-2.5 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
                placeholder="30"
              />
              <p className="text-[10px] text-muted-foreground mt-1">Expires: {previewExpiry}</p>
            </div>
          </div>
        </div>
      </SlidePanel>
    </div>
  );
}

export default PromoCodesPage;
