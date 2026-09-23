import React from "react";
import { Download, Users, Share2, TrendingUp, DollarSign, Zap } from "lucide-react";
import { ReferralBonus, ReferralDetailRecord } from "@/lib/api";
import { Page } from "../types";
import { fmtN } from "../utils";
import { PurpleBtn } from "./shared";
import { ViralLoopEditor } from "./ViralLoopEditor";
import { Skeleton } from "@/components/ui/skeleton";

export function ReferralOverviewPage({
  setPage,
  overviewData,
  detailsData,
  isLoading,
  exportCsv,
}: {
  setPage: (p: Page) => void;
  overviewData?: { count?: number; data?: ReferralBonus[] };
  detailsData?: ReferralDetailRecord[];
  isLoading?: boolean;
  exportCsv?: () => void;
}) {
  const referrals: ReferralBonus[] = overviewData?.data || [];

  const totalReferrersCount = referrals.length;
  const totalInvites = overviewData?.count ?? referrals.length;
  const totalReward = referrals.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Calculate conversion rate from actual data
  const convertedUsers = referrals.filter((r) => r.userId?.dollarWallet && r.userId.dollarWallet > 0).length;
  const conversionRate = referrals.length > 0 ? Math.round((convertedUsers / referrals.length) * 100) : 0;

  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Referral Program</h1>
          <PurpleBtn size="sm" onClick={exportCsv}><Download size={12} /> Export CSV</PurpleBtn>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Track every invite, signup, and reward across your network.</p>
      </div>

      {/* Sub-nav */}
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map((t) => (
          <button key={t.page} onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${t.page === "referral-overview" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={t.page === "referral-overview" ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-7">
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><Users size={16} className="text-primary" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total Referrers</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">{totalReferrersCount}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Unique users who referred</p>
          </div>
        </div>
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><Share2 size={16} className="text-emerald-400" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Total Referred</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">{totalInvites}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Users brought in</p>
          </div>
        </div>
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><TrendingUp size={16} className="text-amber-400" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Conversion Rate</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">{conversionRate}%</p>
            <p className="text-[10px] text-muted-foreground mt-1">Active deposited users</p>
          </div>
        </div>
        <div className="bg-white/[0.025] border border-border rounded-xl p-5 flex items-start gap-3">
          <div className="size-9 rounded-xl bg-white/5 border border-border flex items-center justify-center shrink-0"><DollarSign size={16} className="text-violet-400" /></div>
          <div>
            <p className="text-[11px] text-muted-foreground">Rewards Paid</p>
            <p className="text-[22px] font-bold text-foreground leading-none mt-0.5">₦{totalReward.toFixed(2)}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Total referral rewards</p>
          </div>
        </div>
      </div>

      {/* Performance chart */}
      <div className="bg-white/[0.025] border border-border rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[13px] font-bold text-foreground">Top Referrers</p>
            <p className="text-[11px] text-muted-foreground">By referrals sent and conversion rate</p>
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-3 py-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        ) : (
          <div className="space-y-3">
            {referrals.length > 0 ? (
              referrals.map((r, i) => {
                const referredCount = r.referredCount || 0;
                const converted = r.userId?.dollarWallet && r.userId.dollarWallet > 0 ? 1 : 0;
                const pct = referredCount > 0 ? Math.round((converted / referredCount) * 100) : 0;
                return (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 group border-b border-border/30 sm:border-0 pb-3 sm:pb-0">
                    <div className="flex items-center gap-2.5 w-full sm:w-52 shrink-0">
                      <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ background: `hsl(${260 + i * 30}, 70%, 55%)` }}>
                        {r.userId?.fullName?.split(" ").map((w) => w[0]).join("").slice(0, 2) || "??"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-foreground truncate">{r.userId?.fullName || "Unknown User"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.userId?.email || "-"}</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="h-7 bg-secondary rounded-lg overflow-hidden relative">
                        <div className="h-full rounded-lg flex items-center justify-end px-2.5 transition-all"
                          style={{ width: `${Math.min(100, Math.max(20, ((r.amount || 0) / 30) * 100))}%`, minWidth: 60, background: `linear-gradient(90deg, hsl(${260 + i * 30}, 70%, 45%), hsl(${260 + i * 30}, 70%, 55%))` }}>
                          <span className="text-[10px] font-bold text-white">₦{r.amount || 0}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-36 shrink-0">
                      <div className="text-left sm:text-right flex-1">
                        <p className="text-[11px] font-bold text-foreground">{referredCount} referred</p>
                        <p className={`text-[10px] font-semibold ${pct >= 50 ? "text-emerald-400" : pct > 0 ? "text-amber-400" : "text-zinc-500"}`}>{pct}% converted</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${pct > 0 ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"}`}>
                        {pct > 0 ? "active" : "inactive"}
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground text-[12px]">No referral data available</div>
            )}
          </div>
        )}
      </div>

      {/* Viral Loop section header */}
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="size-5 rounded-lg bg-primary/15 flex items-center justify-center">
            <Zap size={11} className="text-primary" />
          </div>
          <h2 className="text-[14px] font-bold text-foreground">Viral Loop — 7-Step Reward System</h2>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">LIVE</span>
        </div>
        <p className="text-[12px] text-muted-foreground ml-7">Configure rewards at each step of the referral journey. Referrers can earn up to ₦13,869 per successful invite.</p>
      </div>

      {/* Viral Loop Editor + Funnel side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 mb-6">
        <div className="bg-white/[0.025] border border-border rounded-xl p-4 sm:p-5 overflow-y-auto max-h-[600px]">
          <ViralLoopEditor detailsData={detailsData} />
        </div>
        <div className="space-y-4">
          {/* Funnel */}
          <div className="bg-white/[0.025] border border-border rounded-xl p-5">
            <p className="text-[13px] font-bold text-foreground mb-1">Conversion Funnel</p>
            <p className="text-[11px] text-muted-foreground mb-4">Where referred users stand across 7 steps</p>
            <div className="space-y-2">
              {[
                { label: "Step 1 — Invite sent", pct: 100, color: "#7B3FE4" },
                { label: "Step 2 — Registered", pct: 72, color: "#6366F1" },
                { label: "Step 3 — KYC / Wallet", pct: 51, color: "#3B82F6" },
                { label: "Step 4 — ≥$100 in", pct: 34, color: "#10B981" },
                { label: "Step 5 — First bill", pct: 28, color: "#F59E0B" },
                { label: "Step 6 — ≥$500 in", pct: 18, color: "#EF4444" },
                { label: "Step 7 — ≥$1K in", pct: 9, color: "#EC4899" },
              ].map((f) => (
                <div key={f.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-muted-foreground">{f.label}</span>
                    <span className="text-[10px] font-bold text-foreground">{f.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${f.pct}%`, backgroundColor: f.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* K-Factor card */}
          <div className="bg-white/[0.025] border border-border rounded-xl p-5">
            <p className="text-[13px] font-bold text-foreground mb-3">Virality Metrics</p>
            <div className="space-y-3">
              {[
                { label: "K-Factor", value: "0.72", sub: "avg invites × conversion", color: "text-primary" },
                { label: "Avg time to Step 4", value: "11d", sub: "invite to first deposit", color: "text-amber-400" },
                { label: "Avg referrer lifetime", value: `₦${fmtN(Math.round(totalReward / (referrals.length || 1)))}`, sub: "avg reward earned", color: "text-emerald-400" },
                { label: "Viral cycle time", value: "4.2d", sub: "trigger to new signup", color: "text-violet-400" },
              ].map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-foreground">{m.label}</p>
                    <p className="text-[10px] text-muted-foreground">{m.sub}</p>
                  </div>
                  <span className={`text-[16px] font-black font-mono ${m.color}`}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
