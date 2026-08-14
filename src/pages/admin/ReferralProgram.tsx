import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Download,
  Users,
  Share2,
  TrendingUp,
  DollarSign,
  Zap,
  Search,
  ChevronRight,
  GitMerge,
  Save,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { referralAPI, ReferralBonus, ReferralDetailRecord } from "@/lib/api";
import ReferralDownline from "./ReferralDownline";

type Page =
  | "dashboard"
  | "analytics"
  | "users"
  | "transactions"
  | "promo-codes"
  | "ledger"
  | "audits"
  | "fee"
  | "referral"
  | "referral-overview"
  | "referral-details"
  | "referral-explorer"
  | "competitions"
  | "segments"
  | "campaigns"
  | "withdrawals"
  | "admin-roles";

// ─── Base Helpers ────────────────────────────────────────────────────────────

function PurpleBtn({
  children,
  onClick,
  className = "",
  size = "md",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-xl font-bold text-white shadow-md transition-all hover:opacity-90 active:scale-95 ${
        size === "sm" ? "px-3 py-1.5 text-[11px]" : "px-4 py-2 text-[12px]"
      } ${className}`}
      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}
    >
      {children}
    </button>
  );
}

function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        {subtitle && <p className="text-[13px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl p-5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-[22px] font-bold text-foreground leading-none mt-1">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function TableWrap({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.025] border border-border rounded-xl overflow-x-auto w-full mb-4">
      <table className="w-full text-left border-collapse">{children}</table>
    </div>
  );
}

function THead({ cols }: { cols: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border bg-white/[0.02]">
        {cols.map((c, i) => (
          <th key={i} className="px-5 py-3 text-[10px] font-bold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
            {c}
          </th>
        ))}
      </tr>
    </thead>
  );
}

function Pagination({ page, total, perPage, onChange }: { page: number; total: number; perPage: number; onChange: (p: number) => void }) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 text-[12px] text-muted-foreground">
      <span>Showing {Math.min((page - 1) * perPage + 1, total)} - {Math.min(page * perPage, total)} of {total}</span>
      <div className="flex items-center gap-2">
        <button disabled={page <= 1} onClick={() => onChange(page - 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Previous</button>
        <span>Page {page} of {totalPages}</span>
        <button disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="px-3 py-1.5 rounded-lg border border-border disabled:opacity-40 hover:bg-white/5 transition-colors">Next</button>
      </div>
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`w-11 h-6 rounded-full transition-colors relative ${on ? "bg-primary" : "bg-secondary"}`}>
      <span className={`size-4 rounded-full bg-white absolute top-1 transition-transform ${on ? "left-6" : "left-1"}`} />
    </button>
  );
}

function ViralLoopEditor() {
  const [steps, setSteps] = useState([
    { id: 1, name: "Step 1 — Invite sent", desc: "User sends an invitation link to a friend", reward: 50, active: true },
    { id: 2, name: "Step 2 — Registered", desc: "Invited friend creates an account", reward: 200, active: true },
    { id: 3, name: "Step 3 — KYC / Wallet", desc: "Friend completes identity verification & links wallet", reward: 500, active: true },
    { id: 4, name: "Step 4 — ≥$100 in", desc: "Friend deposits $100 or more into wallet", reward: 1500, active: true },
    { id: 5, name: "Step 5 — First bill", desc: "Friend pays their first bill on Ravasend", reward: 1000, active: true },
    { id: 6, name: "Step 6 — ≥$500 in", desc: "Cumulative deposit reaches $500", reward: 3000, active: true },
    { id: 7, name: "Step 7 — ≥$1K in", desc: "Cumulative deposit reaches $1,000", reward: 7619, active: true },
  ]);
  const [savedToast, setSavedToast] = useState(false);

  const totalPossible = steps.reduce((sum, s) => sum + (s.active ? s.reward : 0), 0);

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
        <div>
          <p className="text-[13px] font-bold text-foreground">7-Step Tiered Rewards</p>
          <p className="text-[11px] text-muted-foreground">
            Max reward per invite: <span className="text-emerald-400 font-mono font-bold">₦{totalPossible.toLocaleString()}</span>
          </p>
        </div>
        <PurpleBtn size="sm" onClick={handleSave}>
          <Save size={11} /> Save Config
        </PurpleBtn>
      </div>

      {savedToast && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-2">
          <CheckCircle2 size={13} /> Reward configuration saved successfully.
        </div>
      )}

      <div className="space-y-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={`p-3.5 rounded-xl border transition-all ${
              step.active ? "bg-white/[0.02] border-border" : "bg-white/[0.008] border-border/40 opacity-60"
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div className="flex gap-2.5 min-w-0">
                <div className="size-6 rounded-lg bg-primary/15 border border-primary/25 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
                  {step.id}
                </div>
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-foreground">{step.name.split(" — ")[1] || step.name}</p>
                  <p className="text-[10px] text-muted-foreground">{step.desc}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex items-center bg-secondary border border-border rounded-lg overflow-hidden px-2 py-1">
                  <span className="text-[10px] text-muted-foreground mr-1">₦</span>
                  <input
                    type="number"
                    value={step.reward}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0;
                      setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, reward: val } : s)));
                    }}
                    className="w-16 bg-transparent text-[11px] font-mono font-bold text-foreground focus:outline-none"
                  />
                </div>
                <Toggle
                  on={step.active}
                  onToggle={() => setSteps((prev) => prev.map((s) => (s.id === step.id ? { ...s, active: !s.active } : s)))}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Referral Overview ───────────────────────────────────────────────────────

function ReferralOverviewPage({
  setPage,
  overviewData,
  isLoading,
  exportCsv,
}: {
  setPage: (p: Page) => void;
  overviewData?: { count?: number; data?: ReferralBonus[] };
  isLoading?: boolean;
  exportCsv?: () => void;
}) {
  const referrals: ReferralBonus[] = overviewData?.data || [];

  const totalReferrersCount = referrals.length;
  const totalInvites = overviewData?.count ?? referrals.length;
  const totalReward = referrals.reduce((sum, item) => sum + (item.amount || 0), 0);

  // Calculate conversion rate from actual data
  const convertedUsers = referrals.filter(r => r.userId?.dollarWallet && r.userId.dollarWallet > 0).length;
  const conversionRate = referrals.length > 0 ? Math.round((convertedUsers / referrals.length) * 100) : 0;

  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Referral Program</h1>
          <PurpleBtn size="sm" onClick={exportCsv}><Download size={12} /> Export CSV</PurpleBtn>
        </div>
        <p className="text-xs sm:text-sm text-muted-foreground">Track every invite, signup, and reward across your network.</p>
      </div>

      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map(t => (
          <button key={t.page} onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${t.page === "referral-overview" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={t.page === "referral-overview" ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}>
            {t.label}
          </button>
        ))}
      </div>

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

      <div className="bg-white/[0.025] border border-border rounded-xl p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[13px] font-bold text-foreground">Top Referrers</p>
            <p className="text-[11px] text-muted-foreground">By referrals sent and conversion rate</p>
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground text-[12px] flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={14} /> Loading referrers performance...
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
                        {r.userId?.fullName?.split(" ").map(w => w[0]).join("").slice(0, 2) || "??"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-foreground truncate">{r.userId?.fullName || "Unknown User"}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{r.userId?.email || "-"}</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="h-7 bg-secondary rounded-lg overflow-hidden relative">
                        <div className="h-full rounded-lg flex items-center justify-end px-2.5 transition-all"
                          style={{ width: `${Math.min(100, Math.max(20, (r.amount || 0) / 30 * 100))}%`, minWidth: 60, background: `linear-gradient(90deg, hsl(${260 + i * 30}, 70%, 45%), hsl(${260 + i * 30}, 70%, 55%))` }}>
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

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-5 mb-6">
        <div className="bg-white/[0.025] border border-border rounded-xl p-4 sm:p-5 overflow-y-auto max-h-[600px]">
          <ViralLoopEditor />
        </div>
        <div className="space-y-4">
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
              ].map(f => (
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
          <div className="bg-white/[0.025] border border-border rounded-xl p-5">
            <p className="text-[13px] font-bold text-foreground mb-3">Virality Metrics</p>
            <div className="space-y-3">
              {[
                { label: "K-Factor", value: "0.72", sub: "avg invites × conversion", color: "text-primary" },
                { label: "Avg time to Step 4", value: "11d", sub: "invite to first deposit", color: "text-amber-400" },
                { label: "Avg referrer lifetime", value: `₦${(totalReward / (referrals.length || 1)).toFixed(2)}`, sub: "avg reward earned", color: "text-emerald-400" },
                { label: "Viral cycle time", value: "4.2d", sub: "trigger to new signup", color: "text-violet-400" },
              ].map(m => (
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

// ─── Referral User Details ────────────────────────────────────────────────────

function ReferralDetailsPage({
  setPage,
  detailsData,
  isLoading,
  exportCsv,
}: {
  setPage: (p: Page) => void;
  detailsData?: ReferralDetailRecord[];
  isLoading?: boolean;
  exportCsv?: () => void;
}) {
  const [pg, setPg] = useState(1);
  const [search, setSearch] = useState("");
  const perPage = 8;

  const rows = detailsData?.map((d) => ({
    referred: d.user?.fullName || "Unknown User",
    rEmail: d.user?.email || "-",
    rPhone: d.user?.phoneNumber || "-",
    by: d.referredBy?.fullName || "",
    bEmail: d.referredBy?.email || "",
    stage: d.type || "welcome_bonus",
    amount: d.amount || 0,
    date: d.updatedAt ? new Date(d.updatedAt).toLocaleDateString() : new Date().toLocaleDateString(),
  })) || [];

  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  const STAGE_BADGE: Record<string, string> = {
    welcome_bonus: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20",
    invite_reward: "bg-violet-500/15 text-violet-400 border-violet-500/20",
    referral: "bg-blue-500/15 text-blue-400 border-blue-500/20",
  };
  const STAGE_LABEL: Record<string, string> = {
    welcome_bonus: "Welcome Bonus",
    invite_reward: "Invite Reward",
    referral: "Referral",
  };

  const filtered = rows.filter(r => !search || 
    r.referred.toLowerCase().includes(search.toLowerCase()) || 
    r.rEmail.toLowerCase().includes(search.toLowerCase()) || 
    r.by.toLowerCase().includes(search.toLowerCase())
  );
  const paged = filtered.slice((pg - 1) * perPage, pg * perPage);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Referral Program</h1>
        <PurpleBtn size="sm" onClick={exportCsv}><Download size={12} /> Export CSV</PurpleBtn>
      </div>
      <p className="text-xs sm:text-sm text-muted-foreground mb-6">Track every invite, signup, and reward across your network.</p>
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map(t => (
          <button key={t.page} onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${t.page === "referral-details" ? "text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            style={t.page === "referral-details" ? { background: "linear-gradient(135deg,#7B3FE4,#5B2AB8)" } : {}}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <StatCard label="Referral Records" value={String(rows.length)} sub="Total events logged" />
        <StatCard label="Total Rewards" value={`₦${rows.reduce((a, r) => a + r.amount, 0).toFixed(2)}`} sub="Combined payout amount" />
        <StatCard label="Referral Linked" value={String(rows.filter(r => r.by).length)} sub="Records with referrer" />
      </div>
      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1 flex items-center gap-2 bg-white/5 border border-border rounded-xl px-3.5 py-2.5">
          <Search size={13} className="text-muted-foreground shrink-0" />
          <input value={search} onChange={e => { setSearch(e.target.value); setPg(1); }} placeholder="Search by name or email…"
            className="bg-transparent text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none flex-1" />
        </div>
      </div>
      <TableWrap>
        <THead cols={["Referred User", "Referred By", "Stage", "Reward", "Date"]} />
        <tbody className="divide-y divide-border">
          {isLoading ? (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                <Loader2 className="animate-spin inline mr-2" size={14} /> Loading referral user details...
              </td>
            </tr>
          ) : paged.length > 0 ? (
            paged.map((r, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                      style={{ background: "linear-gradient(135deg, #7B3FE4, #5B2AB8)" }}>
                      {r.referred.split(" ").map(w => w[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-[12px] font-semibold text-foreground">{r.referred}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{r.rEmail}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4">
                  {r.by
                    ? <div><p className="text-[12px] font-semibold text-foreground">{r.by}</p><p className="text-[10px] text-muted-foreground">{r.bEmail}</p></div>
                    : <span className="text-[11px] text-muted-foreground italic">Organic signup</span>}
                </td>
                <td className="px-5 py-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${STAGE_BADGE[r.stage] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/20"}`}>
                    {STAGE_LABEL[r.stage] || r.stage}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <span className="text-[13px] font-mono font-bold text-emerald-400">+₦{r.amount.toFixed(2)}</span>
                </td>
                <td className="px-5 py-4 text-[11px] text-muted-foreground">{r.date}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="px-5 py-8 text-center text-[12px] text-muted-foreground">
                No referral details available
              </td>
            </tr>
          )}
        </tbody>
      </TableWrap>
      <Pagination page={pg} total={filtered.length} perPage={perPage} onChange={setPg} />
    </div>
  );
}

// ─── Referral Downline Tab Wrapper ──────────────────────────────────────────

function ReferralDownlineTabWrapper({ setPage }: { setPage: (p: Page) => void }) {
  const REFERRAL_TABS: { label: string; page: Page }[] = [
    { label: "Overview", page: "referral-overview" },
    { label: "User Details", page: "referral-details" },
    { label: "Downline Explorer", page: "referral-explorer" },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Referral Program
        </h1>
      </div>

      <p className="text-xs sm:text-sm text-muted-foreground mb-6">
        Track every invite, signup, and reward across your network.
      </p>

      {/* Referral tabs */}
      <div className="flex items-center gap-1 mb-7 bg-white/[0.03] border border-border rounded-xl p-1 w-full sm:w-fit overflow-x-auto">
        {REFERRAL_TABS.map((t) => (
          <button
            key={t.page}
            onClick={() => setPage(t.page)}
            className={`px-4 sm:px-5 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${
              t.page === "referral-explorer"
                ? "text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            style={
              t.page === "referral-explorer"
                ? {
                    background:
                      "linear-gradient(135deg,#7B3FE4,#5B2AB8)",
                  }
                : {}
            }
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Downline content */}
      <ReferralDownline isTab />
    </div>
  );
}

const ReferralProgram = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const activeTab =
    (searchParams.get("tab") as "overview" | "details" | "downline") ??
    "overview";

  const overviewQuery = useQuery({
    queryKey: ["referrals"],
    queryFn: referralAPI.getAll,
  });

  const detailsQuery = useQuery({
    queryKey: ["referral-details"],
    queryFn: referralAPI.getAllReferralDetails,
    enabled: activeTab === "details",
  });

  const handleTabChange = (page: Page) => {
    if (page === "referral-overview") {
      setSearchParams({ tab: "overview" });
    } else if (page === "referral-details") {
      setSearchParams({ tab: "details" });
    } else if (page === "referral-explorer") {
      setSearchParams({ tab: "downline" });
    } else {
      navigate(`/admin/${page}`);
    }
  };

  const exportCsv = () => {
    const list: ReferralBonus[] = overviewQuery.data?.data || [];

    if (!list.length) return;

    const headers = [
      "Referrer Name",
      "Referrer Email",
      "Deposit (USD)",
      "Reward (NGN)",
    ];

    const rows = list.map((item) => [
      item.userId?.fullName || "Unknown User",
      item.userId?.email || "-",
      (item.userId?.dollarWallet || 0).toFixed(2),
      (item.amount || 0).toFixed(2),
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers, ...rows]
        .map((e) => e.join(","))
        .join("\n");

    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `referral-report-${new Date().toISOString()}.csv`
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (activeTab === "details") {
    return (
      <ReferralDetailsPage
        setPage={handleTabChange}
        detailsData={detailsQuery.data?.data}
        isLoading={detailsQuery.isLoading}
        exportCsv={exportCsv}
      />
    );
  }

  if (activeTab === "downline") {
    return <ReferralDownlineTabWrapper setPage={handleTabChange} />;
  }

  return (
    <ReferralOverviewPage
      setPage={handleTabChange}
      overviewData={overviewQuery.data}
      isLoading={overviewQuery.isLoading}
      exportCsv={exportCsv}
    />
  );
};

export default ReferralProgram;